import { ImageAlign, type ImageData } from '../../schema';
import { createBlock } from '../../../models/block';

export const getImageRatio = (url: string): Promise<{src: string, ratio: number}> => {
  return new Promise((resolve) => {
    const image = document.createElement('img');
    image.onload = () => {
      resolve({ src: url, ratio: image.naturalWidth / image.naturalHeight });
    };
    image.src = url;
  });
};

export const createImageData = async (url: string, ratio?: number): Promise<ImageData> => {
  if (!ratio) {
    const data = await getImageRatio(url);
    ratio = data.ratio;
  }
  return {
    src: url,
    ratio,
    align: ImageAlign.Center,
    title: createBlock({
      type: 'text',
    }),
    size: 50,
  };
};