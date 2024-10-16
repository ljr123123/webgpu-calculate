<template>
    <div class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>
  </template>
  
  <script setup>

  
  const props = defineProps({
    progress: {
      type: Number,
      required: true,
    },
  });
  </script>
  
  <style scoped>
  .progress-bar {
    width: 100px;
    height: 20px;
    background-color: #f3f3f3;
    border-radius: 5px;
    overflow: hidden;
  }
  
  .progress {
    height: 20px;
    background-color: #4caf50; /* 进度条颜色 */
    transition: width 0.2s ease;
  }
  </style>
  