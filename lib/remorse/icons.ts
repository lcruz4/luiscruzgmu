import type { Trauma } from '@/types/remorse';

// Pieces are image names (color + type); medallions are the trauma markers'
// faces plus the bishop's heal
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
export const MEDALLION_ICONS = [
  'devastated',
  'guilt',
  'unaffected',
  'psychopath',
  'bloodlust',
  'heal',
] as const;

export type PieceIcon = (typeof PIECE_ICONS)[number];
export type MedallionIcon = (typeof MEDALLION_ICONS)[number];
export type PlayerIcon = PieceIcon | MedallionIcon;

export const DEFAULT_ICON: PlayerIcon = 'wp';

// Picker order
export const PLAYER_ICONS: readonly PlayerIcon[] = [
  ...MEDALLION_ICONS,
  ...PIECE_ICONS,
];

export const isPlayerIcon = (value: unknown): value is PlayerIcon =>
  PLAYER_ICONS.some((icon) => icon === value);

export const isMedallionIcon = (icon: PlayerIcon): icon is MedallionIcon =>
  MEDALLION_ICONS.some((medallion) => medallion === icon);

export const medallionTrauma = (
  icon: Exclude<MedallionIcon, 'heal'>,
): Trauma => (icon === 'bloodlust' ? 'psychopath' : icon);
