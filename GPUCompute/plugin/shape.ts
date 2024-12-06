export function reshape<T>(nums: T[], shape: number[]): T[][] {
    // 计算原数组的长度
    const totalElements = nums.length;
    // 计算目标形状的总元素数
    const totalSize = shape.reduce((a, b) => a * b, 1);

    // 如果总元素数不一致，抛出错误
    if (totalElements !== totalSize) {
        throw new Error('Total number of elements must be the same');
    }

    // 使用递归来构造多维数组
    let index = 0;

    // 递归函数：按维度拆分数组
    function createArray(dimensions: number[]): any[] {
        if (dimensions.length === 1) {
            const len = dimensions[0];
            const arr: T[] = [];
            for (let i = 0; i < len; i++) {
                arr.push(nums[index++]);
            }
            return arr;
        }

        const len = dimensions[0];
        const arr: any[] = [];
        for (let i = 0; i < len; i++) {
            arr.push(createArray(dimensions.slice(1)));
        }
        return arr;
    }

    return createArray(shape);
}