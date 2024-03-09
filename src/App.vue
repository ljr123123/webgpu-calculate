<script setup>
import { init, add } from "./fastCalculate/index"
async function main(){
  await init();

  
  const s = await add([1,3, 10], [1, 5, 2]);
  console.log("result", s);
}
main()
</script>




<template>
  <div></div>
</template>