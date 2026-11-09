import { useState } from 'react';
import { Emo } from './Emo';

/** Panel aturan main yang selalu bisa dibuka saat bermain. defaultOpen = terbuka saat game dimulai. */
export function RulesPeek({ rules, defaultOpen = false }: { rules: string[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="rules-peek" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><Emo t="📖" /> Aturan main</summary>
      {open && <ol>{rules.map((r, i) => <li key={i}>{r}</li>)}</ol>}
    </details>
  );
}
