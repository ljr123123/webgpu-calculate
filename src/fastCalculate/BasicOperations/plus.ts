function tensorMultiply<T>(A: T[], B: T[], dimsA: number[], dimsB: number[]): T[] {
    const rankA = dimsA.length;
    const rankB = dimsB.length;

    // 检查维度是否匹配
    if (dimsA[rankA - 1] !== dimsB[rankB - 2]) {
        throw new Error("Dimensions do not match for multiplication");
    }

    // 计算结果的维度
    const resultDims = [...dimsA.slice(0, rankA - 1), dimsB[rankB - 1]];
    const totalResultSize = resultDims.reduce((a, b) => a * b, 1);

    const result: T[] = Array(totalResultSize).fill(0 as any); // 使用泛型保持类型

    const indicesA = Array(rankA).fill(0);
    const indicesB = Array(rankB).fill(0);

    for (let i = 0; i < totalResultSize; i++) {
        // 计算当前结果的索引
        let idxA = 0;
        let idxB = 0;

        // 计算结果索引
        let temp = i;
        for (let j = resultDims.length - 1; j >= 0; j--) {
            idxA += indicesA[j] * (dimsA[j + 1] || 1);
            idxB += indicesB[j] * dimsB[j];
            indicesA[j] = Math.floor(temp % resultDims[j]);
            temp = Math.floor(temp / resultDims[j]);
        }

        // 计算乘法
        for (let j = 0; j < dimsA[rankA - 1]; j++) {
            result[i] = (result[i] || 0) + (A[idxA + j] as any) * (B[idxB + j] as any);
        }
    }

    return result;
}

// 示例用法
const A = [1, 2, 3, 4]; // 2x2 张量
const B = [5, 6, 7, 8]; // 2x2 张量
const dimsA = [2, 2];  // A 的维度
const dimsB = [2, 2];  // B 的维度

const result = tensorMultiply(A, B, dimsA, dimsB);
console.log(result); // 输出结果
