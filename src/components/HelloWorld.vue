<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1 class="text-2xl mb-4">{{ msg }}</h1>

  <div class="card p-4 bg-white rounded-lg shadow-md">
    <div class="flex items-center justify-center">
      <button
        class="btn px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
        @click="count++"
      >
        count is: {{ count }}
      </button>
    </div>
    <p class="mt-4">
      Edit
      <code class="text-gray-500">components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p class="mt-6">
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p>
    Install
    <a href="https://github.com/johnsoncodehk/volar" target="_blank"
      >Volar</a
    >
    in your IDE for a better DX
  </p>
  <p class="mt-6 text-gray-500">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.card {
  border: 1px solid #e2e8f0;
}
</style>
