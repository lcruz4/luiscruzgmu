// Board square colors. The board image is built here as an SVG data URL.
export const BOARD_THEMES = [
  {
    id: 'reliquary',
    name: 'Reliquary',
    light: '#d9c39a',
    dark: '#6e4c34',
    stone: false,
  },
  {
    id: 'tavern',
    name: 'Tavern',
    light: '#ecd6a8',
    dark: '#b07b4c',
    stone: false,
  },
  {
    id: 'slate',
    name: 'Slate',
    light: '#d3d9dc',
    dark: '#71858f',
    stone: false,
  },
  {
    id: 'bloodwood',
    name: 'Bloodwood',
    light: '#dcc7b4',
    dark: '#7a2f2c',
    stone: false,
  },
  {
    id: 'dungeon',
    name: 'Dungeon',
    light: '#a39a8b',
    dark: '#5f574d',
    stone: true,
  },
] as const;

export type BoardThemeId = (typeof BOARD_THEMES)[number]['id'];
export type BoardTheme = (typeof BOARD_THEMES)[number];

export const DEFAULT_BOARD_THEME: BoardThemeId = 'reliquary';

export const isBoardTheme = (id: unknown): id is BoardThemeId =>
  BOARD_THEMES.some((theme) => theme.id === id);

export const boardTheme = (id: BoardThemeId): BoardTheme =>
  BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0];

// fixed per-square noise so stone tiles don't shift between renders
const noise = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const boardSvg = ({ light, dark, stone }: BoardTheme) => {
  let squares = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const isDark = (row + col) % 2 === 1;
      if (isDark) {
        squares += `<rect x="${col}" y="${row}" width="1" height="1" fill="${dark}"/>`;
      }
      if (stone) {
        const tone = (noise(row * 8 + col + 1) - 0.5) * 0.16;
        squares += `<rect x="${col}" y="${row}" width="1" height="1" fill="${
          tone > 0 ? '#fff' : '#000'
        }" opacity="${Math.abs(tone).toFixed(3)}"/>`;
        squares += `<rect x="${col + 0.03}" y="${
          row + 0.03
        }" width=".94" height=".94" rx=".08" fill="none" stroke="#000" stroke-opacity=".28" stroke-width=".04"/>`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"${
    stone ? '' : ' shape-rendering="crispEdges"'
  }><rect width="8" height="8" fill="${light}"/>${squares}</svg>`;
};

const cache = new Map<BoardThemeId, string>();

export const boardSrc = (id: BoardThemeId) => {
  let src = cache.get(id);
  if (!src) {
    src = `data:image/svg+xml,${encodeURIComponent(boardSvg(boardTheme(id)))}`;
    cache.set(id, src);
  }
  return src;
};
