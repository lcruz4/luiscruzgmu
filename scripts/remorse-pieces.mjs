// Generates the Remorse Chess piece sets as SVGs under
// public/images/remorse. Run with `npm run remorse:pieces` after editing.
// Pieces are drawn on a 64-unit grid: body parts are filled and outlined,
// details are strokes on top.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../public/images/remorse',
);

const OUTLINE = '#120d0b';
const SIDES = {
  w: {
    gradient: ['#fffdf7', '#f1e9da', '#c9bba2'],
    detail: OUTLINE,
  },
  b: {
    gradient: ['#58606a', '#2a2e33', '#0f1113'],
    detail: '#9c7a4a',
  },
};
// amber of the guilt marker's eyes
const AMBER = '#e6c48e';
const STROKE = 2.7;

const r = (x, y, w, h, rx) => [
  'rect',
  `x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`,
];
const c = (x, y, rad) => ['circle', `cx="${x}" cy="${y}" r="${rad}"`];
const p = (d) => ['path', `d="${d}"`];
// a dark opening (a hood's face) instead of a filled part
const hole = (cx, cy, rx, ry) => [
  'ellipse',
  `cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"`,
  'hole',
];

// Short, wide and rounded
const CHUNKY = {
  p: {
    body: [
      p('M22 50C22 41 26 36.5 29 33.5h6C38 36.5 42 41 42 50Z'),
      r(24, 31, 16, 5, 2.5),
      r(15, 47, 34, 9, 4.5),
      c(32, 23.5, 9.5),
    ],
  },
  r: {
    body: [
      p('M21.5 30h21l-1.5 16H23z'),
      p(
        'M17 15h7v5h5.5v-5h5v5H40v-5h7v12.5c0 2-1.2 3.2-3.2 3.2H20.2c-2 0-3.2-1.2-3.2-3.2z',
      ),
      r(14, 45, 36, 11, 4.5),
    ],
    detail: ['M23.5 40.5h17'],
  },
  n: {
    body: [
      p(
        'M45 49C46 40 47 30 43 22 40 16 34 13 29 13L27 7.5 23.5 14C18 17 14 23 12.5 29 11.5 33 14 36 18 35L24 33C26 32.5 28 31 29.5 29.5 29 36 24 41 21 45L21 49Z',
      ),
      r(14, 46, 36, 10, 4.5),
    ],
    detail: ['M40 18C44 24 45.5 33 44.5 43', 'M16 31h.1'],
    eye: [26.5, 21],
  },
  b: {
    body: [
      p('M24 41C25 44.5 23.5 47 20 49H44C40.5 47 39 44.5 40 41Z'),
      r(23, 37, 18, 5, 2.5),
      p(
        'M32 13C24 19 20.5 25 20.5 30.5 20.5 36 25.5 39.5 32 39.5S43.5 36 43.5 30.5C43.5 25 40 19 32 13Z',
      ),
      c(32, 11.5, 3.3),
      r(15, 47, 34, 9, 4.5),
    ],
    detail: ['M36 21l-5.5 7'],
  },
  q: {
    body: [
      p('M21 45L15 22 24 31 25 17 32 28 39 17 40 31 49 22 43 45Z'),
      r(19.5, 41.5, 25, 6, 3),
      r(14, 47, 36, 9, 4.5),
      c(15, 20.5, 3.6),
      c(25, 15.5, 3.6),
      c(39, 15.5, 3.6),
      c(49, 20.5, 3.6),
    ],
  },
  k: {
    body: [
      p('M29.5 7h5v4h4.5v5h-4.5v7.5h-5V16H25v-5h4.5z'),
      p(
        'M22 45C19 38.5 15 33.5 16 28 17 22.5 25 20.5 32 26.5 39 20.5 47 22.5 48 28 49 33.5 45 38.5 42 45Z',
      ),
      r(19.5, 41.5, 25, 6, 3),
      r(14, 47, 36, 9, 4.5),
    ],
    detail: ['M32 28v12'],
  },
};

