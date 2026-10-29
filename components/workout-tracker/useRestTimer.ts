import { create } from 'zustand';

// Safari 16.4+, not in lib.dom yet
declare global {
  interface Navigator {
    audioSession?: { type: string };
  }
}

const DEFAULT_REST = 170_000;
const CHIME_SRC = '/audio/timerDone.mp3';
const CHIME_REPEATS = 3;

// The chime is scheduled on the audio clock when the timer starts. Background
// tabs throttle JS timers (by up to a minute in Chrome), the audio clock
// isn't throttled.
let context: AudioContext | undefined;
let chimeBuffer: Promise<AudioBuffer> | undefined;
let scheduled: AudioBufferSourceNode[] = [];
let scheduleId = 0;

const getContext = () => {
  if (!context) {
    // iOS mutes Web Audio with the silent switch unless it's 'playback'
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    context = new AudioContext();
  }
  return context;
};

const loadChime = (ctx: AudioContext) =>
  (chimeBuffer ??= fetch(CHIME_SRC)
    .then((res) => res.arrayBuffer())
    .then((data) => ctx.decodeAudioData(data)));

const cancelChime = () => {
  scheduleId++;
  for (const source of scheduled) source.stop();
  scheduled = [];
};

// Must run in a tap so the context is allowed to start
const scheduleChime = (endsAt: number) => {
  cancelChime();
  const id = scheduleId;
  const ctx = getContext();
  Promise.all([loadChime(ctx), ctx.resume()])
    .then(([buffer]) => {
      if (id !== scheduleId) return;
      const at = ctx.currentTime + Math.max(0, endsAt - Date.now()) / 1000;
      for (let i = 0; i < CHIME_REPEATS; i++) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(at + i * buffer.duration);
        scheduled.push(source);
      }
    })
    // Missing file or autoplay blocked
    .catch(() => {});
};

interface RestTimerState {
  total: number;
  left: number;
  endsAt: number | null;
  /** Whether the sheet is open */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Starts a fresh rest; leaves the sheet as it is */
  restart: () => void;
  /** From 0:00 it starts over */
  start: () => void;
  pause: () => void;
  reset: () => void;
  adjust: (delta: number) => void;
}

// Lives outside React so the timer survives switching tabs
let tickId: ReturnType<typeof setInterval> | undefined;

const stopTicking = () => {
  clearInterval(tickId);
  tickId = undefined;
};

// Times in ms. Counts down from an end time rather than per tick, so it
// stays right when the browser throttles timers.
export const useRestTimer = create<RestTimerState>((set, get) => {
  const run = (endsAt: number) => {
    set({ endsAt });
    scheduleChime(endsAt);
    stopTicking();
    tickId = setInterval(() => {
      const left = Math.max(0, endsAt - Date.now());
      set({ left });
      if (left > 0) return;
      stopTicking();
      set({ endsAt: null });
    }, 100);
  };

  const stop = () => {
    stopTicking();
    cancelChime();
    set({ endsAt: null });
  };

  const restart = () => {
    set({ total: DEFAULT_REST, left: DEFAULT_REST });
    run(Date.now() + DEFAULT_REST);
  };

  return {
    total: DEFAULT_REST,
    left: DEFAULT_REST,
    endsAt: null,
    open: false,
    setOpen: (open) => set({ open }),
    restart,
    start: () => {
      const { left } = get();
      if (left === 0) return restart();
      run(Date.now() + left);
    },
    pause: stop,
    reset: () => {
      stop();
      set({ total: DEFAULT_REST, left: DEFAULT_REST });
    },
    // Cut to 0 while running → finishes on the next tick
    adjust: (delta) => {
      const { left, total, endsAt } = get();
      const next = Math.max(0, left + delta);
      set({ left: next, total: Math.max(next, total + delta) });
      if (endsAt !== null) run(Date.now() + next);
    },
  };
});
