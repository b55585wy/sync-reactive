<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useSettingsStore } from '@/stores/settings' // 添加这行导入

// 将 store 初始化移到 onMounted 中
onMounted(async () => {
  const settingsStore = useSettingsStore()
  await settingsStore.initializeSettings()
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style> 