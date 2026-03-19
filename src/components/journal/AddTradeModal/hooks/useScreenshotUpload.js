import { useState } from 'react';
import { base44 } from '@/api/base44Client';

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const useScreenshotUpload = (initialScreenshots = []) => {
  const [screenshots, setScreenshots] = useState(initialScreenshots);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const uploadFiles = async (files) => {
    if (files.length === 0) return;
    
    setUploading(true);
    const urls = [];
    const newProgress = {};
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newProgress[file.name] = 0;
        setUploadProgress({ ...newProgress });
        
        try {
          console.log('Uploading file:', file.name, file.type, file.size);
          
          // Simulate progress (you can replace with actual upload progress)
          newProgress[file.name] = 50;
          setUploadProgress({ ...newProgress });
          
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          console.log('Upload successful:', file_url);
          
          newProgress[file.name] = 100;
          urls.push(file_url);
        } catch (uploadError) {
          console.error('Upload failed for file:', file.name, uploadError);
          
          // Fallback: persistable local data URL (blob URLs break after reload)
          const fallbackUrl = await fileToDataUrl(file);
          console.log('Using fallback URL:', fallbackUrl);
          urls.push(fallbackUrl);
          
          newProgress[file.name] = 100; // Mark as complete even though it's fallback
        }
        
        setUploadProgress({ ...newProgress });
      }
      
      setScreenshots(prev => [...prev, ...urls]);
      
      const successCount = urls.filter(url => !url.startsWith('blob:')).length;
      const fallbackCount = urls.filter(url => url.startsWith('blob:')).length;
      
      return {
        success: true,
        urls,
        successCount,
        fallbackCount,
        totalCount: urls.length
      };
    } catch (error) {
      console.error('Unexpected error in upload process:', error);
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const removeScreenshot = (index) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const clearScreenshots = () => {
    setScreenshots([]);
  };

  return {
    screenshots,
    uploading,
    uploadProgress,
    uploadFiles,
    removeScreenshot,
    clearScreenshots,
    setScreenshots
  };
};