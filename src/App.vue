<script setup>
import { init, add } from "./fastCalculate/index"
async function main(){
  await init();

  
  add([1,3, 10], [1, 5, 2]);
}
main()
</script>




<template>
  <div></div>
</template>