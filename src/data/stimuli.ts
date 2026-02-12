export type CategoryType = 'male' | 'female' | 'boss' | 'care';

export interface Stimulus {
  word: string;
  category: CategoryType;
}

export const maleNames: Stimulus[] = [
  { word: 'James', category: 'male' },
  { word: 'David', category: 'male' },
  { word: 'Michael', category: 'male' },
  { word: 'Daniel', category: 'male' },
  { word: 'Robert', category: 'male' },
  { word: 'Thomas', category: 'male' },
  { word: 'William', category: 'male' },
  { word: 'John', category: 'male' },
];

export const femaleNames: Stimulus[] = [
  { word: 'Sarah', category: 'female' },
  { word: 'Emily', category: 'female' },
  { word: 'Jessica', category: 'female' },
  { word: 'Ashley', category: 'female' },
  { word: 'Amanda', category: 'female' },
  { word: 'Lauren', category: 'female' },
  { word: 'Hannah', category: 'female' },
  { word: 'Megan', category: 'female' },
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
