<script setup>
import { init, add } from "./fastCalculate/index"
async function main(){
  let a = [];
  let b = [];
  for(let i = 0; i < 100; i++){
    a.push(Math.random() * 1000);
    b.push(Math.random() * 1000);
  }
  await init();

  console.time();
  const s = await add(a, b);

  console.time();
  let c = [];
  for(let i = 0; i < 10000; i++){
    c.push(a[i] + b[i]);
  }
  console.timeEnd();
}
main()
</script>




<template>
  <div></div>
</template>