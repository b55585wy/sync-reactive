interface Settings {
  username: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  defaultDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: string[];
  enableReminders: boolean;
  reminderTime: string | null;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  autoSync: boolean;
  targetHeartRateMin: number;
  targetHeartRateMax: number;
  inhaleTime: number;
  holdTime: number;
  exhaleTime: number;
} 