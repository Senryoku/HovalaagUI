<template>
  <div class="main-container">
    <div style="grid-area: left-col;">
      <div>
        <div class="vasm-controls">
          <div>Solution - VASM</div>
          <div>
            <label for="problem-select">Problem:</label>
            <select v-model="problem" id="problem-select">
              <option
                v-for="i in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]"
                :key="i"
                :value="i"
                >{{ i }}</option
              >
            </select>
          </div>
          <div>
            <button @click="run">Run</button>
            <button @click="debug">Debug</button>
          </div>
        </div>
        <textarea
          placeholder="VASM"
          v-model="vasm"
          rows="20"
          style="width:100%; box-sizing: border-box;"
          spellcheck="false"
        ></textarea>
      </div>
      <!--<pre>{{response}}</pre>-->
      <!--<pre v-if="response.error">{{ response.error }}</pre>-->
      <pre v-if="response.stdout" id="console-stdout">{{
        response.stdout
      }}</pre>
      <pre v-if="response.stderr" id="console-stderr" class="stderr">{{
        response.stderr
      }}</pre>
    </div>
    <div style="grid-area: right-col; margin-left:1em">
      <div>
        <div class="tabs">
          <div
            v-for="name in [
              'Instructions',
              'Problem Description',
              'Trace',
              'Leaderboard'
            ]"
            :key="name"
            @click="selectedTab = name"
            :class="{ selected: selectedTab == name }"
          >
            {{ name }}
          </div>
        </div>
        <div class="displayed-tab">
          <ProblemDescription
            v-show="selectedTab === 'Problem Description'"
            :problem="problem"
          />
          <div v-show="selectedTab === 'Instructions'">
            <pre>{{ instructions }}</pre>
          </div>
          <div
            v-show="selectedTab === 'Trace'"
            v-html="debugLog"
            class="logs"
          ></div>
          <div v-show="selectedTab === 'Leaderboard'">
            <div>
              <input
                type="text"
                placeholder="User Name"
                v-model="userName"
                maxlength="256"
              />
              <button
                @click="submitScore"
                :class="{ disabled: userName === '' }"
              >
                Submit Score
              </button>
              <button @click="loadLeaderboard">Refresh</button>
            </div>
            <div
              v-if="
                !leaderboard ||
                  !leaderboard[problem] ||
                  Object.values(leaderboard[problem]) === 0
              "
              style="text-align:center; padding: 1em;"
            >
              No leaderboard entry for this problem yet.
            </div>
            <div v-else>
              <h2 style="text-align: center">
                Leaderboard for Problem #{{ problem }}
              </h2>
              <leaderboard :leaderboard="leaderboard[problem]"></leaderboard>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer>
      Hovalaag by Sean Barrett (<a
        href="https://silverspaceship.com/hovalaag/"
        target="_blank"
        >https://silverspaceship.com/hovalaag/</a
      >) - UI by Senryoku (<a href="https://senryoku.github.io/" target="_blank"
        >https://senryoku.github.io/</a
      >)
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ProblemDescription from "./components/ProblemDescription.vue";
import Leaderboard from "./components/Leaderboard.vue";
import { v4 as uuidv4 } from "uuid";
import typingAnimation from "./TypingAnimation";

const apiHost = `http://${window.location.hostname}:3001`;

