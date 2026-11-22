import {
  colorName,
  pieceName,
  resultText,
  typeName,
} from '@/lib/remorse/describe';
import { RULES } from '@/lib/remorse/engine';
import type {
  Color,
  GameEvent,
  GameState,
  Piece,
  PieceRef,
  Trauma,
} from '@/types/remorse';
import { markerSvg } from './markerSvg';

// Plays the animations and help labels for steps that just arrived. The board
// already shows the new state, so the old look is put back where an event will
// animate it (old markers, ghosts of pieces that die) and then each event plays
// in order. Moves and ordinary captures aren't animated.

export interface Scene {
  board: HTMLElement;
  fx: HTMLElement;
  // display column/row (0-7) of a square, flip-aware
  at: (square: string) => { c: number; r: number };
}

const SQ = 12.5;
const HOLD = 10 * 60 * 1000;
const MARKER_CSS =
  'position:absolute;right:-10%;top:-10%;width:52%;height:52%;z-index:10;filter:drop-shadow(0 2px 2px rgba(0,0,0,.55))';
const STAR =
  'clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)';
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

let uid = 0;
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
const markerKey = (piece: Piece) =>
  piece.trauma
    ? [piece.trauma, piece.healed, piece.turnsLeft, piece.kills].join()
    : '';
const markerHtml = (piece: Piece) =>
  piece.trauma
    ? markerSvg(`fx${uid++}`, {
        trauma: piece.trauma,
        healed: piece.healed,
        turnsLeft: piece.turnsLeft,
        kills: piece.kills,
      })
    : '';

const ROLL_TEXT: Record<Trauma, (name: string) => string> = {
  devastated: (name) =>
    `${name} is devastated: dies in ${RULES.devastatedTurns} turns unless a bishop heals it`,
  guilt: (name) => `${name} is guilt-ridden: can't capture until healed`,
  unaffected: (name) => `${name} is unaffected`,
  psychopath: (name) => `${name} is a psychopath`,
};