// Classical turned profiles kept stout: two-step plinth, waisted stems
const PLINTH = [r(17, 45.5, 30, 6, 3), r(13, 50, 38, 6.5, 3.2)];
const STAUNTON = {
  p: {
    body: [
      p('M27 32.5C28 38 25 42 22 46H42C39 42 36 38 37 32.5Z'),
      r(25.5, 31.5, 13, 3.5, 1.75),
      r(23, 27.5, 18, 4.5, 2.25),
      ...PLINTH,
      c(32, 19.5, 8.5),
    ],
  },
  r: {
    body: [
      p('M22 28C23.5 34 23.5 40 21.5 46H42.5C40.5 40 40.5 34 42 28Z'),
      p('M18 12H24V16.5H29V12H35V16.5H40V12H46V24.5L43 28H21L18 24.5Z'),
      r(20, 26.5, 24, 4, 2),
      ...PLINTH,
    ],
  },
  n: {
    body: [
      p(
        'M44 46C45 37 46.5 28 42.5 21 39.5 15.5 34 12.5 29 12.5L27 7 23.5 13.5C18 16.5 14 22.5 12.5 28.5 11.5 32.5 14 35.5 18 34.5L23.5 32.5C25.5 32 27.5 30.5 29 29 28.5 35 24.5 40 21 44V46Z',
      ),
      ...PLINTH,
    ],
    detail: ['M38.5 17C42 22 43.5 30 43 39', 'M15.5 30.5h.1'],
    eye: [26.5, 20],
  },
  b: {
    body: [
      p('M26.5 37.5C27.5 41 26 44 24 46H40C38 44 36.5 41 37.5 37.5Z'),
      r(22.5, 33, 19, 4.5, 2.25),
      p(
        'M32 11C25 17 23 22 23 26.5 23 31 27 33.5 32 33.5S41 31 41 26.5C41 22 39 17 32 11Z',
      ),
      c(32, 9, 2.8),
      ...PLINTH,
    ],
    detail: ['M35 18.5l-4.5 6'],
  },
  q: {
    body: [
      p('M24.5 45.5C26 39 25.5 33 23 28H41C38.5 33 38 39 39.5 45.5Z'),
      p('M20 28L17 17 23.5 22 27 14.5 32 20 37 14.5 40.5 22 47 17 44 28Z'),
      r(20.5, 26.5, 23, 4, 2),
      ...PLINTH,
      c(17, 16, 2.6),
      c(27, 13.5, 2.6),
      c(37, 13.5, 2.6),
      c(47, 16, 2.6),
      c(32, 16, 3),
    ],
  },
  k: {
    body: [
      p('M24.5 45.5C26 39 25.5 33 22.5 27H41.5C38.5 33 38 39 39.5 45.5Z'),
      p('M21 27L19 18H45L43 27Z'),
      p('M22.5 18C22.5 13.5 27 11 32 11S41.5 13.5 41.5 18Z'),
      p('M30 3h4v3.5h3.5V10H34v2h-4v-2h-3.5V6.5H30z'),
      r(20.5, 25.5, 23, 4, 2),
      ...PLINTH,
    ],
    detail: ['M32 30v12'],
  },
};