export default defineComponent({
  name: "App",
  components: {
    ProblemDescription,
    Leaderboard
  },
  data: function() {
    return {
      uid: "",
      problem: 1,
      vasm: "",
      response: { stdout: "Waiting for command...", stderr: "" },
      debugLog: "Run in Debug to get a trace of your program.",
      selectedTab: "Instructions",
      instructions: "",
      userName: "",
      leaderboard: {}
    };
  },
  mounted: async function() {
    const uid: any = localStorage.getItem(`uid`);
    if (uid) this.uid = uid;
    else {
      this.uid = uuidv4();
      localStorage.setItem(`uid`, this.uid);
    }
    const userName: any = localStorage.getItem(`userName`);
    if (userName) this.userName = userName;
    const currentProblem: any = localStorage.getItem(`problem`);
    if (currentProblem) this.problem = +currentProblem;
    this.loadVasm();

    this.instructions = await (
      await fetch("http://localhost:3001/instructions")
    ).text();

    this.loadLeaderboard();
  },
  watch: {
    vasm: function() {
      localStorage.setItem(`Problem-${this.problem}`, this.vasm);
    },
    problem: function() {
      this.loadVasm();
      localStorage.setItem(`problem`, this.problem.toString());
    },
    userName: function() {
      localStorage.setItem(`userName`, this.userName);
    },
    response: function() {
      let el = document.getElementById("console-stdout");
      if (el) typingAnimation(el, this.response.stdout);
      el = document.getElementById("console-stderr");
      if (el) typingAnimation(el, this.response.stderr);
    }
  },
  methods: {
    loadVasm: function() {
      const vasm = localStorage.getItem(`Problem-${this.problem}`);
      if (vasm) this.vasm = vasm;
    },
    run: async function() {
      try {
        const r = await fetch(`${apiHost}/${this.uid}/${this.problem}`, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ vasm: this.vasm })
        });
        this.response = await r.json();
      } catch (e) {
        console.error("Caught Error: " + e);
      }
    },
    debug: async function() {
      try {
        const r = await fetch(`${apiHost}/trace/${this.uid}/${this.problem}`, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ vasm: this.vasm })
        });
        this.response = await r.json();
        if (
          this.response.stderr.includes("Saving execution trace to 'log.html'")
        ) {
          const log = await fetch(`${apiHost}/log/${this.uid}`);
          this.debugLog = (await log.text())
            .replace(
              'cellspacing=0 border=1 cellpadding=2 bordercolor="#808080"',
              ""
            )
            .replaceAll("bgcolor=#c0ffc0", 'class="jump"')
            .replaceAll("bgcolor=#ff4040", 'class="error"');
          this.selectedTab = "Trace";
        }
      } catch (e) {
        console.error("Caught Error: " + e);
      }
    },
    submitScore: async function() {
      try {
        const r = await fetch(
          `${apiHost}/submit/${this.userName}/${this.problem}`,
          {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ vasm: this.vasm })
          }
        );
        this.response = await r.json();
        this.loadLeaderboard();
      } catch (e) {
        console.error("Caught Error: " + e);
      }
    },
    loadLeaderboard: async function() {
      this.leaderboard = await (await fetch(`${apiHost}/leaderboard`)).json();
    }
  }
});
</script>

<style>
a,
a:visited {
  color: white;
}

html {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
input,
select,
button,
textarea {
  color: #8198b1;
  background-color: #111;
}

input,
select,
button {
  padding: 0.2em 0.5em;
  margin: 0.25em;
}

input,
select,
button,
textarea {
  border: solid 1px #8198b1;
  border-radius: 0.25em;
}

textarea {
  padding: 0.25em 0.5em;
  background-color: rgba(255, 255, 255, 0.05);
}

button:hover {
  cursor: pointer;
  color: white;
  border-color: white;
}

button:active {
  transform: translateY(2px);
}

pre,
textarea {
  font-family: "Consolas", "Inconsolata", monospace;
}

.disabled {
  color: gray;
  pointer-events: none;
}

.clickable:hover {
  color: white;
  cursor: pointer;
}

.main-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "left-col right-col"
    "footer footer";
  box-sizing: border-box;
  min-height: calc(100vh - 2em);
  margin: 1em;
}

footer {
  margin-top: 2em;
  margin-bottom: 1em;
}

.stderr {
  color: red;
}

pre {
  white-space: pre-wrap;
}

.vasm-controls {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.tabs {
  display: flex;
}

.tabs > div {
  border-left: solid 1px #8198b1;
  border-right: solid 1px #8198b1;
  border-top: solid 1px #8198b1;
  padding: 0.25em 0.5em;
  border-radius: 5px 5px 0 0;
}

.tabs > div.selected {
  border-bottom: solid 1px black;
}

.tabs > div:not(.selected) {
  cursor: pointer;
}

.displayed-tab {
  border: solid 1px #8198b1;
  margin-top: -1px;
  border-radius: 0 5px 5px 5px;
  padding: 0.5em;
}

.displayed-tab pre {
  margin: 0;
}

.logs table {
  margin: auto;
  border: 0;
  border-collapse: collapse;
  color: aliceblue;
}

.logs table tr {
  border: solid 1px #8198b1;
  border-radius: 5px;
}

.logs table td {
  padding: 0 0.5em;
  border: solid 1px #8198b1;
}

.logs table td.jump {
  background-color: #165900;
}

.logs table tr.error {
  background-color: #a60000;
}
</style>
