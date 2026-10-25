import { useEffect, useState } from 'react';

const DEFAULT_REST = 170_000;
const CHIME_SRC = '/audio/timerDone.mp3';
// Keeps the screen on after the timer ends so the chime plays
const WAKE_LOCK_HOLD = 10_000;

let chime: HTMLAudioElement | undefined;
const getChime = () => (chime ??= new Audio(CHIME_SRC));

// play() resolves once playback starts, so this waits for 'ended' instead
const playChime = () =>
  new Promise<void>((resolve) => {
    const audio = getChime();
    audio.currentTime = 0;
    audio.addEventListener('ended', () => resolve(), { once: true });
    // Missing file or autoplay blocked
    audio.play().catch(() => resolve());
  });

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
    const id = setInterval(async () => {
      const next = Math.max(0, endsAt - Date.now());
      setLeft(next);
      if (next > 0) return;
      setEndsAt(null);
      await playChime();
      await playChime();
      await playChime();
    }, 100);
    return () => clearInterval(id);
  }, [endsAt]);

  const running = endsAt !== null;

  // The browser drops the lock when the tab is hidden, so it's re-requested
  // when the tab is visible again
  useEffect(() => {
    if (!running || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    let done = false;
    const request = () => {
      if (document.visibilityState !== 'visible') return;
      if (lock && !lock.released) return;
      navigator.wakeLock
        .request('screen')
        .then((next) => {
          lock = next;
          if (done) lock.release().catch(() => {});
        })
        .catch(() => {});
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      document.removeEventListener('visibilitychange', request);
      setTimeout(() => {
        done = true;
        lock?.release().catch(() => {});
      }, WAKE_LOCK_HOLD);
    };
  }, [running]);

  const restart = () => {
    unlockChime();
    setTotal(DEFAULT_REST);
    setLeft(DEFAULT_REST);
    setEndsAt(Date.now() + DEFAULT_REST);
  };

  return {
    left,
    progress: total ? left / total : 0,
    running,
    restart,
    // From 0:00 it starts over
    start: () => {
      if (left === 0) return restart();
      unlockChime();
      setEndsAt(Date.now() + left);
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
