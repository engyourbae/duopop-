import { createContext, useCallback, useContext, useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './Icon';

export function Button({ variant = 'primary', size = 'md', icon, children, className = '', ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'accent'; size?: 'sm' | 'md' | 'lg'; icon?: string }) {
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>{icon && <Icon name={icon} size={18} />}{children}</button>;
}
export function Card({ children, className = '', onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return <div className={`card ${onClick ? 'card-tap' : ''} ${className}`} onClick={onClick} style={style} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}>{children}</div>;
}
export const Badge = ({ children, color }: { children: ReactNode; color?: string }) => <span className="badge" style={color ? { background: color } : undefined}>{children}</span>;
export const ProgressBar = ({ value, label }: { value: number; label?: string }) => (
  <div className="progress" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
  </div>
);
export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Tutup"><Icon name="x" /></button></div>
        {children}
      </div>
    </div>
  );
}
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return <div className="tabs" role="tablist">{tabs.map((t) => <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'tab on' : 'tab'} onClick={() => onChange(t.id)}>{t.label}</button>)}</div>;
}
export const Spinner = ({ label = 'Memuat…' }: { label?: string }) => <div className="center-col" role="status"><div className="spinner" /><p className="muted">{label}</p></div>;
export const EmptyState = ({ icon = 'sparkle', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) => (
  <div className="empty"><div className="empty-ic"><Icon name={icon} size={34} /></div><h3>{title}</h3>{text && <p className="muted">{text}</p>}{action}</div>
);
export const ErrorState = ({ text, onRetry }: { text: string; onRetry?: () => void }) => <EmptyState icon="x" title="Ups, ada masalah" text={text} action={onRetry && <Button onClick={onRetry} variant="soft">Coba lagi</Button>} />;

type ToastKind = 'ok' | 'err' | 'info';
const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);
  const push = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">{list.map((t) => <div key={t.id} className={`toast toast-${t.kind}`}>{t.msg}</div>)}</div>
    </ToastCtx.Provider>
  );
}
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{error && <em className="field-err" role="alert">{error}</em>}</label>;
}
export function Header({ title, back, right }: { title: string; back?: () => void; right?: ReactNode }) {
  return <header className="page-head">{back ? <button className="icon-btn" onClick={back} aria-label="Kembali"><Icon name="back" /></button> : <span />}<h1>{title}</h1><span className="head-right">{right}</span></header>;
}
