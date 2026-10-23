import { useEffect, useState } from 'react';

const DEFAULT_REST = 180_000;
// Until this file is added to public/ the timer just stays silent
const CHIME_SRC = '/sounds/rest-timer.mp3';

let chime: HTMLAudioElement | undefined;
const getChime = () => (chime ??= new Audio(CHIME_SRC));

const playChime = () => {
  const audio = getChime();
  audio.currentTime = 0;
  // Missing file or autoplay blocked
  audio.play().catch(() => {});
};

// iOS only plays audio outside a tap once a tap has played it, so Start
// plays it muted
const unlockChime = () => {
  const audio = getChime();
  audio.muted = true;
  audio
    .play()
    .then(() => audio.pause())
    .catch(() => {})
    .finally(() => {
      audio.muted = false;
    });
};

// Times in ms. Counts down from an end time rather than per tick, so it
// stays right when the browser throttles timers.
export const useRestTimer = () => {
  const [total, setTotal] = useState(DEFAULT_REST);
  const [left, setLeft] = useState(DEFAULT_REST);
  const [endsAt, setEndsAt] = useState<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    const id = setInterval(() => {
      const next = Math.max(0, endsAt - Date.now());
      setLeft(next);
      if (next > 0) return;
      setEndsAt(null);
      playChime();
    }, 100);
    return () => clearInterval(id);
  }, [endsAt]);

  return {
    left,
    progress: total ? left / total : 0,
    running: endsAt !== null,
    start: () => {
      unlockChime();
      // From 0:00 it starts over
      const from = left > 0 ? left : DEFAULT_REST;
      if (left === 0) {
        setTotal(DEFAULT_REST);
        setLeft(DEFAULT_REST);
      }
      setEndsAt(Date.now() + from);
    },
    pause: () => setEndsAt(null),
    reset: () => {
      setEndsAt(null);
      setTotal(DEFAULT_REST);
      setLeft(DEFAULT_REST);
    },
    // Cut to 0 while running → finishes on the next tick
    adjust: (delta: number) => {
      const next = Math.max(0, left + delta);
      setLeft(next);
      setTotal(Math.max(next, total + delta));
      if (endsAt !== null) setEndsAt(Date.now() + next);
    },
  };
};
