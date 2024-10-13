<script setup>
import { onMounted } from 'vue';
import { Tensor } from './fastCalculate/BasicDataType';
import { add } from './fastCalculate/BasicOperations/add';
async function setupVectors() {
  const tensor_1 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const tensor_2 = new Tensor([[1.2,1.4],[1.1,3.2]], "float32");
  const result = await add(tensor_1, tensor_2).getData();
  console.log(result);
}

onMounted(() => {
  setupVectors();
});
</script>





<template>
  <div></div>
</template>