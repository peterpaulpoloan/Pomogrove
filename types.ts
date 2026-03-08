
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio: string;
  level: number;
  streak: number;
  totalSessions: number;
}

export interface Quiz {
  id: string;
  title: string;
  cards: Flashcard[];
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface StreakData {
  date: string; // YYYY-MM-DD
  count: number;
}
