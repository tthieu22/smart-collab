import { PhotoboothTemplate } from './types';

export const DEFAULT_TEMPLATES: Record<string, PhotoboothTemplate> = {
  'single': {
    id: 'single',
    name: '1 Ảnh',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 800,
    background: '#ffffff',
    slots: [
      { x: 50, y: 50, width: 1100, height: 700 }
    ]
  },
  'grid-4': {
    id: 'grid-4',
    name: '4 Ảnh Grid',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 1600,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 540, height: 600 },
      { x: 620, y: 40, width: 540, height: 600 },
      { x: 40, y: 680, width: 540, height: 600 },
      { x: 620, y: 680, width: 540, height: 600 }
    ]
  },
  'strip-4': {
    id: 'strip-4',
    name: '4 Ảnh Dọc (Film Strip)',
    layout: 'strip',
    canvasWidth: 600,
    canvasHeight: 1800,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 520, height: 360 },
      { x: 40, y: 440, width: 520, height: 360 },
      { x: 40, y: 840, width: 520, height: 360 },
      { x: 40, y: 1240, width: 520, height: 360 }
    ]
  }
};
