// Landing page illustrations, drawn in the marker style (dark outline,
// radial medallion, top-left gloss). SVG strings from our own constants.

const OUT = '#120d0b';

const BISHOP = `
  <path d="M25 49c1.5-5 2.2-9 2-13h10c-.2 4 .5 8 2 13z" fill="#f4efe4" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
  <rect x="23" y="33" width="18" height="4.5" rx="2.2" fill="#f4efe4" stroke="${OUT}" stroke-width="2.6"/>
  <path d="M32 11c-5.5 4.5-8 9.5-8 13.5 0 4.5 3.5 8.5 8 8.5s8-4 8-8.5c0-4-2.5-9-8-13.5z" fill="#f4efe4" stroke="${OUT}" stroke-width="2.6"/>
  <circle cx="32" cy="9.5" r="2.6" fill="#f4efe4" stroke="${OUT}" stroke-width="2.2"/>
  <path d="M34.5 18l-4.5 6" stroke="${OUT}" stroke-width="2.2" stroke-linecap="round"/>
  <rect x="17" y="48" width="30" height="7.5" rx="3" fill="#f4efe4" stroke="${OUT}" stroke-width="2.6"/>`;

// Bishop on a green medallion with a medical cross: the healer
export const healSvg = (id: string) => `
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" aria-hidden="true">
    <defs>
      <radialGradient id="${id}-g" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#b9f0c4"/><stop offset=".55" stop-color="#3f9a5a"/><stop offset="1" stop-color="#12391d"/></radialGradient>
      <clipPath id="${id}-c"><circle cx="32" cy="32" r="28"/></clipPath>
    </defs>
    <circle cx="32" cy="32" r="29.5" fill="url(#${id}-g)" stroke="${OUT}" stroke-width="3"/>
    <path d="M11 25 A22 22 0 0 1 42 9.5" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <g clip-path="url(#${id}-c)"><g transform="translate(32 34) scale(.82) translate(-32 -32)">${BISHOP}</g></g>
    <path d="M47 13h4v4h4v4h-4v4h-4v-4h-4v-4h4z" fill="#fff" stroke="${OUT}" stroke-width="1.8" stroke-linejoin="round"/>
  </svg>`;

// Hooded guilt medallion drawn to stand in for the wordmark's "o"
export const hoodMedalSvg = (id: string) => `
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow:visible" aria-hidden="true">
    <defs>
      <radialGradient id="${id}-g" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#ffd27a"/><stop offset=".55" stop-color="#c98a1c"/><stop offset="1" stop-color="#5e3a06"/></radialGradient>
      <clipPath id="${id}-c"><circle cx="32" cy="32" r="26"/></clipPath>
    </defs>
    <circle cx="32" cy="33.5" r="29" fill="${OUT}"/>
    <circle cx="32" cy="32" r="28" fill="url(#${id}-g)" stroke="${OUT}" stroke-width="6"/>
    <g clip-path="url(#${id}-c)">
      <path d="M32 10c-12 0-18 11-18 24v30h36V34c0-13-6-24-18-24z" fill="#4b3322" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="32" cy="38" rx="10" ry="12" fill="#140d08"/>
      <path d="M26 39.5q2.2 2 4.4 0M33.6 39.5q2.2 2 4.4 0" stroke="#e6c48e" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </g>
    <path d="M12 26A21 21 0 0 1 36 11" stroke="#fff" stroke-opacity=".4" stroke-width="3.5" stroke-linecap="round" fill="none"/>
  </svg>`;
