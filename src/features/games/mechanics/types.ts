import type { ReactNode } from 'react';
import type { GameDef } from '../../../types';
export interface Outcome { scores: number[]; correct: number; total: number; summary?: ReactNode }
export interface MechProps { game: GameDef; players: string[]; seed: string; count: number; secs: number; onDone: (o: Outcome) => void }
export const LETTERS = ['A', 'B', 'C', 'D', 'E'];
