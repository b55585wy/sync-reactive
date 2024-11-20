<template>
  <view>
    <page-meta>
      <navigation-bar />
    </page-meta>
    <view class="container">
      <router-view></router-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>

<style>
page {
  background-color: #f5f5f5;
}

.container {
  width: 100%;
  min-height: 100vh;
}
</style> 