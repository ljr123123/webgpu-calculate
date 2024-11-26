<script setup>
import { test } from '../Calculate/example';
import { onMounted } from 'vue';
function createImageUrl(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');

  // 创建 RGBA 数据
  const rgbaData = new Uint8ClampedArray(imageData.width * imageData.height * 4);
  
  for (let i = 0; i < imageData.data.length; i += 3) {
    const r = imageData.data[i];     // Red
    const g = imageData.data[i + 1]; // Green
    const b = imageData.data[i + 2]; // Blue
    
    const index = (i / 3) * 4; // 新索引
    rgbaData[index] = r;
    rgbaData[index + 1] = g;
    rgbaData[index + 2] = b;
    rgbaData[index + 3] = 255; // 设置 Alpha 为 255
  }

  const newImageData = new ImageData(rgbaData, imageData.width, imageData.height);
  ctx.putImageData(newImageData, 0, 0);
  return canvas.toDataURL(); // 转换为可用的 URL
}



</script>
<template>
  <div class="main">
    <input type="file" @change="main"/>
    <!--<ProcessBar :progress="imageNumber ? (solveNumber / imageNumber) * 100 : 0" :is_loading="is_loading"/>-->
    
    <div class="image-gallery">
      <!--<img v-for="(image, index) in imagesData" :key="index" :src="image" alt="Parsed Image" />-->
    </div>
  </div>
</template>
<style scoped>
.image-gallery {
  display: flex;
  flex-wrap: wrap;
}

.image-gallery img {
  max-width: 100px;
  margin: 5px;
}
</style>