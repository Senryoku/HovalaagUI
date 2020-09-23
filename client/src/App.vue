<template>
  <div style="display:flex">
    <div>
      <textarea placeholder="VASM" v-model="vasm" rows="20" cols="80"></textarea>
      <button @click="run">Run</button>
      <button @click="debug">Debug</button>
      <pre>{{response}}</pre>
      <pre v-if="response.error">{{response.error}}</pre>
      <pre v-if="response.stdout">{{response.stdout}}</pre>
      <pre v-if="response.stderr" class="stderr">{{response.stderr}}</pre>
    </div>
    <div>
      <select v-model="problem">
        <option v-for="i in [1, 2, 3, 4, 5, 6, 7, 8 ,9, 10, 11, 12, 13]" :key="i" :value="i">{{i}}</option>
      </select>
      <HelloWorld :problem="problem" />
    </div>
  </div>
  <iframe id="debug-iframe" src="http://localhost:3001/log" width="100%"></iframe>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelloWorld from "./components/HelloWorld.vue";

export default defineComponent({
  name: "App",
  components: {
    HelloWorld
  },
  data: function() {
    return { problem: 1, vasm: "", response: "..." };
  },
  mounted: function() {
    this.loadVasm();
  },
  watch: {
    vasm: function() {
      localStorage.setItem(`Problem-${this.problem}`, this.vasm);
    },
    problem: function() {
      this.loadVasm();
    }
  },
  methods: {
    loadVasm: function() {
      const vasm = localStorage.getItem(`Problem-${this.problem}`);
      if (vasm) this.vasm = vasm;
    },
    run: async function() {
      this.response = "Fetching...";
      try {
        const r = await fetch(`http://localhost:3001/${this.problem}`, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ vasm: this.vasm })
        });
        this.response = await r.json();
      } catch (e) {
        this.response = e;
      }
    },
    debug: async function() {
      this.response = "Fetching...";
      try {
        const r = await fetch(`http://localhost:3001/logs/${this.problem}`, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ vasm: this.vasm })
        });
        this.response = await r.json();
        const iframe = document.getElementById(
          "debug-iframe"
        ) as HTMLIFrameElement;
        if (iframe && iframe.contentWindow)
          iframe.contentWindow.location.reload();
      } catch (e) {
        console.error("Caught Error: " + e);
      }
    }
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}

.stderr {
  color: red;
}

pre {
  white-space: pre-wrap;
}
</style>
