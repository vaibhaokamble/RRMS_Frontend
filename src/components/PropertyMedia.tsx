import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { safeImage } from '../lib/property';
import { Button } from './ui';

export function PropertyMedia({ images, onChange, max = 4, onBusy }: { images: string[]; onChange: (images: string[]) => void; max?: number; onBusy: (busy: boolean) => void }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    if (list.length + images.length > max) { toast.error(`Choose up to ${max} images.`); return; }
    if (list.some(file => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 400_000)) { toast.error('Use PNG, JPEG or WebP files under 400 KB each for this local demo.'); return; }
    setBusy(true); onBusy(true);
    try {
      const result = await Promise.all(list.map(file => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); })));
      onChange([...images, ...result]);
    } catch { toast.error('The image could not be read. Please choose it again.'); }
    finally { setBusy(false); onBusy(false); }
  };
  return <div className="property-media">
    <div className="media-previews">{images.map((src, i) => <div key={`${i}-${src.slice(-20)}`}><img src={src} alt={`Selected image ${i + 1}`} /><button type="button" aria-label={`Remove image ${i + 1}`} onClick={() => onChange(images.filter((_, index) => index !== i))}><X size={14} /></button></div>)}</div>
    <label className="media-upload"><ImagePlus size={18} /><span>{busy ? 'Reading images…' : 'Choose images'}<small>PNG, JPEG or WebP · max 400 KB each · {max} image{max > 1 ? 's' : ''}</small></span><input aria-label="Upload property images" type="file" accept="image/png,image/jpeg,image/webp" multiple={max > 1} disabled={busy || images.length >= max} onChange={e => { void upload(e.target.files); e.target.value = ''; }} /></label>
  </div>;
}
