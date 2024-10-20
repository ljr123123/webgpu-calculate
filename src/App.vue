<script setup>
import { onMounted, ref } from 'vue';
import { Tensor, add, zipToImages, getCount } from './fastCalculate';
import { getFileCountFromZip } from './fastCalculate/FIleReader';
import ProcessBar from './Components/ProcessBar.vue';

const imageNumber = ref(0);
const solveNumber = ref(0);
const imagesData = ref([]);
let interval = undefined;

async function setupVectors() {
  const tensor_1 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_2 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_3 = add(tensor_1, tensor_2);
  const tensor_4 = add(tensor_1, tensor_3);
  console.log(await tensor_4.getData());
}

async function setImageData(event) {
  const target = event.target;
  if (target.files == null) return; // 检查 files 是否存在
  const file = target.files[0];
  if (file) {
    try {
      imageNumber.value = await getFileCountFromZip(file);
      const imageDataArray = await zipToImages(file);
      imagesData.value = imageDataArray.map(imageData => {
        return createImageUrl(imageData);
      });
      interval = setInterval(() => checkSolve(), 1000);
    } catch (error) {
      console.error(error);
    }
  }
}

function createImageUrl(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL(); // 转换为可用的 URL
}

function checkSolve() {
  const solve = getCount();
  solveNumber.value = solve;
  console.log(solveNumber.value, imageNumber.value);
  if (solve === imageNumber.value) {
    clearInterval(interval);
  }
}

onMounted(() => {
  setupVectors();
});
</script>

<template>
  <div class="main">
    <input type="file" @change="setImageData" />
    <ProcessBar :progress="imageNumber ? (solveNumber / imageNumber) * 100 : 0" />
    <div class="image-gallery">
      <img v-for="(image, index) in imagesData" :key="index" :src="image" alt="Parsed Image" />
    </div>
  </div>
</template>

<style>
.image-gallery {
  display: flex;
  flex-wrap: wrap;
}

.image-gallery img {
  max-width: 100px;
  margin: 5px;
}
</style>