<script setup>
import { onMounted, ref } from 'vue';
import { Tensor, add, zipToImages, getCount } from '../fastCalculate';
import { getFileCountFromZip } from '../fastCalculate/FIleReader';
import ProcessBar from '../Components/ProcessBar.vue';
import { getMeanAndStd, getMaxAndMin, Normalize } from '../fastCalculate/transforms';


const imageNumber = ref(0);
const solveNumber = ref(0);
const imagesData = ref([]);
const imageTensor = [];
const is_loading = ref(false);
let interval = undefined;

async function setupVectors() {
  const tensor_1 = new Tensor([[1.2,1.4],[1.1,3.2]]);
  const tensor_2 = new Tensor([[1.2,1.4],[1.1,3.2]]);
  const tensor_3 = add(tensor_1, tensor_2);
  const tensor_4 = add(tensor_1, tensor_3);
}

async function setImageData(event) {
  const target = event.target;
  if (target.files == null) return; // 检查 files 是否存在
  const file = target.files[0];
  if (file) {
    try {
      imageNumber.value = await getFileCountFromZip(file);
      interval = setInterval(() => checkSolve(), 50);
      const imageDataArray = await zipToImages(file, 10000);
      imagesData.value = imageDataArray.map(imageData => {
        let tensor = new Tensor(imageData.data, [imageData.height, imageData.width, 3]);
        imageTensor.push(tensor);
        return undefined;
        // return createImageUrl(imageData);
      });
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


function checkSolve() {
  const solve = getCount();
  console.log(solve);
  solveNumber.value = solve;
  if (solve === imageNumber.value) {
    clearInterval(interval);
  }
}

async function modelTraining() {
  // fit_transform(imageTensor);
  const result = await getMeanAndStd(imageTensor);
  await Normalize(imageTensor, result[0], result[1]);
}

async function n() {
  // fit_transform(imageTensor);
  
}

onMounted(() => {
  setupVectors();
});
</script>
<template>
  <div class="main">
    <input type="file" @change="setImageData"/>
    <ProcessBar :progress="imageNumber ? (solveNumber / imageNumber) * 100 : 0" :is_loading="is_loading"/>
    <button @click="modelTraining()">模型训练</button>
    <button @click="n()">标准化</button>
    <div class="image-gallery">
      <img v-for="(image, index) in imagesData" :key="index" :src="image" alt="Parsed Image" />
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