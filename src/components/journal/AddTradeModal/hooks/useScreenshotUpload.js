import { useState } from 'react';

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
          console.log('Processing file:', file.name, file.type, file.size);
          
          // Simulate upload progress
          newProgress[file.name] = 50;
          setUploadProgress({ ...newProgress });
          
          // Convert file to data URL (base64)
          const dataUrl = await fileToDataUrl(file);
          console.log('File processed successfully');
          
          newProgress[file.name] = 100;
          setUploadProgress({ ...newProgress });
          
          urls.push({
            url: dataUrl,
            name: file.name,
            type: file.type,
            size: file.size
          });
          
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
      }
      
      setScreenshots(prev => [...prev, ...urls]);
      
      return {
        success: true,
        urls,
        successCount: urls.length,
        fallbackCount: 0,
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