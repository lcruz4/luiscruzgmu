import type { Trauma } from '@/types/remorse';

// Pieces are image names (color + type); the rest are trauma markers
export const PIECE_ICONS = [
  'wk',
  'wq',
  'wr',
  'wb',
  'wn',
  'wp',
  'bk',
  'bq',
  'br',
  'bb',
  'bn',
  'bp',
] as const;
export const MARKER_ICONS = [
  'devastated',
  'guilt',
  'unaffected',
  'psychopath',
  'bloodlust',
] as const;

export type PieceIcon = (typeof PIECE_ICONS)[number];
export type MarkerIcon = (typeof MARKER_ICONS)[number];
export type PlayerIcon = PieceIcon | MarkerIcon;

export const DEFAULT_ICON: PlayerIcon = 'wp';

const ICONS: readonly string[] = [...PIECE_ICONS, ...MARKER_ICONS];

export const isPlayerIcon = (value: unknown): value is PlayerIcon =>
  typeof value === 'string' && ICONS.includes(value);

export const isMarkerIcon = (icon: PlayerIcon): icon is MarkerIcon =>
  MARKER_ICONS.some((marker) => marker === icon);

export const markerTrauma = (icon: MarkerIcon): Trauma =>
  icon === 'bloodlust' ? 'psychopath' : icon;
