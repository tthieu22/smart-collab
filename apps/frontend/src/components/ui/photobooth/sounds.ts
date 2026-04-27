'use client';

const sounds = {
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  shutter: '/sound/kai.mp3',
  countdown: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  hadilao: '/sound/hadolao.mp3',
};

export const playSound = (type: keyof typeof sounds) => {
  const audio = new Audio(sounds[type]);
  audio.play().catch(() => {
    // Ignore autoplay blocks
  });
};
