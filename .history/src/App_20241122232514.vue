<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

export default {
  name: 'App'
}
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style> 