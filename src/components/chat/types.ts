export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Suggestion {
  label: string;
  subLabel: string;
  prompt: string;
}

export enum AppState {
  IDLE = 'idle',
  CHATTING = 'chatting'
}
