// Pawn player icons, from the favicon studies. Each is drawn on a 64×64 grid
// and built as an SVG string; ids are prefixed per instance so gradients and
// clip paths don't collide.

import type { PawnIcon } from '@/lib/remorse/icons';

const OUT = '#120d0b';

const radial = (id: string, a: string, b: string, c: string) =>
  `<radialGradient id="${id}" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
const linear = (id: string, a: string, b: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const medallion = (fill: string) =>
  `<circle cx="32" cy="32" r="29.5" fill="url(#${fill})" stroke="${OUT}" stroke-width="3"/><path d="M11 25 A22 22 0 0 1 42 9.5" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
const clip = (id: string) =>
  `<clipPath id="${id}"><circle cx="32" cy="32" r="28"/></clipPath>`;

const BODY = 'M26 30.5C26.5 38 24 44 21 49H43C40 44 37.5 38 38 30.5Z';
const pawn = (fill: string, stroke = OUT, width = 2.6) =>
  `<path d="${BODY}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>` +
  `<rect x="23" y="26" width="18" height="5" rx="2.5" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>` +
  `<rect x="16" y="48" width="32" height="8.5" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const head = (fill: string, cy = 17, r = 8.5) =>
  `<circle cx="32" cy="${cy}" r="${r}" fill="${fill}" stroke="${OUT}" stroke-width="2.6"/>`;
const HOOD = `<path d="M32 6.5c-7.6 0-12.2 6.3-12.2 13.8 0 3.7 1.2 6.6 2.7 8.7h19c1.5-2.1 2.7-5 2.7-8.7 0-7.5-4.6-13.8-12.2-13.8z" fill="#4b3322" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M24.5 14.5c1.5-3 3.7-4.9 6.4-5.4" stroke="#7a5a40" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="32" cy="20.5" rx="5.6" ry="6.4" fill="#140d08"/>
  <path d="M28.4 21.6q1.5 1.4 3 0M32.6 21.6q1.5 1.4 3 0" stroke="#e6c48e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;

// How the art fills a round avatar: a medallion is already round; a tile is
// square and gets cropped to the circle; a loose figure sits on a dark disc
export type PawnShape = 'medallion' | 'tile' | 'figure';

const ART: Record<
  PawnIcon,
  { shape: PawnShape; body: (id: string) => string }
