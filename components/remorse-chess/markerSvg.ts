import type { Trauma } from '@/types/remorse';

// Game-style status markers, drawn on a 64×64 grid (viewBox padded for the
// bloodlust drips). Built as an SVG string; ids are prefixed per instance so
// gradients don't collide.

const OUT = '#120d0b';

const arc = (r: number, a0: number, a1: number) => {
  const point = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return [32 + r * Math.cos(rad), 32 + r * Math.sin(rad)].map((n) =>
      n.toFixed(2),
    );
  };
  const [x0, y0] = point(a0);
  const [x1, y1] = point(a1);
  return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`;
};

// Three-segment ring: psychopath kills filling up, devastated turns draining
const meter = (lit: number, on: string, glow: string) => {
  let svg = '';
  for (let i = 0; i < 3; i++) {
    const d = arc(27.5, i * 120 + 9, (i + 1) * 120 - 9);
    const isOn = i < lit;
    svg += `<path d="${d}" stroke="${OUT}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
    svg += `<path d="${d}" stroke="${
      isOn ? on : '#6b625b'
    }" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    if (isOn) {
      svg += `<path d="${d}" stroke="${glow}" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".8" transform="translate(-.6 -.8)"/>`;
    }
  }
  return svg;
};

const medallion = (id: string, light: string, base: string, dark: string) => `
  <defs><radialGradient id="${id}" cx="38%" cy="30%" r="75%">
    <stop offset="0" stop-color="${light}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/>
  </radialGradient></defs>
  <circle cx="32" cy="32" r="21" fill="url(#${id})" stroke="${OUT}" stroke-width="3"/>
  <path d="M16.5 27 A16 16 0 0 1 43 17.5" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;

const BROKEN_HEART = `
  <path d="M32 46.5C20 38.5 16.5 31 19 25.5c2.2-4.8 8.6-5.6 12.2-.9l.8 1 .8-1c3.6-4.7 10-3.9 12.2.9 2.5 5.5-1 13-13 21z" fill="#d7ecff" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M32.2 25.2 29 30.6l4.6 3.6-3.8 5.4 2.2 6.6" stroke="${OUT}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>
  <path d="M22.5 27.5c.5-2 2.2-3.2 4.2-3" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M44.5 37.5c0 2.6-1.9 4.5-3.6 4.5s-3.6-1.9-3.6-4.5c0-2.3 3.6-6.5 3.6-6.5s3.6 4.2 3.6 6.5z" fill="#6fc0ff" stroke="${OUT}" stroke-width="1.8"/>`;

const HOOD = `
  <path d="M32 13.5c-9.5 0-14.5 9-14.5 19.5V50h29V33c0-10.5-5-19.5-14.5-19.5z" fill="#4b3322" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M24 22c2-4 4.6-6 8-6.4" stroke="#7a5a40" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="32" cy="35" rx="8" ry="9.5" fill="#140d08"/>
  <path d="M27 36.5q1.8 1.6 3.6 0M33.4 36.5q1.8 1.6 3.6 0" stroke="#e6c48e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M32 13.5v6" stroke="${OUT}" stroke-width="1.4" opacity=".5"/>
  <path d="M24 50l2-6M40 50l-2-6" stroke="${OUT}" stroke-width="1.4" opacity=".5"/>`;

const STONE_MASK = `
  <path d="M20.5 21.5c7.5-5 15.5-5 23 0l-1.4 13c-1 6.5-5.4 11-10.1 11s-9.1-4.5-10.1-11z" fill="#e8e3d6" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>
  <path d="M22.5 24c3-1.8 6-2.6 9-2.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <rect x="24.5" y="28" width="5.5" height="2.4" rx="1" fill="${OUT}"/>
  <rect x="34" y="28" width="5.5" height="2.4" rx="1" fill="${OUT}"/>
  <path d="M27.5 38.5h9" stroke="${OUT}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M32 31.5v4" stroke="#b5ad9b" stroke-width="1.6" stroke-linecap="round"/>`;

const grin = (bloodlust: boolean) => {
  const eye = bloodlust ? '#ff2b2b' : OUT;
  return `
  <path d="M19.5 26c0-7 5.8-11.5 12.5-11.5S44.5 19 44.5 26c0 9.5-5.5 17-12.5 17s-12.5-7.5-12.5-17z" fill="#f1ece2" stroke="${OUT}" stroke-width="2.4"/>
  <path d="M23 21.5c2-3 5-4.4 8-4.6" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M23 25.5l7 2.6-1 2.6c-3 .2-5.4-1.6-6-5.2z" fill="${eye}" stroke="${OUT}" stroke-width="1.2"/>
  <path d="M41 25.5l-7 2.6 1 2.6c3 .2 5.4-1.6 6-5.2z" fill="${eye}" stroke="${OUT}" stroke-width="1.2"/>
  <path d="M22.5 33.5c3 4.6 6 6.2 9.5 6.2s6.5-1.6 9.5-6.2c-3 1.4-6 2-9.5 2s-6.5-.6-9.5-2z" fill="${OUT}"/>
  <path d="M25.5 35.2v2M28.5 35.8v2.8M32 36v3M35.5 35.8v2.8M38.5 35.2v2" stroke="#f1ece2" stroke-width="1.4"/>
  ${
    bloodlust
      ? `<circle cx="27" cy="28" r=".9" fill="#fff"/><circle cx="37" cy="28" r=".9" fill="#fff"/>
         <path d="M36 17.5c2.5.5 3 2.5 2 4M38.5 16.5c1 .5 1.5 1 1.5 2" stroke="#b3121a" stroke-width="2" fill="none" stroke-linecap="round"/>
         <circle cx="25" cy="38.5" r="1.3" fill="#b3121a"/><circle cx="40.5" cy="21" r="1" fill="#b3121a"/>`
      : ''
  }`;
};

