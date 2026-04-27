export type PhotoboothStep = 
  | 'idle' 
  | 'select-mode' 
  | 'style-config'
  | 'countdown' 
  | 'capturing' 
  | 'review'        // NEW: Review individual shots
  | 'editing'       // NEW: Stickers/Drag&drop
  | 'result'
  | 'error'         // NEW: Error handling
  | 'timeout';      // NEW: Idle auto-reset

export type PhotoboothMode = 'single' | 'grid-4' | 'strip-4' | 'grid-6';

export interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoboothTemplate {
  id: string;
  name: string;
  layout: 'grid' | 'strip';
  slots: PhotoSlot[];
  canvasWidth: number;
  canvasHeight: number;
  background: string;
  overlay?: string; // Logo/Brand overlay image URL
}

export interface PhotoboothConfig {
  mode: PhotoboothMode;
  template: PhotoboothTemplate;
  filter: string;
  frameStyle: string;
  countdown: number;
  userName?: string;
  showDate: boolean;
}

export interface CapturedPhoto {
  id: string;
  url: string;
  blob: Blob;
}

export interface Sticker {
  id: string;
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
