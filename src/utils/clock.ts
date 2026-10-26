/** Jam server (dikalibrasi dari stempel waktu Firestore). Modul ringan tanpa Firebase. */
let offset = 0;
export const serverNow = () => Date.now() + offset;
export const calibrateClock = (serverMs: number) => { if (Number.isFinite(serverMs) && serverMs > 0) offset = serverMs - Date.now(); };
