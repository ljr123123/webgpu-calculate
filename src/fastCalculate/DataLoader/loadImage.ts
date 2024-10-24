export async function loadImageToMatrix(url:string) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous'; // 处理跨域问题

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if(ctx == null) throw new Error("ctx is null");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // 创建三维矩阵
            const matrix = [];
            for (let y = 0; y < img.height; y++) {
                const row = [];
                for (let x = 0; x < img.width; x++) {
                    const index = (y * img.width + x) * 4;
                    row.push([
                        data[index],     // R
                        data[index + 1], // G
                        data[index + 2], // B
                        data[index + 3]  // A
                    ]);
                }
                matrix.push(row);
            }
            resolve(matrix);
        };

        img.onerror = (error) => {
            reject(`Failed to load image: ${error}`);
        };

        img.src = url;
    });
}