// Each piece is one smooth outline, like a river stone
const PEBBLE_BAND = 'M22.5 49.5H41.5';
const PEBBLE = {
  p: {
    body: [
      p(
        'M32 13C38 13 41.5 17.5 41.5 22.5 41.5 26 39.5 28.5 37 30 40.5 34 44 40 46 47 47 51 45 55 41 55H23C19 55 17 51 18 47 20 40 23.5 34 27 30 24.5 28.5 22.5 26 22.5 22.5 22.5 17.5 26 13 32 13Z',
      ),
    ],
    detail: [PEBBLE_BAND],
  },
  r: {
    body: [
      p(
        'M19 15C19 13.5 20 13 21.5 13H25C26 13 26.5 13.5 26.5 14.5V17H29.5V14.5C29.5 13.5 30 13 31 13H33C34 13 34.5 13.5 34.5 14.5V17H37.5V14.5C37.5 13.5 38 13 39 13H42.5C44 13 45 13.5 45 15V25C45 28 42 29 42 32 42 38 44 43 46.5 47.5 48.5 51.5 46 55 42 55H22C18 55 15.5 51.5 17.5 47.5 20 43 22 38 22 32 22 29 19 28 19 25Z',
      ),
    ],
    detail: [PEBBLE_BAND, 'M22 25H42'],
  },
  n: {
    body: [
      p(
        'M47 55H19C16 55 15 52 17 49.5 20.5 45.5 25 40 26.5 33L20 35C15.5 36 12 33 13 28.5 14.5 22 19.5 16 25 13.5L27 8 30.5 12.5C38 13 44 18 45.5 26 47 34 46 42 47.5 48 48.5 52 49 55 47 55Z',
      ),
    ],
    detail: ['M22.5 49.5H43', 'M16.5 29.5h.1'],
    eye: [27, 20.5],
  },
  b: {
    body: [
      p(
        'M32 9C37 13 42.5 20 42.5 27 42.5 32 39.5 35 36.5 36.5 38.5 40 42 43.5 45.5 47 48.5 50.5 46.5 55 42 55H22C17.5 55 15.5 50.5 18.5 47 22 43.5 25.5 40 27.5 36.5 24.5 35 21.5 32 21.5 27 21.5 20 27 13 32 9Z',
      ),
    ],
    detail: [PEBBLE_BAND, 'M36.5 19.5C35 23 33 25 30.5 26.5'],
  },
  q: {
    body: [
      p(
        'M32 10C33.8 10 35 11.2 35 13 35 14.4 34.2 15.4 33.2 15.8L37.5 24 42.5 17.5C41.8 17 41.3 16.2 41.3 15.3 41.3 13.6 42.6 12.5 44 12.5S46.8 13.6 46.8 15.3C46.8 16.8 45.8 17.8 44.5 18L42 32C42 38 44.5 43 46.5 47.5 48.5 51.5 46 55 42 55H22C18 55 15.5 51.5 17.5 47.5 19.5 43 22 38 22 32L19.5 18C18.2 17.8 17.2 16.8 17.2 15.3 17.2 13.6 18.6 12.5 20 12.5S22.7 13.6 22.7 15.3C22.7 16.2 22.2 17 21.5 17.5L26.5 24 30.8 15.8C29.8 15.4 29 14.4 29 13 29 11.2 30.2 10 32 10Z',
      ),
    ],
    detail: [PEBBLE_BAND, 'M22.5 31.5H41.5'],
  },
  k: {
    body: [
      p(
        'M30 6H34V10H38V14H34V17C39 18 44 22 44 28 44 31 42.5 33 41 34 41.5 39 44 43.5 46.5 47.5 48.5 51.5 46 55 42 55H22C18 55 15.5 51.5 17.5 47.5 20 43.5 22.5 39 23 34 21.5 33 20 31 20 28 20 22 25 18 30 17V14H26V10H30Z',
      ),
    ],
    detail: [PEBBLE_BAND, 'M23 34H41'],
  },
};

