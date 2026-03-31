/**
 * Auto-resize and compress an image file using canvas.
 * @param {File} file - The image file to resize
 * @param {Object} options
 * @param {number} options.maxDimension - Max width or height in pixels (default: 1200)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @param {number} options.maxBytes - Max output size in bytes (default: 500000)
 * @returns {Promise<string>} Base64 data URL
 */
export function resizeAndCompress(file, {
  maxDimension = 1200,
  quality = 0.8,
  maxBytes = 500000,
} = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.onload = (e) => {
      const img = new window.Image()
      img.onerror = () => reject(new Error('이미지 로드 실패'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Scale down if either dimension exceeds maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Start with target quality, reduce if too large
        let q = quality
        let dataUrl = canvas.toDataURL('image/jpeg', q)

        while (dataUrl.length > maxBytes && q > 0.1) {
          q -= 0.1
          dataUrl = canvas.toDataURL('image/jpeg', q)
        }

        resolve(dataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Compress for Firestore diary storage (smaller size).
 */
export function compressForDiary(file) {
  return resizeAndCompress(file, {
    maxDimension: 600,
    quality: 0.4,
    maxBytes: 500000,
  })
}

/**
 * Resize for general photo upload (higher quality).
 */
export function resizeForUpload(file) {
  return resizeAndCompress(file, {
    maxDimension: 1200,
    quality: 0.8,
    maxBytes: 800000,
  })
}
