import { Modal, useToast } from './ui';
import { Brand, type BrandName } from './Brand';
import { Icon } from './Icon';

/** Lembar berbagi kustom dengan logo aplikasi tujuan. */
export function ShareSheet({ open, onClose, text, url }: { open: boolean; onClose: () => void; text: string; url: string }) {
  const toast = useToast();
  const t = encodeURIComponent(text), u = encodeURIComponent(url);
  const targets: { name: string; brand: BrandName; href: string }[] = [
    { name: 'WhatsApp', brand: 'whatsapp', href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { name: 'Telegram', brand: 'telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: 'Facebook', brand: 'facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'X', brand: 'x', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: 'Gmail', brand: 'gmail', href: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent('Ayo main DUOPOP')}&body=${encodeURIComponent(`${text}\n${url}`)}` },
  ];
  const copy = () => { void navigator.clipboard?.writeText(url).then(() => toast('Tautan disalin', 'ok')).catch(() => toast('Tidak bisa menyalin', 'err')); onClose(); };
  return (
    <Modal open={open} title="Bagikan lewat" onClose={onClose}>
      <div className="share-grid">
        {targets.map((x) => <a key={x.name} className="share-item" href={x.href} target="_blank" rel="noopener noreferrer" onClick={onClose}><Brand name={x.brand} size={40} /><span>{x.name}</span></a>)}
        <button className="share-item" onClick={copy}><span className="share-copy"><Icon name="copy" size={22} /></span><span>Salin tautan</span></button>
      </div>
      <p className="small muted gap">{url}</p>
    </Modal>
  );
}
