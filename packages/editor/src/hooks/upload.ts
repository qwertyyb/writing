import { inject, ref } from 'vue';
import { uploadSymbol } from '../utils/upload';

const getImageRatio = (url: string): Promise<{src: string, ratio: number}> => {
  return new Promise((resolve) => {
    const image = document.createElement('img');
    image.onload = () => {
      resolve({ src: url, ratio: image.naturalWidth / image.naturalHeight });
    };
    image.src = url;
  });
};

export const useUpload = () => {
  const uploader = inject<(file: Blob | File) => Promise<string>>(uploadSymbol);

  const uploadState = ref({
    loading: false,
    text: '',
    tempUrl: '',
    tempRatio: 1,
  });

  const uploadImageFile = (): Promise<{ url: string, ratio: number }> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    return new Promise((resolve) => {
      input.addEventListener('change', async () => {
        const files = input.files;
        if (!files?.length) return;

        const url = URL.createObjectURL(files[0]);
        const { ratio } = await getImageRatio(url);
        uploadState.value.tempUrl = url;
        uploadState.value.tempRatio = ratio;

        uploadState.value.loading = true;
        uploadState.value.text = '';

        let result = '';
        try {
          result = await uploader(files[0]);
        } catch (err) {
          uploadState.value.text = err.message || '上传失败';
          throw err;
        }

        uploadState.value.loading = false;
        return resolve({ url: result, ratio });
      });
      input.click();
    });
  };

  const uploadBlob = async (content: File | Blob) => {
    const url = URL.createObjectURL(content);
    const { ratio } = await getImageRatio(url);
    uploadState.value.tempUrl = url;
    uploadState.value.tempRatio = ratio;

    uploadState.value.loading = true;
    uploadState.value.text = '';
    
    let result = '';
    try {
      result = await uploader(content);
    } catch (err) {
      uploadState.value.text = err.message || '上传失败';
      throw err;
    }

    uploadState.value.loading = false;
    return { url: result, ratio };
  };

  return { state: uploadState, uploadImageFile, uploadBlob }; 
};