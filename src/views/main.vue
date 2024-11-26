<template>
    <div class="main">
        <!-- 文件选择器 -->
        <input type="file" @change="readCsv" accept=".txt, .csv" />
        <button @click="compute">标准化</button>
        <!-- 显示文件内容 -->
         <p>{{ "数据量:" + rows }}</p>
         <p>{{ "特征量:" + columns }}</p>
        <p>{{ time + "毫秒" }}</p>
        <p>{{ "适配器:" + adapter?.info.vendor }}</p>
    </div>
</template>

<script setup lang="ts">
import { adapter, device } from '../Calculate/basic/global';
import { ref } from 'vue';
import { readCsvAsTable } from '../Calculate/FileReader/FileReader';
import { tensor, tensorsRead } from '../Calculate/tensor/tensor';
import { StandScaler } from '../Calculate/preprocess/preprocess';
const time = ref(0);

// 用来存储读取到的文件内容
const fileContent = ref<any[][] | null>(null);
const rows = ref(0);
const columns = ref(0);

async function compute() {
    if(fileContent.value == null) throw new Error("file not exits!");
    const start = performance.now();
    rows.value = fileContent.value.length;
    columns.value = fileContent.value[0].length;
    const tensor_array = fileContent.value.map(v => { return tensor.JSArray(v); });
    const scaler = new StandScaler();
    scaler.fit_transform(tensor_array);
    fileContent.value = await tensorsRead(tensor_array);
    const end = performance.now();
    time.value = end - start;
}

async function readCsv(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];

    if (file) {
        try {
            if (file.type === 'text/csv' || file.name.endsWith('.csv') || file.type === 'text/plain' || file.name.endsWith('.txt')) {
                // 使用 async/await 等待文件读取完成
                fileContent.value = await readCsvAsTable(file);
            } else {
                alert('请选择有效的文本文件或 CSV 文件');
            }
        } catch (error) {
            console.error('文件读取失败', error);
            alert('文件读取失败，请重试');
        }
    }

    console.log(fileContent.value);
}
</script>

<style lang="css" scoped>
.main {
    position: absolute;
    left: 18vw;
    top: 0;
    height: 100vh;
    padding: 20px;
}

.file-content {
    margin-top: 20px;
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 8px;
    max-width: 90%;
    white-space: pre-wrap;
    word-wrap: break-word;
}
td{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
}
tr{
    margin:0.5vw;
    background: #FFFFFF;
}
</style>