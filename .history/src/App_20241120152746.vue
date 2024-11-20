<template>
  <div class="app-container">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  console.log("App Mounted")
})

onBeforeUnmount(() => {
  console.log("App Unmounted")
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.app-container {
  width: 100%;
  min-height: 100vh;
}
</style> 