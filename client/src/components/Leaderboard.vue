<template>
  <table class="leaderboard">
    <thead>
      <tr>
        <td>Name</td>
        <td @click="order = 'cycles'" class="clickable">Cycles</td>
        <td @click="order = 'instructions'" class="clickable">Instructions</td>
      </tr>
    </thead>
    <tbody>
      <tr v-for="val in ordered" :key="val.name">
        <td>{{ val.name }}</td>
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
    leaderboard: { type: Object }
  },
  data: function() {
    return {
      order: "cycles"
    };
  },
  computed: {
    ordered: function(): any {
      if (!this.leaderboard) return [];
      const d = this.leaderboard;

      const orderedKey = Object.keys(d).sort(
        (lhs, rhs) => d[lhs][this.order] - d[rhs][this.order]
      );
      return orderedKey.map(key => {
        return {
          name: key,
          cycles: d[key].cycles,
          instructions: d[key].instructions
        };
      });
    }
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