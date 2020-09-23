<template>
  <div class="hello">
    <button @click="get">Get</button>
    <pre>{{response}}</pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HelloWorld",
  props: {
    problem: { type: Number, required: true }
  },
  data: function() {
    return { response: "Waiting..." };
  },
  methods: {
    get: async function() {
      this.response = "Fetching...";
      try {
        const r = await fetch(`http://localhost:3001/${this.problem}`);
        this.response = await r.text();
      } catch (e) {
        this.response = e;
      }
    }
  },
  watch: {
    problem: function() {
      this.get();
    }
  },
  mounted: function() {
    this.get();
  }
});
</script>

<style scoped>
</style>
