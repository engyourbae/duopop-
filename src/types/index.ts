export type Difficulty = 'mudah' | 'sedang' | 'sulit';
export type QStatus = 'perlu-tinjauan' | 'terverifikasi';
export type QType = 'mcq' | 'tf3' | 'order' | 'estimate';

export interface BaseQuestion {
  id: string;
  language: 'id';
  category: string;
  subcategory: string;
  difficulty: Difficulty;
  type: QType;
  question: string;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
  verifiedAt: string | null;
  contentVersion: number;
  status: QStatus;
}
/** options[0] selalu jawaban benar pada bank data; engine mengacak urutan saat dimainkan. */
export interface ChoiceQuestion extends BaseQuestion { type: 'mcq' | 'tf3'; options: string[]; correctAnswer: number }
/** options = peristiwa dalam urutan kronologis yang benar; years sejajar dengan options. */
export interface OrderQuestion extends BaseQuestion { type: 'order'; options: string[]; years: number[]; correctAnswer: number[] }
export interface EstimateQuestion extends BaseQuestion { type: 'estimate'; options: string[]; correctAnswer: number; unit: string }
export type Question = ChoiceQuestion | OrderQuestion | EstimateQuestion;

export type Mechanic =
  | 'mcq' | 'tf' | 'chain-tf' | 'era' | 'flag' | 'order' | 'estimate' | 'clues'
  | 'memorymatch' | 'reflex' | 'tictactoe' | 'connect4' | 'whack' | 'stroop' | 'simon' | 'snake' | 'flappy' | 'catch'
  | 'uno' | 'gaple' | 'ladder' | 'rps' | 'wordle' | 'typing' | 'tapbattle' | 'anagram' | 'buzzer'
  | 'pair' | 'predict' | 'match' | 'likely' | 'deck' | 'wheel' | 'wordchain' | 'story' | 'wordguess' | 'lovelang';
export type GameGroup = 'pasangan' | 'pengetahuan' | 'grup' | 'arkade' | 'kartu';
export interface GameVariant { id: string; label: string; bank?: string; categories?: string[] }

export interface GameDef {
  id: string;
  title: string;
  group: GameGroup;
  mechanic: Mechanic;
  icon: string; // kunci ikon SVG
  color: string;
  tagline: string;
  rules: string[];
  minPlayers: number;
  maxPlayers: number;
  core?: boolean;
  /** filter kategori pertanyaan atau kunci bank konten */
  categories?: string[];
  bank?: string;
  multiplayer?: boolean; // tersedia di ruang real-time
  variants?: GameVariant[];
  offline: boolean;
}

export interface GameResult {
  sessionId: string;
  gameId: string;
  at: number;
  players: { name: string; score: number }[];
  correct: number;
  total: number;
  xp: number;
}
