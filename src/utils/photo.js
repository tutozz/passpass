export async function fileToCompressedDataURL(file, maxDim = 480, quality = 0.78) {
  if (!file) return null;
  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    // Fallback via <img> for older Safari
    bmp = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  const w0 = bmp.width || bmp.naturalWidth;
  const h0 = bmp.height || bmp.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}
