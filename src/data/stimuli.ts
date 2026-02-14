export type CategoryType = 'male' | 'female' | 'boss' | 'care';

export interface Stimulus {
  word: string;
  category: CategoryType;
}

export const maleNames: Stimulus[] = [
  { word: 'Liam', category: 'male' },
  { word: 'Noah', category: 'male' },
  { word: 'Mason', category: 'male' },
  { word: 'Ethan', category: 'male' },
  { word: 'Jayden', category: 'male' },
  { word: 'Mateo', category: 'male' },
  { word: 'Elijah', category: 'male' },
  { word: 'Jackson', category: 'male' },
];

export const femaleNames: Stimulus[] = [
  { word: 'Olivia', category: 'female' },
  { word: 'Ava', category: 'female' },
  { word: 'Sophia', category: 'female' },
  { word: 'Isabella', category: 'female' },
  { word: 'Aaliyah', category: 'female' },
  { word: 'Priya', category: 'female' },
  { word: 'Amelia', category: 'female' },
  { word: 'Aria', category: 'female' },
];

export const bossWords: Stimulus[] = [
  { word: 'hustle', category: 'boss' },
  { word: 'promotion', category: 'boss' },
  { word: 'deadline', category: 'boss' },
  { word: 'negotiate', category: 'boss' },
  { word: 'profit', category: 'boss' },
  { word: 'compete', category: 'boss' },
  { word: 'salary', category: 'boss' },
  { word: 'strategy', category: 'boss' },
];

export const careWords: Stimulus[] = [
  { word: 'bedtime', category: 'care' },
  { word: 'cooking', category: 'care' },
  { word: 'playground', category: 'care' },
  { word: 'carpool', category: 'care' },
  { word: 'laundry', category: 'care' },
  { word: 'comfort', category: 'care' },
  { word: 'homework', category: 'care' },
  { word: 'cuddle', category: 'care' },
];

export interface BlockConfig {
  id: number;
  name: string;
  trialCount: number;
  leftLabel: string[];
  rightLabel: string[];
  leftCategories: CategoryType[];
  rightCategories: CategoryType[];
  stimuli: Stimulus[];
  isPractice: boolean;
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTrialList(pools: Stimulus[][], count: number): Stimulus[] {
  const merged = pools.flat();
  const trials: Stimulus[] = [];
  while (trials.length < count) {
    const batch = shuffle(merged);
    trials.push(...batch);
  }
  return trials.slice(0, count);
}

export function getBlocks(): BlockConfig[] {
  return [
    {
      id: 1,
      name: 'Practice: Names',
      trialCount: 8,
      leftLabel: ['Male'],
      rightLabel: ['Female'],
      leftCategories: ['male'],
      rightCategories: ['female'],
      stimuli: buildTrialList([maleNames, femaleNames], 8),
      isPractice: true,
    },
    {
      id: 2,
      name: 'Practice: Words',
      trialCount: 8,
      leftLabel: ['Boss Mode'],
      rightLabel: ['Care Mode'],
      leftCategories: ['boss'],
      rightCategories: ['care'],
      stimuli: buildTrialList([bossWords, careWords], 8),
      isPractice: true,
    },
    {
      id: 3,
      name: 'Combo Round 1',
      trialCount: 20,
      leftLabel: ['Male', 'Boss Mode'],
      rightLabel: ['Female', 'Care Mode'],
      leftCategories: ['male', 'boss'],
      rightCategories: ['female', 'care'],
      stimuli: buildTrialList([maleNames, femaleNames, bossWords, careWords], 20),
      isPractice: false,
    },
    {
      id: 4,
      name: 'Combo Round 2',
      trialCount: 20,
      leftLabel: ['Female', 'Boss Mode'],
      rightLabel: ['Male', 'Care Mode'],
      leftCategories: ['female', 'boss'],
      rightCategories: ['male', 'care'],
      stimuli: buildTrialList([maleNames, femaleNames, bossWords, careWords], 20),
      isPractice: false,
    },
  ];
}

export function getCategoryColor(category: CategoryType): string {
  switch (category) {
    case 'male':
    case 'female':
      return '#e2e8f0'; // slate-200
    case 'boss':
    case 'care':
      return '#fbbf24'; // amber-400
  }
}

export function getCategoryDisplayName(category: CategoryType): string {
  switch (category) {
    case 'male': return 'Male';
    case 'female': return 'Female';
    case 'boss': return 'Boss Mode';
    case 'care': return 'Care Mode';
  }
}
