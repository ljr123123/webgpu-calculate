<script setup>
import { onMounted, ref, computed } from 'vue';
import { Tensor, add, zipToImages, getCount } from './fastCalculate';
import { getFileCountFromZip } from './fastCalculate/FIleReader';
import ProcessBar from './Components/ProcessBar.vue';
const count = ref(0);

async function setupVectors() {
  const tensor_1 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_2 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_3 = add(tensor_1, tensor_2);
  const tensor_4 = add(tensor_1, tensor_3);
  console.log(await tensor_4.getData());
  stop()
}

async function setImageData(event) {
  const target = event.target;
    if (target.files == null) return; // 检查 files 是否存在
    const file = target.files[0];
    if(file) {
        try {
            imageNumber.value = await getFileCountFromZip(file);
            interval = setInterval(() => checkSolve(), 1000);
           imagesData.value = await zipToImages(file);
          } catch (error) {
            console.error(error);
          }
    }
}
function checkSolve() {
  const solve = getCount();
  
    solveNumber.value = solve;
    console.log(solveNumber.value, imageNumber.value);
    if(solve == imageNumber.value) {
    clearInterval(interval);
  }
  
}
const imageNumber = ref(0);
const solveNumber = ref(0);
const imagesData = ref([]);
let interval = undefined;
onMounted(() => {
  setupVectors();
});
</script>
<template>
  <div class="main">
    <input type="file" @change="setImageData"/>
    <ProcessBar :progress="imageNumber ? (solveNumber / imageNumber) * 100 : 0"/>
  </div>
</template>