// Little grieving figures in the guilt marker's style
const ROBE = p('M20.5 52C20.5 45 24.5 38.5 32 38.5S43.5 45 43.5 52Z');
const MOURN_BASE = r(15, 49, 34, 7.5, 3.75);
const sadEyes = (y) => [`M26.8 ${y}q1.6 1.4 3.2 0`, `M34 ${y}q1.6 1.4 3.2 0`];
const MOURNERS = {
  p: {
    body: [
      ROBE,
      MOURN_BASE,
      p(
        'M32 17C25 17 22 23 22 30 22 35 25 38.5 32 38.5S42 35 42 30C42 23 39 17 32 17Z',
      ),
      hole(32, 30.5, 6.2, 6.6),
    ],
    amberEyes: ['M27.6 31q1.6 1.4 3.2 0', 'M33.2 31q1.6 1.4 3.2 0'],
  },
  r: {
    body: [
      p('M20.5 27H43.5V50H20.5Z'),
      p(
        'M17 14H24V19H29V14H35V19H40V14H47V24C47 26 45.5 27.5 43.5 27.5H20.5C18.5 27.5 17 26 17 24Z',
      ),
      MOURN_BASE,
    ],
    detail: sadEyes(35),
  },
  n: {
    body: [
      p(
        'M45 49C46 40 47 30 43 22 40 16 34 13 29 13L27 7.5 23.5 14C18 17 14 23 12.5 29 11.5 33 14 36 18 35L24 33C26 32.5 28 31 29.5 29.5 29 36 24 41 21 45L21 49Z',
      ),
      MOURN_BASE,
    ],
    // mane, droopy eye, then the bridle: cheek strap behind the eye and noseband
    detail: [
      'M40 18C44 24 45.5 33 44.5 43',
      'M24 21.5q2.2 1.8 4.4 0',
      'M35 19L26.5 31.5',
      'M17 24.5C18 28.5 22 30.8 27.9 29.4',
    ],
    ring: [27.9, 29.4],
  },
  b: {
    body: [
      ROBE,
      MOURN_BASE,
      c(32, 31, 8),
      p('M24.5 26C24.5 19 28 14 32 10 36 14 39.5 19 39.5 26Z'),
    ],
    detail: [...sadEyes(31.5), 'M32 15v6', 'M29.5 18h5'],
  },
  q: {
    body: [
      ROBE,
      MOURN_BASE,
      c(32, 29.5, 8.5),
      p('M23.5 25L22.5 15.5 27 20 32 14 37 20 41.5 15.5 40.5 25Z'),
      c(22.5, 14.5, 2),
      c(32, 12.8, 2),
      c(41.5, 14.5, 2),
    ],
    detail: sadEyes(30),
  },
  k: {
    body: [
      ROBE,
      MOURN_BASE,
      c(32, 29, 8.5),
      p('M23 25V16.5L27 19.5 32 14.5 37 19.5 41 16.5V25Z'),
      p('M30 5h4v3h3v4h-3v4h-4v-4h-3V8h3z'),
    ],
    detail: sadEyes(30),
  },
};

// Tiny monuments on a stepped plinth
const STEPS = [r(18, 44.5, 28, 5.5, 1.5), r(14, 49, 36, 7, 1.8)];
const MONUMENTS = {
  p: {
    body: [
      p('M25 45V31.5C25 28.5 27.5 26.5 32 26.5S39 28.5 39 31.5V45Z'),
      c(32, 20.5, 7),
      ...STEPS,
    ],
    detail: ['M32 32v8', 'M29 35h6'],
  },
  r: {
    body: [
      p('M21 45V22H43V45Z'),
      p('M19 14H25V18H29.5V14H34.5V18H39V14H45V23H19Z'),
      ...STEPS,
    ],
    detail: ['M21 30h22', 'M32 34v6'],
  },
  n: {
    body: [
      [
        'path',
        'd="M45 49C46 40 47 30 43 22 40 16 34 13 29 13L27 7.5 23.5 14C18 17 14 23 12.5 29 11.5 33 14 36 18 35L24 33C26 32.5 28 31 29.5 29.5 29 36 24 41 21 45L21 49Z" transform="translate(5.5 2) scale(.84)"',
      ],
      ...STEPS,
    ],
    detail: ['M39 17.5C42 22.5 43 30 42.3 38'],
    eye: [27.5, 19.5],
  },
  b: {
    body: [p('M23 45V32H41V45Z'), p('M23.5 32.5L32 8 40.5 32.5Z'), ...STEPS],
    detail: ['M35.5 16.5L28.5 27.5'],
  },
  q: {
    body: [
      p('M21 45V31H43V45Z'),
      p('M21.5 31.5L18.5 17 25 23 28 14 32 21 36 14 39 23 45.5 17 42.5 31.5Z'),
      ...STEPS,
      c(18.5, 16, 2.6),
      c(28, 13, 2.6),
      c(36, 13, 2.6),
      c(45.5, 16, 2.6),
    ],
    detail: ['M26.5 34.5v7', 'M32 34.5v7', 'M37.5 34.5v7'],
  },
  k: {
    body: [
      p('M20 45V26H44V45Z'),
      p('M20 26.5L18 15.5 25 20.5 32 12.5 39 20.5 46 15.5 44 26.5Z'),
      p('M30 3.5h4v3h3v4h-3v3h-4v-3h-3v-4h3z'),
      ...STEPS,
    ],
    detail: ['M29.5 42V35.5a2.5 2.5 0 0 1 5 0V42'],
  },
};

