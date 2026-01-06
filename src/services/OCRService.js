/**
 * OCRService.js
 * Handles image optimization for Gemini Vision
 */

export const PROCESS_CONFIG = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    mimeType: 'image/jpeg'
};

/**
 * Compresses and resizes an image file for optimal AI processing
 * @param {File} file - Raw file from input
 * @returns {Promise<string>} - Blob URL of optimized image
 */
export async function optimizeImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize logic
                if (width > height) {
                    if (width > PROCESS_CONFIG.maxWidth) {
                        height *= PROCESS_CONFIG.maxWidth / width;
                        width = PROCESS_CONFIG.maxWidth;
                    }
                } else {
                    if (height > PROCESS_CONFIG.maxHeight) {
                        width *= PROCESS_CONFIG.maxHeight / height;
                        height = PROCESS_CONFIG.maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress
                canvas.toBlob((blob) => {
                    resolve(URL.createObjectURL(blob));
                }, PROCESS_CONFIG.mimeType, PROCESS_CONFIG.quality);
            };

            img.onerror = reject;
        };

        reader.onerror = reject;
    });
}
