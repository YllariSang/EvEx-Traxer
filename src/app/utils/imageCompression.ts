/**
 * Compresses an image file to reduce its size while maintaining reasonable quality
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param quality - JPEG quality from 0 to 1 (default: 0.7)
 * @returns Promise that resolves to a base64 data URL of the compressed image
 */
export const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gets the current localStorage usage statistics
 * @returns Object containing used bytes, available bytes, and usage percentage
 */
export const getStorageStats = () => {
  let totalSize = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalSize += localStorage[key].length + key.length;
    }
  }
  
  // Most browsers have a 5-10MB limit, we'll estimate 5MB
  const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
  const usagePercent = (totalSize / estimatedLimit) * 100;
  
  return {
    usedBytes: totalSize,
    availableBytes: estimatedLimit - totalSize,
    usagePercent: usagePercent.toFixed(2),
    usedMB: (totalSize / (1024 * 1024)).toFixed(2),
    limitMB: (estimatedLimit / (1024 * 1024)).toFixed(2),
  };
};
