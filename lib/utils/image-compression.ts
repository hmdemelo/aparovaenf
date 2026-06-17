/**
 * Browser-side utility to compress images using HTML5 Canvas.
 * Converts any image format to WebP with controlled dimensions and quality.
 */
export function compressToWebP(
  file: File,
  maxDimension = 1080,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Only run in browser contexts
    if (typeof window === 'undefined') {
      reject(new Error('Image compression is client-only'))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let width = img.width
      let height = img.height

      // Calculate relative scale preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get 2D context from canvas'))
        return
      }

      // Draw the image onto the canvas at optimized size
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to WebP format with quality setting
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob output is empty'))
          }
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image file'))
    }

    img.src = url
  })
}
