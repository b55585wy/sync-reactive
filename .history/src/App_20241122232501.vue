<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(async () => {
  await settingsStore.initializeSettings()
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style> 