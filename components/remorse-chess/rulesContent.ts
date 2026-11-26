import type { Trauma } from '@/types/remorse';
import type { MarkerProps } from './markerSvg';

// Rule text shared by the landing page and the in-game rules dialog

export const FATES: {
  key: Trauma;
  marker: MarkerProps;
  roll: number[];
  name: string;
  text: string;
}[] = [
  {
    key: 'devastated',
    marker: { trauma: 'devastated', healed: false, turnsLeft: 3, kills: 0 },
    roll: [1],
    name: 'Devastated',
    text: "Heartbroken. Can't capture, give check or guard a square. It dies of grief after 3 of its own turns unless a bishop heals it.",
  },
  {
    key: 'guilt',
    marker: { trauma: 'guilt', healed: false, turnsLeft: 0, kills: 0 },
    roll: [2, 3],
    name: 'Guilt-ridden',
    text: "Still moves, but won't hurt anyone again. Can't capture, give check or guard a square until it's healed.",
  },
  {
    key: 'unaffected',
    marker: { trauma: 'unaffected', healed: false, turnsLeft: 0, kills: 0 },
    roll: [4, 5],
    name: 'Unaffected',
    text: 'Feels nothing. Plays like a normal piece for the rest of the game.',
  },
  {
    key: 'psychopath',
    marker: { trauma: 'psychopath', healed: false, turnsLeft: 0, kills: 0 },
    roll: [6],
    name: 'Psychopath',
    text: 'Every capture it makes earns an optional extra move with that piece. At 3 captures it falls into bloodlust.',
  },
];

export const HEAL_ITEMS = [
  'A bishop that moves next to guilt-ridden or devastated pieces of its own color heals them.',
  'A bishop can spend its turn healing itself and the hurt pieces next to it.',
  'A healed piece plays normally. If it captures again, its trauma comes back.',
];

export const BLOODLUST_ITEMS = [
  'After 3 captures a psychopath can only move to capture.',
  'It will take pieces of either color, its own king included.',
  "Taking a king ends the game, whoever's it is.",
];

export const BLOODLUST_MARKER: MarkerProps = {
  trauma: 'psychopath',
  healed: false,
  turnsLeft: 0,
  kills: 3,
};