export const playSteps = (
  scene: Scene,
  prev: GameState,
  next: GameState,
  steps: GameEvent[][],
  reduced: boolean,
  // called once, when the animations finish or are cut short
  onDone: () => void,
) => {
  const { board, fx, at } = scene;
  let alive = true;
  const mine: Animation[] = [];
  const prevById = new Map(prev.pieces.map((p) => [p.id, p]));
  const nextById = new Map(next.pieces.map((p) => [p.id, p]));
  const events = steps.flat();

  const animate = (
    el: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    const animation = el.animate(keyframes, {
      fill: 'forwards',
      easing: 'ease-out',
      ...options,
    });
    mine.push(animation);
    return animation;
  };
  const run = (
    el: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) =>
    animate(el, keyframes, options).finished.then(
      () => undefined,
      () => undefined,
    );
  // On a real board element: starts from the first keyframe and returns to the
  // element's own styles at the end
  const reveal = (
    el: Element,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => run(el, keyframes, { fill: 'backwards', ...options });
  const hold = (el: Element, frame: Keyframe) =>
    animate(el, [frame, frame], { duration: HOLD });

  const pieceEl = (id: string) =>
    board.querySelector<HTMLElement>(`[data-piece-id="${id}"]`);
  const imgOf = (el: Element | null) =>
    el?.querySelector<HTMLElement>('[data-piece-img]') ?? null;
  const markerOf = (el: Element | null) =>
    el?.querySelector<HTMLElement>('[data-marker]') ?? null;

  const center = (square: string) => {
    const { c, r } = at(square);
    return { left: (c + 0.5) * SQ, top: (r + 0.5) * SQ };
  };
  // An effect centred on a square; size in squares, or px when a string
  const fxAt = (square: string, size: number | string, css = '') => {
    const el = document.createElement('div');
    const { left, top } = center(square);
    const width = typeof size === 'number' ? `${size * SQ}%` : size;
    const offset =
      typeof size === 'number' ? `${(-size * SQ) / 2}%` : `calc(${size} / -2)`;
    el.style.cssText = `position:absolute;left:${left}%;top:${top}%;width:${width};aspect-ratio:1;margin-left:${offset};margin-top:${offset};pointer-events:none;${css}`;
    fx.appendChild(el);
    return el;
  };
  const cover = (css: string) => {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;inset:0;pointer-events:none;${css}`;
    fx.appendChild(el);
    return el;
  };
  const squarePx = () => board.clientWidth / 8;

  // Help labels queue up so each one can be read
  let labels = Promise.resolve();
  const say = (text: string) => {
    labels = labels.then(async () => {
      if (!alive) return;
      const el = document.createElement('div');
      el.textContent = text;
      el.style.cssText =
        'position:absolute;left:50%;bottom:2%;transform:translateX(-50%);max-width:92%;text-align:center;background:rgba(20,16,12,.82);color:#fff;font-size:13px;line-height:1.3;padding:5px 12px;border-radius:14px;z-index:40;box-shadow:0 2px 8px rgba(0,0,0,.4)';
      fx.appendChild(el);
      await run(
        el,
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { opacity: 1, offset: 0.9 },
          { opacity: 0 },
        ],
        { duration: Math.min(4200, 1400 + text.length * 35) },
      );
      el.remove();
    });
  };

  let finished = false;
  const cleanup = () => {
    if (finished) return;
    finished = true;
    alive = false;
    for (const animation of mine) animation.cancel();
    fx.replaceChildren();
    onDone();
  };

  // Gives each new event its help label only
  const labelFor = (event: GameEvent): string | null => {
    switch (event.type) {
      case 'roll':
        return `Rolled ${event.roll} · ${ROLL_TEXT[event.trauma](
          pieceName(event.piece),
        )}`;
      case 'reactivate':
        return `${pieceName(event.piece)} captured again and is ${
          event.trauma === 'guilt' ? 'guilt-ridden' : event.trauma
        } once more`;
      case 'kill':
        return `${pieceName(event.piece)}: psychopath ${event.kills}/${
          RULES.bloodlustKills
        }`;
      case 'bloodlust':
        return `${pieceName(
          event.piece,
        )} is in bloodlust: it only moves to capture, friend or foe`;
      case 'extraMove':
        return `${pieceName(event.piece)} may move again`;
      case 'skipExtraMove':
        return `${pieceName(event.piece)} skipped its extra move`;
      case 'heal':
        return event.healer.id === event.piece.id
          ? `${pieceName(event.piece)} healed itself`
          : `${pieceName(event.healer)} healed the ${typeName(
              event.piece.type,
            )}`;
      case 'death':
        return `${pieceName(event.piece)} died of grief`;
      case 'check':
        return `${colorName(event.color)} is in check`;
      case 'promote':
        return `${colorName(event.piece.color)} pawn promoted to a ${typeName(
          event.piece.type,
        )}, markers kept`;
      case 'gameOver':
        return event.reason === 'checkmate'
          ? `Checkmate · ${resultText(event.winner)}`
          : event.reason === 'stalemate'
          ? 'Stalemate · draw'
          : `King captured · ${resultText(event.winner)}`;
      default:
        return null;
    }
  };

  // Devastated pieces whose countdown ticked, labelled at the end
  const ticks = next.pieces.filter((piece) => {
    const before = prevById.get(piece.id);
    return (
      before?.trauma === 'devastated' &&
      piece.trauma === 'devastated' &&
      !piece.healed &&
      piece.turnsLeft < before.turnsLeft &&
      !before.healed
    );
  });
  const tickText = (piece: Piece) =>
    piece.turnsLeft === 1
      ? `${pieceName(piece)}: last turn to be healed`
      : `${pieceName(piece)}: ${piece.turnsLeft} turns left to be healed`;

  if (reduced) {
    for (const event of events) {
      const text = labelFor(event);
      if (text) say(text);
    }
    for (const piece of ticks) say(tickText(piece));
    labels.then(cleanup);
    return cleanup;
  }

  // ---- Put the old look back --------------------------------------------

  // Where each piece's element sits in the DOM, and where it should look
  // Pieces jump straight to their new squares; only a piece that dies or a
  // captured king stays behind as a ghost for its own animation
  const visual = new Map<string, string>();
  const ghosts = new Map<string, HTMLElement>();
  const ghosted = new Set(
    events.flatMap((e) =>
      e.type === 'death'
        ? [e.piece.id]
        : e.type === 'capture' && e.captured.type === 'k'
        ? [e.captured.id]
        : [],
    ),
  );

  for (const piece of prev.pieces) {
    const after = nextById.get(piece.id);
    visual.set(piece.id, after?.square ?? piece.square);
    if (!after && ghosted.has(piece.id)) {
      const ghost = document.createElement('div');
      const { c, r } = at(piece.square);
      ghost.style.cssText = `position:absolute;left:${c * SQ}%;top:${
        r * SQ
      }%;width:${SQ}%;height:${SQ}%;z-index:5`;
      ghost.innerHTML = `<img data-piece-img src="/images/${piece.color}${piece.type}.png" alt="" style="width:100%;height:100%;display:block">`;
      if (piece.trauma) {
        const marker = document.createElement('span');
        marker.dataset.marker = '';
        marker.style.cssText = MARKER_CSS;
        marker.innerHTML = markerHtml(piece);
        ghost.appendChild(marker);
      }
      fx.appendChild(ghost);
      ghosts.set(piece.id, ghost);
    }
  }

  // Old markers over the real ones until their event swaps them
  const markerSwaps = new Map<
    string,
    { hidden: Animation | null; ghost: HTMLElement | null }
  >();
  for (const piece of next.pieces) {
    const before = prevById.get(piece.id);
    if (!before || markerKey(before) === markerKey(piece)) continue;
    const el = pieceEl(piece.id);
    const real = markerOf(el);
    let ghost: HTMLElement | null = null;
    if (before.trauma && el) {
      ghost = document.createElement('span');
      ghost.style.cssText = MARKER_CSS;
      ghost.innerHTML = markerHtml(before);
      el.appendChild(ghost);
    }
    markerSwaps.set(piece.id, {
      hidden: real ? hold(real, { opacity: 0 }) : null,
      ghost,
    });
  }
  const swapMarker = async (
    id: string,
    keyframes: Keyframe[] = [
      { opacity: 0, transform: 'scale(1.3)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
    duration = 450,
  ) => {
    const swap = markerSwaps.get(id);
    markerSwaps.delete(id);
    const real = markerOf(pieceEl(id));
    if (swap?.ghost) {
      const ghost = swap.ghost;
      run(ghost, [{ opacity: 1 }, { opacity: 0 }], { duration }).then(() =>
        ghost.remove(),
      );
    }
    swap?.hidden?.cancel();
    if (real) await reveal(real, keyframes, { duration });
  };

  // A promoted piece shows its pawn until the promotion plays
  const promotions = new Map<
    string,
    { hidden: Animation; ghost: HTMLElement }
  >();
  for (const piece of next.pieces) {
    const before = prevById.get(piece.id);
    const el = pieceEl(piece.id);
    const img = imgOf(el);
    if (!before || before.type === piece.type || !el || !img) continue;
    const ghost = document.createElement('img');
    ghost.src = `/images/${before.color}${before.type}.png`;
    ghost.alt = '';
    ghost.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    img.after(ghost);
    promotions.set(piece.id, { hidden: hold(img, { opacity: 0 }), ghost });
  }

  // Board highlights that should wait for their event
  const has = (type: GameEvent['type']) => events.some((e) => e.type === type);
  const checkEl = board.querySelector('[data-check]');
  const checkHidden =
    checkEl && has('check') ? hold(checkEl, { opacity: 0 }) : null;
  const extraEl = board.querySelector('[data-extra]');
  const extraHidden =
    extraEl && has('extraMove') ? hold(extraEl, { opacity: 0 }) : null;
  const extraImg = next.extraMovePieceId
    ? imgOf(pieceEl(next.extraMovePieceId))
    : null;
  const extraGlowHidden =
    extraImg && has('extraMove') ? hold(extraImg, { filter: 'none' }) : null;
  const auraHidden = new Map<string, Animation>();
  for (const event of events) {
    if (event.type !== 'bloodlust') continue;
    const img = imgOf(pieceEl(event.piece.id));
    if (img) auraHidden.set(event.piece.id, hold(img, { filter: 'none' }));
  }
  const mate = events.find(
    (e) => e.type === 'gameOver' && e.reason === 'checkmate',
  );
  const matedKing =
    mate?.type === 'gameOver' && mate.winner !== 'draw'
      ? next.pieces.find((p) => p.type === 'k' && p.color !== mate.winner)
      : undefined;
  const matedImg = matedKing ? imgOf(pieceEl(matedKing.id)) : null;
  const toppleHidden = matedImg ? hold(matedImg, { transform: 'none' }) : null;
  // The psychopath's waiting glow before a skip
  let skipGhost: HTMLElement | null = null;
  if (has('skipExtraMove') && prev.extraMovePieceId) {
    const square = prevById.get(prev.extraMovePieceId)?.square;
    if (square) {
      skipGhost = fxAt(square, 1, 'background:rgba(229,56,59,.45);z-index:1');
    }
  }

  // ---- Effects ------------------------------------------------------------

  const kingCaptured = async (id: string) => {
    const square = visual.get(id);
    const el = ghosts.get(id);
    if (!square || !el) return;
    const flash = cover('background:#fff;z-index:30');
    run(flash, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 450 }).then(
      () => flash.remove(),
    );
    shakeBoard(5, 380);
    for (let n = 0; n < 10; n++) {
      const shard = fxAt(
        square,
        '8px',
        `background:${
          n % 2 ? '#ffd257' : '#fff1b8'
        };clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);z-index:31`,
      );
      const angle = (n / 10) * Math.PI * 2;
      const reach = squarePx() * 0.9;
      run(
        shard,
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * reach}px,${
              Math.sin(angle) * reach
            }px) rotate(200deg) scale(.4)`,
            opacity: 0,
          },
        ],
        { duration: 650, easing: 'cubic-bezier(.2,.8,.4,1)' },
      ).then(() => shard.remove());
    }
    await run(
      el,
      [
        { transform: 'none', opacity: 1 },
        {
          transform: 'translate(-40%,-30%) rotate(-200deg) scale(1.1)',
          opacity: 1,
          offset: 0.4,
        },
        {
          transform: 'translate(-90%,40%) rotate(-540deg) scale(.3)',
          opacity: 0,
        },
      ],
      { duration: 800 },
    );
    el.remove();
  };

  const shake = (el: Element, px: number, duration: number) =>
    run(
      el,
      [0, 1, 2, 3, 4, 5, 6].map((i) => ({
        transform: `translateX(${i === 6 ? 0 : i % 2 ? -px : px}px)`,
      })),
      { duration, easing: 'linear', fill: 'none' },
    );
  const shakeBoard = (px: number, duration: number) =>
    run(
      board,
      [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
        transform:
          i === 7
            ? 'none'
            : `translate(${i % 2 ? -px : px}px,${i % 2 ? px / 2 : -px / 2}px)`,
      })),
      { duration, easing: 'linear', fill: 'none' },
    );

  const ring = async (
    square: string,
    color: string,
    from: number,
    to: number,
    duration: number,
    width = 4,
  ) => {
    const el = fxAt(
      square,
      1,
      `border-radius:50%;border:${width}px solid ${color};box-shadow:0 0 12px ${color};z-index:28`,
    );
    await run(
      el,
      [
        { transform: `scale(${from})`, opacity: from > to ? 0 : 1 },
        { transform: `scale(${(from + to) / 2})`, opacity: 0.9, offset: 0.4 },
        { transform: `scale(${to})`, opacity: 0 },
      ],
      { duration },
    );
    el.remove();
  };

  const sparkles = (square: string) => {
    for (let i = 0; i < 6; i++) {
      const el = fxAt(square, '7px', `background:#fff6c2;${STAR};z-index:29`);
      const x = (Math.random() - 0.5) * squarePx() * 0.6;
      const rise = squarePx() * 0.45;
      run(
        el,
        [
          { transform: `translate(${x}px,10px) scale(.4)`, opacity: 0 },
          {
            transform: `translate(${x}px,-8px) scale(1.6)`,
            opacity: 1,
            offset: 0.4,
          },
          {
            transform: `translate(${x * 1.2}px,${-rise}px) scale(.6)`,
            opacity: 0,
          },
        ],
        { duration: 800, delay: i * 70 },
      ).then(() => el.remove());
    }
  };

  // Offset from a square's centre to its piece's marker, in px
  const markerOffset = () => [squarePx() * 0.34, -squarePx() * 0.34];

  const rollDie = async (square: string, value: number) => {
    const die = document.createElement('div');
    const { left, top } = center(square);
    die.style.cssText = `position:absolute;left:${left}%;top:${
      top - SQ * 0.5
    }%;width:34px;height:34px;margin-left:-17px;margin-top:-26px;background:#f7f3ea;border:2px solid #120d0b;border-radius:8px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));padding:4px;z-index:35;box-shadow:0 3px 6px rgba(0,0,0,.45)`;
    const pips: HTMLElement[] = [];
    for (let i = 0; i < 9; i++) {
      const pip = document.createElement('i');
      pip.style.cssText =
        'width:6px;height:6px;border-radius:50%;background:#120d0b;place-self:center';
      die.appendChild(pip);
      pips.push(pip);
    }
    const face = (n: number) => {
      for (const [i, pip] of pips.entries()) {
        pip.style.visibility = PIPS[n].includes(i) ? 'visible' : 'hidden';
        pip.style.background = n === 1 ? '#c62828' : '#120d0b';
        pip.style.width = pip.style.height = n === 1 ? '9px' : '6px';
      }
    };
    fx.appendChild(die);
    let shown = 1;
    face(shown);
    const timer = setInterval(() => {
      shown = (shown % 6) + 1;
      face(shown);
    }, 70);
    await run(
      die,
      [
        { transform: 'translateY(-50px) rotate(0) scale(.5)', opacity: 0 },
        {
          transform: 'translateY(8px) rotate(420deg) scale(1)',
          opacity: 1,
          offset: 0.55,
        },
        { transform: 'translateY(-10px) rotate(600deg)', offset: 0.78 },
        { transform: 'translateY(0) rotate(720deg)', opacity: 1 },
      ],
      { duration: 850 },
    );
    clearInterval(timer);
    face(value);
    await run(
      die,
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.35)' },
        { transform: 'scale(1)' },
      ],
      { duration: 260 },
    );
    await sleep(200);
    run(die, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-16px)' }], {
      duration: 300,
    }).then(() => die.remove());
  };

  // The label waits for the die to land so it doesn't give the result away
  const roll = async (
    piece: PieceRef,
    value: number,
    trauma: Trauma,
    text: string | null,
  ) => {
    const square = visual.get(piece.id);
    const el = pieceEl(piece.id);
    const img = imgOf(el);
    if (!square || !el || !img) {
      if (text) say(text);
      return;
    }
    await rollDie(square, value);
    if (text) say(text);
    if (trauma === 'devastated') {
      ring(square, '#5fb2ff', 0.4, 2.6, 800, 3);
      reveal(
        img,
        [
          { transform: 'none' },
          {
            transform: 'translateY(6%) scaleY(.92)',
            filter: 'saturate(.4) brightness(.85)',
            offset: 0.35,
          },
          { transform: 'none', filter: 'none' },
        ],
        { duration: 900 },
      );
      shake(el, 3, 450);
      const tear = fxAt(
        square,
        '10px',
        'border-radius:50% 50% 50% 0;rotate:-45deg;background:#6fc0ff;border:1.5px solid #120d0b;z-index:30',
      );
      const fall = squarePx() * 0.5;
      run(
        tear,
        [
          { translate: '-6px -4px', opacity: 0 },
          { translate: '-6px 4px', opacity: 1, offset: 0.25 },
          { translate: `-6px ${fall}px`, opacity: 0 },
        ],
        { duration: 900, easing: 'ease-in' },
      ).then(() => tear.remove());
      await sleep(250);
      await swapMarker(
        piece.id,
        [
          { transform: 'scale(0) rotate(-25deg)', opacity: 0 },
          { transform: 'scale(1.3) rotate(6deg)', opacity: 1, offset: 0.6 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        520,
      );
    } else if (trauma === 'guilt') {
      ring(square, '#c98a1c', 2.4, 0.5, 900, 6);
      reveal(
        img,
        [
          { transform: 'none', filter: 'none' },
          {
            transform: 'translateY(5%) scaleY(.9) rotate(-4deg)',
            filter: 'brightness(.45) sepia(.6)',
            offset: 0.45,
          },
          { transform: 'none', filter: 'none' },
        ],
        { duration: 1200, easing: 'ease-in-out' },
      );
      await sleep(450);
      await swapMarker(
        piece.id,
        [
          { opacity: 0, filter: 'blur(6px)', transform: 'scale(.7)' },
          { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
        ],
        750,
      );
    } else if (trauma === 'unaffected') {
      await swapMarker(
        piece.id,
        [
          { transform: 'translateY(-70px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        300,
      );
      const marker = markerOf(el);
      if (marker) {
        reveal(
          marker,
          [
            { transform: 'scale(1.25,.75)' },
            { transform: 'scale(.95,1.05)', offset: 0.5 },
            { transform: 'scale(1)' },
          ],
          { duration: 260 },
        );
      }
      reveal(
        img,
        [
          { transform: 'none' },
          { transform: 'translateY(3%) scaleY(.96)' },
          { transform: 'none' },
        ],
        { duration: 220 },
      );
      const [ox, oy] = markerOffset();
      for (const dir of [-1, 1]) {
        const puff = fxAt(
          square,
          '14px',
          'border-radius:50%;background:rgba(200,195,185,.85);z-index:30',
        );
        run(
          puff,
          [
            {
              transform: `translate(${ox}px,${oy + 14}px) scale(.4)`,
              opacity: 0.9,
            },
            {
              transform: `translate(${ox + dir * 26}px,${oy + 8}px) scale(1.4)`,
              opacity: 0,
            },
          ],
          { duration: 500 },
        ).then(() => puff.remove());
      }
      await sleep(300);
    } else {
      const flash = fxAt(
        square,
        1,
        'background:radial-gradient(circle,#ff2b2b 0,rgba(255,43,43,.5) 55%,transparent 72%);z-index:4',
      );
      run(
        flash,
        [
          { opacity: 0, transform: 'scale(.6)' },
          { opacity: 0.9, transform: 'scale(1.3)', offset: 0.3 },
          { opacity: 0, transform: 'scale(1.6)' },
        ],
        { duration: 650 },
      ).then(() => flash.remove());
      reveal(
        img,
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
          transform: `rotate(${i === 8 ? 0 : i % 2 ? -7 : 7}deg) translateY(${
            i % 2 ? -2 : 0
          }%)`,
        })),
        { duration: 700, easing: 'linear' },
      );
      await sleep(150);
      await swapMarker(
        piece.id,
        [
          { transform: 'scale(0) rotate(-360deg)', opacity: 0 },
          { transform: 'scale(1.3) rotate(10deg)', opacity: 1, offset: 0.7 },
          { transform: 'scale(1) rotate(0)', opacity: 1 },
        ],
        600,
      );
    }
  };

  const healMotes = async (from: string, to: string) => {
    const a = at(from);
    const b = at(to);
    const dx = (b.c - a.c) * squarePx();
    const dy = (b.r - a.r) * squarePx();
    const motes: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const mote = fxAt(
        from,
        '7px',
        'border-radius:50%;background:#fff6c2;box-shadow:0 0 8px 2px #ffe27a;z-index:29',
      );
      motes.push(
        run(
          mote,
          [
            { transform: 'translate(0,0) scale(.4)', opacity: 0 },
            {
              transform: `translate(${dx * 0.5 + (i - 2) * 6}px,${
                dy * 0.5 - 10
              }px) scale(1)`,
              opacity: 1,
              offset: 0.5,
            },
            { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0.2 },
          ],
          { duration: 600, delay: i * 60, easing: 'ease-in-out' },
        ).then(() => mote.remove()),
      );
    }
    await Promise.all(motes);
  };

  const healed = async (piece: PieceRef) => {
    const square = visual.get(piece.id);
    const el = pieceEl(piece.id);
    if (!square || !el) return;
    reveal(
      el,
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.12)' },
        { transform: 'scale(1)' },
      ],
      { duration: 500, composite: 'add' },
    );
    sparkles(square);
    await swapMarker(piece.id);
  };

  const heal = async (healer: PieceRef, patients: PieceRef[]) => {
    const square = visual.get(healer.id);
    const img = imgOf(pieceEl(healer.id));
    if (!square) return;
    if (img) {
      reveal(
        img,
        [
          { filter: 'drop-shadow(0 0 0 #ffe27a)' },
          { filter: 'drop-shadow(0 0 9px #ffe27a)', offset: 0.4 },
          { filter: 'drop-shadow(0 0 0 #ffe27a)' },
        ],
        { duration: 1100 },
      );
    }
    ring(square, '#9be27a', 0.5, 3.4, 900, 3);
    await sleep(250);
    await Promise.all(
      patients.map(async (patient, i) => {
        await sleep(i * 120);
        const to = visual.get(patient.id);
        if (to) await healMotes(square, to);
        await healed(patient);
      }),
    );
  };

  const selfHeal = async (bishop: PieceRef) => {
    const square = visual.get(bishop.id);
    const img = imgOf(pieceEl(bishop.id));
    if (!square) return;
    if (img) {
      reveal(
        img,
        [
          { filter: 'brightness(1) drop-shadow(0 0 0 #ffe27a)' },
          {
            filter: 'brightness(1.5) drop-shadow(0 0 10px #ffe27a)',
            offset: 0.5,
          },
          { filter: 'brightness(1) drop-shadow(0 0 0 #ffe27a)' },
        ],
        { duration: 1400 },
      );
    }
    await ring(square, '#ffe27a', 2.4, 0.7, 800, 4);
    sparkles(square);
    await swapMarker(bishop.id);
  };

  const kill = async (piece: PieceRef) => {
    const square = visual.get(piece.id);
    await swapMarker(
      piece.id,
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.45) rotate(-6deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      600,
    );
    if (!square) return;
    const [ox, oy] = markerOffset();
    const spark = fxAt(
      square,
      '30px',
      `border-radius:50%;background:radial-gradient(circle,#fff 0,#ff6b6b 35%,transparent 70%);translate:${ox}px ${oy}px;z-index:30`,
    );
    run(
      spark,
      [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1.6)', opacity: 0 },
      ],
      { duration: 500 },
    ).then(() => spark.remove());
  };

  const bloodlust = async (piece: PieceRef) => {
    const vignette = cover(
      'background:radial-gradient(circle,transparent 35%,rgba(150,0,0,.85) 100%);z-index:27',
    );
    run(
      vignette,
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { opacity: 0.35, offset: 0.6 },
        { opacity: 0 },
      ],
      { duration: 1500 },
    ).then(() => vignette.remove());
    shakeBoard(3, 300);
    auraHidden.get(piece.id)?.cancel();
    await swapMarker(
      piece.id,
      [
        { transform: 'scale(1)', clipPath: 'inset(0 0 30% 0)', opacity: 1 },
        {
          transform: 'scale(1.55) rotate(-8deg)',
          clipPath: 'inset(0 0 30% 0)',
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: 'scale(1)',
          clipPath: 'inset(0 0 30% 0)',
          opacity: 1,
          offset: 0.6,
        },
        { transform: 'scale(1)', clipPath: 'inset(0 0 0 0)', opacity: 1 },
      ],
      1300,
    );
  };

  const death = async (piece: PieceRef) => {
    const el = ghosts.get(piece.id);
    const square = visual.get(piece.id);
    if (!el || !square) return;
    const marker = markerOf(el);
    const img = imgOf(el);
    if (marker) {
      for (let i = 0; i < 2; i++) {
        await run(
          marker,
          [
            { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #ff5a4e)' },
            {
              transform: 'scale(1.25)',
              filter: 'drop-shadow(0 0 8px #ff5a4e)',
              offset: 0.25,
            },
            {
              transform: 'scale(1)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.55))',
            },
          ],
          { duration: 480, fill: 'none' },
        );
      }
      const before = prevById.get(piece.id);
      if (before) marker.innerHTML = markerHtml({ ...before, turnsLeft: 0 });
    }
    if (img) {
      await run(
        img,
        [{ filter: 'none' }, { filter: 'grayscale(1) brightness(.8)' }],
        {
          duration: 500,
        },
      );
    }
    await shake(el, 2, 500);
    const ghost = document.createElement('img');
    ghost.src = `/images/${piece.color}${piece.type}.png`;
    ghost.alt = '';
    const { c, r } = at(square);
    ghost.style.cssText = `position:absolute;left:${c * SQ}%;top:${
      r * SQ
    }%;width:${SQ}%;height:${SQ}%;filter:grayscale(1) brightness(2.2) blur(1px);opacity:0;pointer-events:none;z-index:6`;
    fx.appendChild(ghost);
    const w = squarePx();
    const dust: Promise<void>[] = [];
    for (let i = 0; i < 22; i++) {
      const bit = fxAt(
        square,
        `${3 + Math.random() * 4}px`,
        `background:${
          Math.random() > 0.5 ? '#d9d6cf' : '#8d8a84'
        };border-radius:1px;z-index:7`,
      );
      const sx = (Math.random() - 0.5) * w * 0.55;
      const sy = (Math.random() - 0.3) * w * 0.6;
      dust.push(
        run(
          bit,
          [
            { transform: `translate(${sx}px,${sy}px)`, opacity: 1 },
            {
              transform: `translate(${sx + (Math.random() - 0.5) * 40}px,${
                sy + 25 + Math.random() * 30
              }px) rotate(${Math.random() * 180}deg)`,
              opacity: 0,
            },
          ],
          {
            duration: 900 + Math.random() * 500,
            delay: Math.random() * 250,
            easing: 'ease-in',
          },
        ).then(() => bit.remove()),
      );
    }
    run(
      el,
      [
        { opacity: 1, transform: 'none', filter: 'blur(0)' },
        {
          opacity: 0,
          transform: 'translateY(8%) scaleY(.85)',
          filter: 'blur(2px)',
        },
      ],
      { duration: 650, easing: 'ease-in' },
    ).then(() => el.remove());
    run(
      ghost,
      [
        { opacity: 0, transform: 'translateY(0)' },
        { opacity: 0.55, transform: 'translateY(-15%)', offset: 0.3 },
        { opacity: 0, transform: 'translateY(-70%)' },
      ],
      { duration: 1600, delay: 200 },
    ).then(() => ghost.remove());
    await Promise.all(dust);
  };

  const tick = async (piece: Piece) => {
    const before = prevById.get(piece.id);
    const swap = markerSwaps.get(piece.id);
    const square = visual.get(piece.id);
    if (!before || !swap?.ghost || !square) return;
    await run(
      swap.ghost,
      [
        { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 #5fb2ff)' },
        {
          transform: 'scale(1.25)',
          filter: 'drop-shadow(0 0 8px #5fb2ff)',
          offset: 0.25,
        },
        { transform: 'scale(1)', filter: 'none' },
      ],
      { duration: 420, fill: 'none' },
    );
    const [ox, oy] = markerOffset();
    const shard = fxAt(
      square,
      '9px',
      'background:#5fb2ff;border:1.5px solid #120d0b;border-radius:2px;z-index:30',
    );
    run(
      shard,
      [
        { transform: `translate(${ox}px,${oy}px) rotate(0)`, opacity: 1 },
        {
          transform: `translate(${ox + 14}px,${
            oy + squarePx()
          }px) rotate(160deg)`,
          opacity: 0,
        },
      ],
      { duration: 800, easing: 'ease-in' },
    ).then(() => shard.remove());
    await swapMarker(piece.id, [{ opacity: 0 }, { opacity: 1 }], 250);
  };

  const check = async (color: Color) => {
    const king = next.pieces.find((p) => p.type === 'k' && p.color === color);
    checkHidden?.cancel();
    if (!king) return;
    if (checkEl) {
      reveal(
        checkEl,
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.15 },
          { opacity: 0.45, offset: 0.4 },
          { opacity: 1, offset: 0.6 },
          { opacity: 0.5, offset: 0.8 },
          { opacity: 1 },
        ],
        { duration: 1100 },
      );
    }
    const burst = fxAt(
      king.square,
      1,
      'border:3px solid #ff4d4d;box-shadow:0 0 10px #ff4d4d;z-index:28',
    );
    run(
      burst,
      [
        { transform: 'scale(.9)', opacity: 1 },
        { transform: 'scale(1.5)', opacity: 0 },
      ],
      { duration: 700 },
    ).then(() => burst.remove());
    const img = imgOf(pieceEl(king.id));
    if (img) {
      reveal(
        img,
        [
          { transform: 'none' },
          { transform: 'translateY(-6%) rotate(-5deg)', offset: 0.3 },
          { transform: 'none' },
        ],
        { duration: 420 },
      );
    }
    await sleep(700);
  };

  const topple = async () => {
    if (!matedImg) return;
    toppleHidden?.cancel();
    const dim = cover('background:rgba(10,8,6,.55);z-index:26');
    await sleep(500);
    await reveal(
      matedImg,
      [
        { transform: 'rotate(0)', transformOrigin: '75% 92%' },
        {
          transform: 'rotate(-8deg)',
          transformOrigin: '75% 92%',
          offset: 0.25,
        },
        {
          transform: 'rotate(84deg) translateY(-4%)',
          transformOrigin: '75% 92%',
          offset: 0.85,
        },
        {
          transform: 'rotate(78deg) translateY(-4%)',
          transformOrigin: '75% 92%',
        },
      ],
      { duration: 900, easing: 'ease-in' },
    );
    run(dim, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], {
      duration: 2600,
    }).then(() => dim.remove());
  };

  const promote = async (piece: PieceRef) => {
    const square = visual.get(piece.id);
    const promotion = promotions.get(piece.id);
    const img = imgOf(pieceEl(piece.id));
    if (!square || !promotion || !img) return;
    promotions.delete(piece.id);
    const { c, r } = at(square);
    const beam = document.createElement('div');
    const fromTop = r === 0;
    beam.style.cssText = `position:absolute;left:${c * SQ}%;${
      fromTop ? 'top:0' : 'bottom:0'
    };width:${SQ}%;height:${SQ * 2}%;background:linear-gradient(${
      fromTop ? 'to bottom' : 'to top'
    },rgba(255,244,190,.95),rgba(255,244,190,.35) 50%,transparent);transform-origin:${
      fromTop ? 'top' : 'bottom'
    };pointer-events:none;z-index:29`;
    fx.appendChild(beam);
    run(
      beam,
      [
        { transform: 'scaleY(0)', opacity: 1 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.4 },
        { transform: 'scaleY(1)', opacity: 0 },
      ],
      { duration: 1100 },
    ).then(() => beam.remove());
    await sleep(300);
    const ghost = promotion.ghost;
    run(
      ghost,
      [
        { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 },
        { transform: 'scale(.7)', filter: 'brightness(3)', opacity: 0 },
      ],
      { duration: 350 },
    ).then(() => ghost.remove());
    promotion.hidden.cancel();
    await reveal(
      img,
      [
        { transform: 'scale(1.4)', filter: 'brightness(3)', opacity: 0 },
        { transform: 'scale(1)', filter: 'brightness(1)', opacity: 1 },
      ],
      { duration: 500, delay: 150 },
    );
    sparkles(square);
  };

  const extraMove = async () => {
    extraHidden?.cancel();
    extraGlowHidden?.cancel();
    if (extraEl) {
      await reveal(extraEl, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 400,
      });
    }
  };

  const skipExtraMove = async () => {
    if (!skipGhost) return;
    const el = skipGhost;
    await run(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 600 });
    el.remove();
  };

  // ---- Sequence -----------------------------------------------------------

  const tickedColors = new Set(ticks.map((piece) => piece.color));
  const lastStepOf = (color: Color) => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i].some((e) => e.type === 'move' && e.piece.color === color))
        return i;
    }
    return steps.length - 1;
  };
  const tickStep = new Map(
    [...tickedColors].map((color) => [color, lastStepOf(color)]),
  );

  let over = false;
  const playStep = async (stepEvents: GameEvent[], stepIndex: number) => {
    const handled = new Set<number>();
    let ticked = false;
    const runTicks = async () => {
      if (ticked) return;
      ticked = true;
      const due = ticks.filter(
        (piece) => tickStep.get(piece.color) === stepIndex,
      );
      for (const piece of due) {
        say(tickText(piece));
        await tick(piece);
      }
    };
    for (const [i, event] of stepEvents.entries()) {
      if (!alive) return;
      if (handled.has(i)) continue;
      if (
        event.type === 'death' ||
        event.type === 'check' ||
        event.type === 'gameOver'
      ) {
        await runTicks();
      }
      const text = labelFor(event);
      if (text && event.type !== 'heal' && event.type !== 'roll') say(text);
      switch (event.type) {
        case 'capture':
          if (event.captured.type === 'k') {
            await kingCaptured(event.captured.id);
          }
          break;
        case 'promote':
          await promote(event.piece);
          break;
        case 'roll':
          await roll(event.piece, event.roll, event.trauma, text);
          break;
        case 'reactivate':
          await swapMarker(event.piece.id, [{ opacity: 1 }, { opacity: 1 }], 0);
          break;
        case 'kill':
          await kill(event.piece);
          break;
        case 'bloodlust':
          await bloodlust(event.piece);
          break;
        case 'extraMove':
          await extraMove();
          break;
        case 'skipExtraMove':
          await skipExtraMove();
          break;
        case 'heal': {
          if (event.healer.id === event.piece.id) {
            if (text) say(text);
            await selfHeal(event.piece);
            break;
          }
          const patients = [event.piece];
          for (let j = i + 1; j < stepEvents.length; j++) {
            const later = stepEvents[j];
            if (later.type !== 'heal' || later.healer.id !== event.healer.id)
              break;
            handled.add(j);
            patients.push(later.piece);
          }
          for (const patient of patients) {
            say(
              `${pieceName(event.healer)} healed the ${typeName(patient.type)}`,
            );
          }
          await heal(event.healer, patients);
          break;
        }
        case 'death':
          await death(event.piece);
          break;
        case 'check':
          await check(event.color);
          break;
        case 'gameOver':
          // Nothing after the end of the game gets played or labelled
          over = true;
          if (event.reason === 'checkmate') await topple();
          return;
      }
    }
    await runTicks();
  };

  (async () => {
    for (const [i, stepEvents] of steps.entries()) {
      if (!alive || over) break;
      await playStep(stepEvents, i);
    }
    await labels;
    cleanup();
  })();

  return cleanup;
};
