<template>
  <table class="leaderboard">
    <thead>
      <tr>
        <td>Name</td>
        <td>Cycles</td>
        <td>Instructions</td>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(val, key) in data" :key="key">
        <td>{{ key }}</td>
        <td>{{ val.cycles }}</td>
        <td>{{ val.instructions }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    data: { type: Object }
  }
});
</script>

<style scoped>
.leaderboard {
  border-collapse: collapse;
  width: 100%;
}

.leaderboard td {
  padding: 0.25em 0.5em;
}

.leaderboard thead td {
  font-variant: small-caps;
  font-weight: 700;
  border-bottom: solid 1px #8198b1;
}

.leaderboard tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.05);
}

.leaderboard td:not(:first-child) {
  text-align: center;
}
</style>