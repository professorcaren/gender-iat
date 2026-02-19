import { maleNames, femaleNames } from './stimuli';
import type { Stimulus } from './stimuli';

export const majors: string[] = [
  'Biology',
  'Psychology',
  'Media and Journalism',
  'Business Administration',
  'Exercise and Sport Science',
  'Economics',
  'Political Science',
  'Chemistry',
  'Computer Science',
  'Global Studies',
  'Sociology',
  'History',
  'English',
  'Math',
  'Nursing',
];

export interface PrimingTrial {
  major: string;
  target: Stimulus;
  correctSide: 'left' | 'right';
}

export interface PrimingTrialResult {
  major: string;
  targetWord: string;
  targetCategory: 'male' | 'female';
  response: 'left' | 'right';
  rt: number;
  correct: boolean;
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generatePrimingTrials(): PrimingTrial[] {
  const trials: PrimingTrial[] = [];

  for (const major of majors) {
    // 1 male target
    trials.push({
      major,
      target: pickRandom(maleNames),
      correctSide: 'left', // Male always sorted left
    });
    // 1 female target
    trials.push({
      major,
      target: pickRandom(femaleNames),
      correctSide: 'right', // Female always sorted right
    });
  }

  return shuffle(trials);
}
