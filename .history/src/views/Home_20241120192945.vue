<template>
  <div class="home" style="border: 2px solid red;">
    <h1 style="color: red;">测试渲染</h1>
    {{ debugInfo }}
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'Home',
  setup() {
    const debugInfo = ref('如果你能看到这段文字，说明组件正在正常渲染')

    onMounted(() => {
      console.log('组件已挂载')
    })

    return {
      debugInfo
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
  min-height: 100vh;
  background-color: white;
}
</style> 