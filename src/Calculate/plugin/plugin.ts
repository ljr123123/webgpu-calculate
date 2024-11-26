export function createSeededRandom(seed:number) {
    let currentSeed = seed;

    // LCG的常数
    const a = 1664525;  // 乘数
    const c = 1013904223; // 增量
    const m = Math.pow(2, 32);  // 模数（2的32次方）

    return function() {
        // 更新种子
        currentSeed = (a * currentSeed + c) % m;
        // 生成一个 0 到 1 之间的随机数
        return currentSeed / m;
    };
}