// Keep ids in sync with PIECE_SETS in lib/remorse/pieceSets.ts
const SETS = {
  mourners: {
    shapes: MOURNERS,
    fit: 'translate(32 33) scale(1.04) translate(-32 -33)',
  },
  chunky: {
    shapes: CHUNKY,
    fit: 'translate(32 33) scale(1.06) translate(-32 -33)',
  },
  staunton: {
    shapes: STAUNTON,
    fit: 'translate(32 32) scale(1.02) translate(-32 -32)',
  },
  monuments: {
    shapes: MONUMENTS,
    fit: 'translate(32 32) scale(1.04) translate(-32 -32)',
  },
  pebble: {
    shapes: PEBBLE,
    fit: 'translate(32 33) scale(1.04) translate(-32 -33)',
  },
};

const pieceSvg = (shape, fit, side) => {
  const { gradient, detail } = SIDES[side];
  const paint = `fill="url(#g)" stroke="${OUTLINE}" stroke-width="${STROKE}" stroke-linejoin="round"`;
  let body = shape.body
    .map(([tag, attrs, kind]) =>
      kind === 'hole'
        ? `<${tag} ${attrs} fill="#140d08" stroke="${OUTLINE}" stroke-width="${
            STROKE * 0.7
          }"/>`
        : `<${tag} ${attrs} ${paint}/>`,
    )
    .join('');
  for (const d of shape.amberEyes ?? []) {
    body += `<path d="${d}" stroke="${AMBER}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  for (const d of shape.detail ?? []) {
    body += `<path d="${d}" stroke="${detail}" stroke-width="2.16" fill="none" stroke-linecap="round"/>`;
  }
  if (shape.ring) {
    body += `<circle cx="${shape.ring[0]}" cy="${shape.ring[1]}" r="1.7" fill="${AMBER}" stroke="${OUTLINE}" stroke-width="1"/>`;
  }
  if (shape.eye) {
    body += `<circle cx="${shape.eye[0]}" cy="${shape.eye[1]}" r="2" fill="${detail}"/>`;
  }
  const [light, mid, dark] = gradient;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><radialGradient id="g" cx="36%" cy="24%" r="85%"><stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient></defs><g transform="${fit}">${body}</g></svg>\n`;
};

const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

for (const [id, { shapes, fit }] of Object.entries(SETS)) {
  for (const side of ['w', 'b']) {
    for (const [type, shape] of Object.entries(shapes)) {
      write(
        join(OUT_DIR, 'pieces', id, `${side}${type}.svg`),
        pieceSvg(shape, fit, side),
      );
    }
  }
}
console.log(`Wrote ${Object.keys(SETS).length} piece sets to ${OUT_DIR}`);
