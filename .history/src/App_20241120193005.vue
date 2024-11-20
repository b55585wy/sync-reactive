<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  min-height: 100vh;
}

/* 重置一些基本样式 */
body, html {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style> 