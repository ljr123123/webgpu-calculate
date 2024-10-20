<script setup>
import { onMounted, ref, computed } from 'vue';
import { Tensor, add, zipToImages, getCount} from '../fastCalculate';
import { getFileCountFromZip } from '../fastCalculate/FIleReader';
import ProcessBar from '../Components/ProcessBar.vue';
import { fit_transform } from '../fastCalculate/transforms';
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
    is_loading.value = true;
  const target = event.target;
    if (target.files == null) return; // 检查 files 是否存在
    const file = target.files[0];
    if(file) {
        try {
            imageNumber.value = await getFileCountFromZip(file);
            interval = setInterval(() => checkSolve(), intervalRefresh);
           imagesData.value = await zipToImages(file);
          } catch (error) {
            console.error(error);
          }
    }
}
function checkSolve() {
  const solve = getCount();
  
    solveNumber.value = solve;
    if(solve == imageNumber.value) {
    clearInterval(interval);
  }
}
async function modelTraining() {
    let tensor;
    imagesData.value.forEach(element => {
        tensor = new Tensor(element.data, "uint8", [element.height, element.width, 4], true);
        tensor_box.push(tensor);
    });
    await fit_transform(tensor_box);
}
const imageNumber = ref(0);
const solveNumber = ref(0);
const imagesData = ref([]);
const tensor_box = [];
const intervalRefresh = 200;
const is_loading = ref(false);
let interval = undefined;
onMounted(() => {
  setupVectors();
});
</script>
<template>
  <div class="main">
    <input type="file" @change="setImageData"/>
    <ProcessBar :progress="imageNumber ? (solveNumber / imageNumber) * 100 : 0" :is_loading="is_loading"/>
    <button @click="modelTraining()">模型训练</button>
  </div>
</template>