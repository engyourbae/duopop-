const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 5a3 3 0 0 1 0 6M18 14a6 6 0 0 1 4 6',
  heart: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  who: 'M12 3a5 5 0 0 1 5 5c0 3-3 3.5-3 6M12 20h.01',
  crystal: 'M12 3l7 6-7 12L5 9zM5 9h14M9 9l3 12 3-12',
  album: 'M5 4h14v16H5zM9 4v16M13 9h3M13 13h3',
  chat: 'M4 5h16v11H9l-5 4z',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 3v4M17 5h4',
  swords: 'M4 4l9 9M20 4l-9 9M4 20l3-3M20 20l-3-3M8 16l-2 2M16 16l2 2',
  book: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  scale: 'M12 4v16M6 20h12M5 8h14M5 8l-3 7a3 3 0 0 0 6 0zM19 8l-3 7a3 3 0 0 0 6 0z',
  hourglass: 'M6 3h12M6 21h12M7 3c0 6 5 6 5 9s-5 3-5 9M17 3c0 6-5 6-5 9s5 3 5 9',
  list: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  pin: 'M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  chain: 'M9 15l6-6M8 11l-2 2a3.5 3.5 0 0 0 5 5l2-2M16 13l2-2a3.5 3.5 0 0 0-5-5l-2 2',
  person: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21c0-4 3-7 7-7s7 3 7 7',
  flagpole: 'M6 22V3M6 4c4-2 6 2 12 0v9c-6 2-8-2-12 0',
  mask: 'M4 5h16v6a8 8 0 0 1-16 0zM8 10h.01M16 10h.01M9 15c2 1.5 4 1.5 6 0',
  abc: 'M4 18l4-12 4 12M5.5 14h5M15 6v12M15 8h3a2 2 0 0 1 0 4h-3',
  flask: 'M9 3h6M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3M7 15h10',
  puzzle: 'M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  bolt: 'M13 2L4 14h6l-1 8 9-12h-6z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19',
  dice: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  trophy: 'M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 14v4M8 21h8',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01',
  play: 'M7 4l13 8-13 8z',
  back: 'M15 5l-7 7 7 7',
  check: 'M5 12l5 5 9-10',
  x: 'M6 6l12 12M18 6L6 18',
  fire: 'M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-3 3 0-4-1-7-4-9 0 4-4 6-4 12 0 4 3 8 7 8z',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  plus: 'M12 5v14M5 12h14',
  wifioff: 'M3 3l18 18M5 12a10 10 0 0 1 4-2.4M9 16a5 5 0 0 1 6 0M12 20h.01M16 10.4a10 10 0 0 1 3 1.6',
  logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
  mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
  bird: 'M3 15c4 1 7-1 9-5 1 2 3 3 6 3l3-1-2 4c-2 4-6 6-10 6-4 0-6-3-6-7zM17 9h.01',
  hammer: 'M14 4l6 6-3 3-6-6zM12 8L4 16l4 4 8-8',
  chevron: 'M6 9l6 6 6-6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
};
export type IconName = keyof typeof P | string;
export function Icon({ name, size = 22, className }: { name: IconName; size?: number; className?: string }) {
  const d = P[name] ?? P.sparkle;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
export function Logo({ size = 40, text = true, light = false }: { size?: number; text?: boolean; light?: boolean }) {
  return (
    <span className="logo" aria-label="DUOPOP">
      <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
        <rect width="512" height="512" rx="112" fill="#2a4bff" />
        <circle cx="200" cy="256" r="104" fill="#f2eadb" />
        <circle cx="312" cy="256" r="104" fill="#ffc414" />
        <path d="M256 168.4A104 104 0 0 1 256 343.6A104 104 0 0 1 256 168.4Z" fill="#e0401f" />
      </svg>
      {text && <span className="logo-text" style={light ? { color: '#fff' } : undefined}>duo<b>pop</b></span>}
    </span>
  );
}
