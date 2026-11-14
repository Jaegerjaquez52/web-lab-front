import { useEffect, useMemo, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import Button from './Button';

interface ImageCropperProps {
  file: File;
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
}

export default function ImageCropper({ file, onCancel, onComplete }: ImageCropperProps) {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  async function completeCrop() {
    if (!area) return;
    setIsProcessing(true);
    setError('');
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = area.width;
      canvas.height = area.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Не вдалося створити контекст для обрізання зображення');
      context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
      image.close();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error('Не вдалося сформувати обрізане зображення'));
        }, 'image/jpeg', 0.9);
      });
      onComplete(blob);
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : 'Не вдалося обрізати зображення');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section aria-label="Обрізання зображення" className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="relative h-64 overflow-hidden rounded-lg bg-slate-950">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, croppedAreaPixels) => setArea(croppedAreaPixels)}
        />
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        Масштаб
        <input
          aria-label="Масштаб зображення"
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
        />
      </label>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isProcessing}>Скасувати</Button>
        <Button type="button" onClick={() => void completeCrop()} isLoading={isProcessing} disabled={!area}>Обрізати й завантажити</Button>
      </div>
    </section>
  );
}
