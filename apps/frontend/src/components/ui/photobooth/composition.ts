import { CapturedPhoto, PhotoboothConfig, Sticker } from './types';

export const generateComposition = async (
  photos: CapturedPhoto[],
  config: PhotoboothConfig,
  stickers: Sticker[] = []
): Promise<Blob> => {
  const { template } = config;
  const canvas = document.createElement('canvas');
  canvas.width = template.canvasWidth;
  canvas.height = template.canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // 1. Draw Background
  ctx.fillStyle = template.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Load and Draw Photos into slots
  const photoImages = await Promise.all(
    photos.map(p => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error(`Failed to load photo: ${p.url}`);
          resolve(new Image());
        };
        img.src = p.url;
      });
    })
  );

  template.slots.forEach((slot, index) => {
    if (photoImages[index]) {
      const img = photoImages[index];
      const slotX = slot.x;
      const slotY = slot.y;
      const slotW = slot.width;
      const slotH = slot.height;

      ctx.save();
      // Create clipping region for the slot
      ctx.beginPath();
      ctx.rect(slotX, slotY, slotW, slotH);
      ctx.clip();

      // Cover logic
      const scale = Math.max(slotW / img.width, slotH / img.height);
      const x = slotX + (slotW - img.width * scale) / 2;
      const y = slotY + (slotH - img.height * scale) / 2;

      // Apply Filter if any
      if (config.filter !== 'none') {
        ctx.filter = config.filter;
      }

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.restore();
    }
  });

  // 3. Draw Stickers
  if (stickers.length > 0) {
    const stickerImages = await Promise.all(
      stickers.map(s => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(new Image());
          img.src = s.url;
        });
      })
    );

    stickers.forEach((s, i) => {
      const img = stickerImages[i];
      if (!img.complete || img.naturalWidth === 0) return;

      ctx.save();
      const posX = (s.x / 100) * canvas.width;
      const posY = (s.y / 100) * canvas.height;

      ctx.translate(posX, posY);
      ctx.rotate(s.rotation);

      // Base size: 18% of canvas width
      const targetWidth = canvas.width * 0.18 * s.scale;
      const intrinsicScale = targetWidth / img.width;
      ctx.scale(intrinsicScale, intrinsicScale);

      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    });
  }

  // 4. Draw Premium Branding
  ctx.save();
  const bottomY = canvas.height - 80;
  
  // Subtle Divider
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.moveTo(100, bottomY - 20);
  ctx.lineTo(canvas.width - 100, bottomY - 20);
  ctx.stroke();

  // Branding Text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // User Name / Main Brand
  ctx.fillStyle = '#1e293b'; // Slate 800
  ctx.font = 'bold 36px "Inter", "Montserrat", sans-serif';
  const brandTitle = config.userName?.toUpperCase() || 'SMART COLLAB';
  ctx.fillText(brandTitle, canvas.width / 2, bottomY + 10);

  // Date / Tagline
  ctx.fillStyle = '#64748b'; // Slate 500
  ctx.font = '500 18px "Inter", sans-serif';
  const tagline = config.showDate 
    ? `CAPTURED BY SMART COLLAB • ${new Date().toLocaleDateString('vi-VN')}`
    : 'CAPTURED BY SMART COLLAB PHOTOBOOTH';
  ctx.fillText(tagline, canvas.width / 2, bottomY + 50);
  
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, 'image/png');
  });
};
