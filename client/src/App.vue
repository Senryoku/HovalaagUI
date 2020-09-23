<template>
  <div style="display:flex">
    <div style="min-width:40vw">
      <div>
        <div class="vasm-controls">
          <div>Solution - VASM</div>
          <div>
            <button @click="run">Run</button>
            <button @click="debug">Debug</button>
          </div>
        </div>
        <textarea placeholder="VASM" v-model="vasm" rows="20" style="width:100%"></textarea>
      </div>
      <!--<pre>{{response}}</pre>-->
      <pre v-if="response.error">{{response.error}}</pre>
      <pre v-if="response.stdout">{{response.stdout}}</pre>
      <pre v-if="response.stderr" class="stderr">{{response.stderr}}</pre>
    </div>
    <div style="margin-left:1em">
      <label for="problem-select">Problem:</label>
      <select v-model="problem" id="problem-select">
        <option v-for="i in [1, 2, 3, 4, 5, 6, 7, 8 ,9, 10, 11, 12, 13]" :key="i" :value="i">{{i}}</option>
      </select>
      <ProblemDescription :problem="problem" />
    </div>
  </div>
  <div v-html="debugLog" class="logs"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ProblemDescription from "./components/ProblemDescription.vue";
import { v4 as uuidv4 } from "uuid";

export default defineComponent({
  name: "App",
  components: {
    ProblemDescription
  },
  data: function() {
    return { uid: "", problem: 1, vasm: "", response: "...", debugLog: "" };
  },
  mounted: function() {
    const uid: any = localStorage.getItem(`uid`);
    if (uid) this.uid = uid;
    else {
      this.uid = uuidv4();
      localStorage.setItem(`uid`, this.uid);
    }
    const currentProblem: any = localStorage.getItem(`problem`);
    if (currentProblem) this.problem = +currentProblem;
    this.loadVasm();
  },
  watch: {
    vasm: function() {
      localStorage.setItem(`Problem-${this.problem}`, this.vasm);
    },
    problem: function() {
      this.loadVasm();
      localStorage.setItem(`problem`, this.problem.toString());
    }
  },
  methods: {
    loadVasm: function() {
      const vasm = localStorage.getItem(`Problem-${this.problem}`);
      if (vasm) this.vasm = vasm;
    },
    run: async function() {
      try {
        const r = await fetch(
          `http://localhost:3001/${this.uid}/${this.problem}`,
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
      } catch (e) {
        this.response = e;
      }
    },
    debug: async function() {
      try {
        const r = await fetch(
          `http://localhost:3001/trace/${this.uid}/${this.problem}`,
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
        const log = await fetch(`http://localhost:3001/log/${this.uid}`);
        this.debugLog = (await log.text())
          .replace(
            'cellspacing=0 border=1 cellpadding=2 bordercolor="#808080"',
            ""
          )
          .replaceAll("bgcolor=#c0ffc0", 'class="jump"')
          .replaceAll("bgcolor=#ff4040", 'class="error"');
      } catch (e) {
        console.error("Caught Error: " + e);
      }
    }
  }
});
</script>

<style>
html,
input,
select,
button,
textarea {
  color: #8198b1;
  background-color: #111;
}

select,
button {
  padding: 0.2em 0.5em;
  margin: 0.25em;
}

button:hover {
  cursor: pointer;
}

input,
select,
button,
textarea {
  border: solid 1px #8198b1;
  border-radius: 0.25em;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 1em;
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
  padding: 0 0.25em;
  border: solid 1px #8198b1;
}

.logs table td.jump {
  background-color: #165900;
}

.logs table tr.error {
  background-color: #a60000;
}
</style>
