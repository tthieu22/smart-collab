import { PhotoboothTemplate } from './types';

export const DEFAULT_TEMPLATES: Record<string, PhotoboothTemplate> = {
  'single': {
    id: 'single',
    name: '1 Ảnh',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 800,
    background: '#ffffff',
    slots: [{ x: 50, y: 50, width: 1100, height: 700 }]
  },
  'grid-2-v': {
    id: 'grid-2-v',
    name: '2 Ảnh Dọc',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 800,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 540, height: 720 },
      { x: 620, y: 40, width: 540, height: 720 }
    ]
  },
  'grid-2-h': {
    id: 'grid-2-h',
    name: '2 Ảnh Ngang',
    layout: 'grid',
    canvasWidth: 800,
    canvasHeight: 1200,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 720, height: 540 },
      { x: 40, y: 620, width: 720, height: 540 }
    ]
  },
  'grid-3-v': {
    id: 'grid-3-v',
    name: '3 Ảnh Dọc',
    layout: 'grid',
    canvasWidth: 1600,
    canvasHeight: 1000,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 480, height: 920 },
      { x: 560, y: 40, width: 480, height: 920 },
      { x: 1080, y: 40, width: 480, height: 920 }
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
  'grid-6': {
    id: 'grid-6',
    name: '6 Ảnh Grid',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 1800,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 540, height: 500 },
      { x: 620, y: 40, width: 540, height: 500 },
      { x: 40, y: 580, width: 540, height: 500 },
      { x: 620, y: 580, width: 540, height: 500 },
      { x: 40, y: 1120, width: 540, height: 500 },
      { x: 620, y: 1120, width: 540, height: 500 }
    ]
  },
  'grid-9': {
    id: 'grid-9',
    name: '9 Ảnh Grid',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 1600,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 350, height: 450 },
      { x: 425, y: 40, width: 350, height: 450 },
      { x: 810, y: 40, width: 350, height: 450 },
      { x: 40, y: 530, width: 350, height: 450 },
      { x: 425, y: 530, width: 350, height: 450 },
      { x: 810, y: 530, width: 350, height: 450 },
      { x: 40, y: 1020, width: 350, height: 450 },
      { x: 425, y: 1020, width: 350, height: 450 },
      { x: 810, y: 1020, width: 350, height: 450 }
    ]
  },
  'strip-3': {
    id: 'strip-3',
    name: '3 Ảnh Strip',
    layout: 'strip',
    canvasWidth: 600,
    canvasHeight: 1500,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 520, height: 440 },
      { x: 40, y: 520, width: 520, height: 440 },
      { x: 40, y: 1000, width: 520, height: 440 }
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
  },
  'wide-1': {
    id: 'wide-1',
    name: 'Cinema Wide',
    layout: 'grid',
    canvasWidth: 1600,
    canvasHeight: 900,
    background: '#ffffff',
    slots: [{ x: 50, y: 50, width: 1500, height: 800 }]
  },
  'mixed-3': {
    id: 'mixed-3',
    name: 'Poster Mixed',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 1600,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 1120, height: 900 },
      { x: 40, y: 980, width: 540, height: 500 },
      { x: 620, y: 980, width: 540, height: 500 }
    ]
  },
  'mixed-4': {
    id: 'mixed-4',
    name: 'Magazine Style',
    layout: 'grid',
    canvasWidth: 1200,
    canvasHeight: 1600,
    background: '#ffffff',
    slots: [
      { x: 40, y: 40, width: 680, height: 1440 },
      { x: 760, y: 40, width: 400, height: 450 },
      { x: 760, y: 530, width: 400, height: 450 },
      { x: 760, y: 1020, width: 400, height: 450 }
    ]
  }
};