const DRIPS = `
  <path d="M24 50.5c0 3 .8 6 2 6s2-3 2-6z" fill="#a50f15" stroke="${OUT}" stroke-width="1.6"/>
  <path d="M31 52.5c0 4 1 8.5 2.3 8.5s2.2-4.5 2.2-8.5z" fill="#a50f15" stroke="${OUT}" stroke-width="1.6"/>
  <path d="M39 50c0 2.5.7 4.6 1.6 4.6s1.6-2.1 1.6-4.6z" fill="#a50f15" stroke="${OUT}" stroke-width="1.6"/>`;

const BANDAGE = `
  <g transform="translate(47 47) rotate(-40)">
    <rect x="-13" y="-5" width="26" height="10" rx="5" fill="#efd2a8" stroke="${OUT}" stroke-width="2.4"/>
    <rect x="-4.5" y="-4" width="9" height="8" fill="#f9ead2"/>
    <circle cx="-9" cy="-1.5" r=".9" fill="#b8915f"/><circle cx="-7" cy="1.8" r=".9" fill="#b8915f"/>
    <circle cx="9" cy="-1.5" r=".9" fill="#b8915f"/><circle cx="7" cy="1.8" r=".9" fill="#b8915f"/>
  </g>`;

export interface MarkerProps {
  trauma: Trauma;
  healed: boolean;
  turnsLeft: number;
  kills: number;
}

// The medallion and its face, without the ring or drips around it
const face = (id: string, trauma: Trauma, bloodlust: boolean) => {
  const gradient = `${id}-g`;
  if (trauma === 'devastated') {
    return medallion(gradient, '#7fb8ff', '#2c63c9', '#13265e') + BROKEN_HEART;
  }
  if (trauma === 'guilt') {
    return (
      `<defs><clipPath id="${id}-c"><circle cx="32" cy="32" r="19.6"/></clipPath></defs>` +
      medallion(gradient, '#ffd27a', '#c98a1c', '#5e3a06') +
      `<g clip-path="url(#${id}-c)">${HOOD}</g>`
    );
  }
  if (trauma === 'unaffected') {
    return medallion(gradient, '#b8c4cf', '#64717e', '#2b333b') + STONE_MASK;
  }
  return bloodlust
    ? medallion(gradient, '#c0262b', '#6d0b10', '#260306') + grin(true)
    : medallion(gradient, '#ff8a80', '#c62828', '#5a0d0d') + grin(false);
};

// Just the medallion, cropped so it fills its box (player icons)
export const medallionSvg = (id: string, trauma: Trauma, bloodlust: boolean) =>
  `<svg viewBox="9.5 9.5 45 45" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">${face(
    id,
    trauma,
    bloodlust,
  )}</svg>`;

export const markerSvg = (
  id: string,
  { trauma, healed, turnsLeft, kills }: MarkerProps,
) => {
  const bloodlust = trauma === 'psychopath' && kills >= 3;
  let body = face(id, trauma, bloodlust);
  if (trauma === 'devastated') {
    body =
      meter(turnsLeft, turnsLeft === 1 ? '#ff5a4e' : '#5fb2ff', '#d8eeff') +
      body;
  } else if (bloodlust) {
    body = meter(3, '#ff2b2b', '#ffc2c2') + DRIPS + body;
  } else if (trauma === 'psychopath') {
    body = meter(kills, '#e5383b', '#ffc9c9') + body;
  }
  if (healed) {
    body = `<defs><filter id="${id}-d"><feColorMatrix type="saturate" values="0.05"/>
      <feComponentTransfer><feFuncR type="linear" slope=".7" intercept=".12"/><feFuncG type="linear" slope=".7" intercept=".12"/><feFuncB type="linear" slope=".7" intercept=".12"/></feComponentTransfer></filter></defs>
      <g filter="url(#${id}-d)" opacity=".85">${body}</g>
      <circle cx="32" cy="32" r="25" fill="none" stroke="#e8e2d6" stroke-width="1.6" stroke-dasharray="4 3.2" opacity=".9"/>${BANDAGE}`;
  }
  return `<svg viewBox="0 -2 64 68" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow:visible">${body}</svg>`;
};

export const traumaLabel = ({
  trauma,
  healed,
  turnsLeft,
  kills,
}: MarkerProps) => {
  const base =
    trauma === 'devastated'
      ? `Devastated, ${turnsLeft} turn${turnsLeft === 1 ? '' : 's'} left`
      : trauma === 'guilt'
      ? 'Guilt-ridden'
      : trauma === 'unaffected'
      ? 'Unaffected'
      : kills >= 3
      ? 'Psychopath, bloodlust'
      : `Psychopath, ${kills}/3`;
  return healed ? `${base} (healed)` : base;
};
