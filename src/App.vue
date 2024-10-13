<script setup>
import { onMounted } from 'vue';
import { Tensor, add } from './fastCalculate';
async function setupVectors() {
  const tensor_1 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_2 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_3 = add(tensor_1, tensor_2);
  const tensor_4 = add(tensor_1, tensor_3);
  console.log(await tensor_4.getData());
}

onMounted(() => {
  setupVectors();
});
</script>





<template>
  <div></div>
</template>