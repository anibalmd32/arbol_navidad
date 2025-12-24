
export interface Gift {
  id: string;
  senderName: string;
  recipientName: string;
  senderPhoto?: string;
  message: string;
  type: 'letter' | 'audio' | 'video';
  color: string;
  createdAt: number;
  aiBlessing?: string;
  isOpened?: boolean;
}

export enum AppView {
  LANDSCAPE = 'LANDSCAPE',
  CREATE_GIFT = 'CREATE_GIFT',
  VIEW_GIFT = 'VIEW_GIFT'
}

export interface Memory {
  id: string;
  photoUrl: string;
  message?: string;
  senderName: string;
  createdAt: number;
}