> = {
  'pawn-hooded-medallion': {
    shape: 'medallion',
    body: (id) =>
      `<defs>${radial(`${id}g`, '#ffd27a', '#c98a1c', '#5e3a06')}${clip(
        `${id}c`,
      )}</defs>${medallion(`${id}g`)}
      <g clip-path="url(#${id}c)">${pawn('#4b3322')}${HOOD}</g>`,
  },
  'pawn-bowed': {
    shape: 'medallion',
    body: (id) =>
      `<defs>${radial(`${id}g`, '#ffd27a', '#c98a1c', '#5e3a06')}${clip(
        `${id}c`,
      )}</defs>${medallion(`${id}g`)}
      <g clip-path="url(#${id}c)">${pawn('#efe6d2')}
      <g transform="rotate(22 32 29) translate(1 3)">${head('#efe6d2', 17, 8.2)}
        <path d="M22.6 18.5c0-6.5 4.2-10.8 9.4-10.8s9.4 4.3 9.4 10.8c-2.6-2-5.8-3-9.4-3s-6.8 1-9.4 3z" fill="#4b3322" stroke="${OUT}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M28 21q1.6 1.2 3.2 0M33 21q1.6 1.2 3.2 0" stroke="${OUT}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></g>`,
  },
  'pawn-devastated': {
    shape: 'medallion',
    body: (id) =>
      `<defs>${radial(`${id}g`, '#7fb8ff', '#2c63c9', '#13265e')}${clip(
        `${id}c`,
      )}</defs>${medallion(`${id}g`)}
      <g clip-path="url(#${id}c)">${pawn('#e9f3ff')}${head('#e9f3ff')}
      <path d="M32.5 9.5 30 15l3.6 3.4-3 5 3.4 4.6-2.6 6 3 5.6-2.4 6 2 6.4" stroke="${OUT}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
      <path d="M41 20.5c0 2.3-1.6 4-3.2 4s-3.2-1.7-3.2-4c0-2 3.2-5.8 3.2-5.8s3.2 3.8 3.2 5.8z" fill="#6fc0ff" stroke="${OUT}" stroke-width="1.6"/></g>`,
  },
  'pawn-psychopath': {
    shape: 'medallion',
    body: (id) =>
      `<defs>${radial(`${id}g`, '#ff8a80', '#c62828', '#5a0d0d')}${clip(
        `${id}c`,
      )}</defs>${medallion(`${id}g`)}
      <g clip-path="url(#${id}c)">${pawn(
        '#f1ece2',
      )}<circle cx="32" cy="17" r="10" fill="#f1ece2" stroke="${OUT}" stroke-width="2.6"/>
      <path d="M25.6 14.5l5 1.9-.7 1.9c-2.2.1-3.9-1.2-4.3-3.8zM38.4 14.5l-5 1.9.7 1.9c2.2.1 3.9-1.2 4.3-3.8z" fill="${OUT}"/>
      <path d="M25.2 20.5c2.2 3.3 4.3 4.5 6.8 4.5s4.6-1.2 6.8-4.5c-2.2 1-4.3 1.4-6.8 1.4s-4.6-.4-6.8-1.4z" fill="${OUT}"/>
      <path d="M27.6 21.7v1.4M30 22.1v1.9M32 22.2v2M34 22.1v1.9M36.4 21.7v1.4" stroke="#f1ece2" stroke-width="1.1"/></g>`,
  },
  'pawn-bandaged': {
    shape: 'medallion',
    body: (id) =>
      `<defs>${radial(`${id}g`, '#c9d3cc', '#7d8a80', '#353d37')}${clip(
        `${id}c`,
      )}</defs>${medallion(`${id}g`)}
      <g clip-path="url(#${id}c)">${pawn('#efe6d2')}${head('#efe6d2')}
      <g transform="translate(32 38) rotate(-32)"><rect x="-15" y="-4.6" width="30" height="9.2" rx="4.6" fill="#efd2a8" stroke="${OUT}" stroke-width="2.2"/><rect x="-4" y="-3.6" width="8" height="7.2" fill="#f9ead2"/>
      <circle cx="-10" cy="-1.3" r=".9" fill="#b8915f"/><circle cx="-8" cy="1.6" r=".9" fill="#b8915f"/><circle cx="10" cy="-1.3" r=".9" fill="#b8915f"/><circle cx="8" cy="1.6" r=".9" fill="#b8915f"/></g></g>`,
  },
  'pawn-fate-die': {
    shape: 'figure',
    body: () =>
      `<g transform="rotate(-10 32 32)"><rect x="6" y="6" width="52" height="52" rx="11" fill="#f7f3ea" stroke="${OUT}" stroke-width="3.2"/>
      <path d="M11 17c1-4 3.5-6 7.5-6.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g transform="translate(32 33) scale(.62) translate(-32 -32)">${pawn(
        '#c62828',
        OUT,
        3.6,
      )}<circle cx="32" cy="17" r="8.5" fill="#c62828" stroke="${OUT}" stroke-width="3.6"/></g></g>`,
  },
  'pawn-hooded': {
    shape: 'figure',
    body: (id) =>
      `<defs>${linear(`${id}a`, '#ffd27a', '#b5770f')}</defs>
      <g transform="translate(32 32) scale(1.08) translate(-32 -31)">${pawn(
        `url(#${id}a)`,
        OUT,
        3,
      )}${HOOD}</g>`,
  },
  'pawn-cloaked': {
    shape: 'tile',
    body: (id) =>
      `<defs>${radial(`${id}g`, '#ffd27a', '#c98a1c', '#5e3a06')}</defs>
      <rect x="2.5" y="2.5" width="59" height="59" rx="14" fill="url(#${id}g)" stroke="${OUT}" stroke-width="3"/>
      <path d="M32 9c-6.8 0-11 5.6-11 12.3 0 3.4 1.1 6 2.4 8-1 7.4-3.4 13.6-7.4 19.2-.9 1.3 0 3 1.6 3h28.8c1.6 0 2.5-1.7 1.6-3-4-5.6-6.4-11.8-7.4-19.2 1.3-2 2.4-4.6 2.4-8C43 14.6 38.8 9 32 9z" fill="#4b3322" stroke="${OUT}" stroke-width="2.8" stroke-linejoin="round"/>
      <rect x="14" y="49.5" width="36" height="6.5" rx="3" fill="#3a2618" stroke="${OUT}" stroke-width="2.6"/>
      <path d="M25 17c1.4-2.8 3.4-4.5 5.8-5" stroke="#7a5a40" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="32" cy="21" rx="5.4" ry="6.2" fill="#140d08"/>
      <path d="M28.5 22q1.5 1.4 3 0M32.5 22q1.5 1.4 3 0" stroke="#e6c48e" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  },
  'pawn-bloodlust': {
    shape: 'tile',
    body: (id) =>
      `<defs>${linear(`${id}a`, '#d9363b', '#6d0b10')}</defs>
      <rect x="2.5" y="2.5" width="59" height="59" rx="14" fill="#1c0d0d" stroke="${OUT}" stroke-width="3"/>
      <g transform="translate(0 -3)">${pawn(`url(#${id}a)`, OUT, 2.8)}${head(
        `url(#${id}a)`,
      )}
      <circle cx="29" cy="17" r="1.8" fill="#ffd0d0"/><circle cx="35" cy="17" r="1.8" fill="#ffd0d0"/>
      <path d="M22 56.5c0 3 .8 5.5 2 5.5s2-2.5 2-5.5zM31 56.5c0 4 1 7 2.2 7s2.1-3 2.1-7zM40 56.5c0 2.3.7 4.2 1.6 4.2s1.6-1.9 1.6-4.2z" fill="#a50f15" stroke="${OUT}" stroke-width="1.4"/></g>`,
  },
  'pawn-tear': {
    shape: 'tile',
    body: () =>
      `<rect x="2.5" y="2.5" width="59" height="59" rx="10" fill="#ebecd0" stroke="${OUT}" stroke-width="3"/>
      <path d="M2.5 40H61.5V51.5a10 10 0 0 1-10 10H12.5a10 10 0 0 1-10-10z" fill="#739552"/>
      ${pawn('#2b2724')}${head('#2b2724')}
      <path d="M37.5 18.8c0 2.2-1.5 3.8-3 3.8s-3-1.6-3-3.8c0-1.9 3-5.5 3-5.5s3 3.6 3 5.5z" fill="#6fc0ff" stroke="${OUT}" stroke-width="1.5"/>`,
  },
};

// Medallions crop to their circle; tiles crop inside their border so the
// circle frame replaces it; figures keep the whole grid
const VIEWBOX: Record<PawnShape, string> = {
  medallion: '1 1 62 62',
  tile: '6 6 52 52',
  figure: '0 0 64 64',
};

export const pawnShape = (icon: PawnIcon) => ART[icon].shape;

export const pawnIconSvg = (id: string, icon: PawnIcon) => {
  const { shape, body } = ART[icon];
  return `<svg viewBox="${
    VIEWBOX[shape]
  }" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">${body(
    id,
  )}</svg>`;
};
