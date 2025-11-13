export const typeWriter = (
  text: string,
  onUpdate: (char: string) => void,
  onComplete: () => void,
  speed = 30
) => {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      onUpdate(text.charAt(i));
      i++;
    } else {
      clearInterval(interval);
      setTimeout(onComplete, 300);
    }
  }, speed);
  return () => clearInterval(interval);
};