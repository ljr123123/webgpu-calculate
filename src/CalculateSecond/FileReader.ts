import JSZip from 'jszip';

export async function getFileCountFromZip(file: File) {
    if (file.type !== 'application/x-zip-compressed') {
        throw new Error('请上传一个 ZIP 文件');
    }

    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    // 过滤掉目录项
    const fileCount = Object.keys(content.files).filter(fileName => !content.files[fileName].dir).length;
    return fileCount;
}
export async function zipToImages(file: File, num: number, rgba?: Boolean) {
    let count = 0;
    if (file.type !== 'application/x-zip-compressed') {
        throw new Error('请上传一个 ZIP 文件');
    }

    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    const imageDataArray: ImageData | {}[] = [];

    for (const fileName in content.files) {
        if (count == num) break;
        if (content.files[fileName].name.match(/\.(jpg|jpeg|png|gif)$/)) {
            const blob = await content.files[fileName].async('blob');
            let imageData;
            if (rgba) imageData = await processImageWithRGBA(blob)
            else imageData = await processImageWithoutRGBA(blob);
            if (imageData) {
                imageDataArray.push(imageData);
                count += 1;
            }
        }
    }

    return imageDataArray;
}

async function processImageWithoutRGBA(blob: Blob): Promise<{ width: number; height: number; data: number[] } | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                const rgbData = [];

                for (let i = 0; i < imageData.data.length; i += 4) {
                    rgbData.push(imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]);
                }
                count += 1;
                resolve({ width: img.width, height: img.height, data: rgbData });
            } else {
                resolve(null);
            }
        };
    });
}

async function processImageWithRGBA(blob: Blob): Promise<{ width: number; height: number; data: Uint8ClampedArray; colorSpace?: string } | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // 将图片绘制到 canvas 上
                ctx.drawImage(img, 0, 0);

                // 获取图片的 RGBA 数据
                const imageData = ctx.getImageData(0, 0, img.width, img.height);

                // 将 RGB 数据提取出来，去掉 Alpha 通道（并保留）
                const rgbData = new Uint8ClampedArray(imageData.data.length); // 用于存储 RGBA 数据
                for (let i = 0; i < imageData.data.length; i++) {
                    rgbData[i] = imageData.data[i]; // 保留原始 RGBA 数据
                }

                // 返回结果
                resolve({
                    width: img.width,
                    height: img.height,
                    data: rgbData,
                    colorSpace: 'srgb' // 你可以选择其他的颜色空间，如果有特殊需求
                });
            } else {
                resolve(null);
            }
        };

        img.onerror = () => {
            resolve(null);  // 如果图片加载失败，返回 null
        };
    });
}



let count = 0;

export {
    count
}

export const getCount = () => { return count; }