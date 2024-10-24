import JSZip from 'jszip';

export async function getFileCountFromZip(file:File) {
    if (file.type !== 'application/x-zip-compressed') {
        throw new Error('请上传一个 ZIP 文件');
      }
    
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
    
      // 过滤掉目录项
      const fileCount = Object.keys(content.files).filter(fileName => !content.files[fileName].dir).length;
      return fileCount;
  }
export async function zipToImages(file: File, num:number) {
  let count = 0;
  if (file.type !== 'application/x-zip-compressed') {
    throw new Error('请上传一个 ZIP 文件');
  }

  const zip = new JSZip();
  const content = await zip.loadAsync(file);

  const imageDataArray: ImageData[] = [];

  for (const fileName in content.files) {
    if(count == num) break;
    if (content.files[fileName].name.match(/\.(jpg|jpeg|png|gif)$/)) {
      const blob = await content.files[fileName].async('blob');
      const imageData = await processImage(blob);
      if (imageData) {
        imageDataArray.push(imageData);
        count += 1;
      }
    }
  }

  return imageDataArray;
}

async function processImage(blob: Blob): Promise<{ width: number; height: number; data: number[] } | null> {
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


let count = 0;

export {
    count
}

export const getCount = () => { return count; }