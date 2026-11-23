import type { GameEvent, Trauma } from '@/types/remorse';

// 'intro' is the rules dialog on a first game; the rest are one-time callouts,
// each also a slide in that dialog
export const TUTORIAL_KEYS = [
  'intro',
  'devastated',
  'guilt',
  'unaffected',
  'psychopath',
  'heal',
  'bloodlust',
] as const;

export type TutorialKey = (typeof TUTORIAL_KEYS)[number];
export type RuleKey = Trauma | 'heal' | 'bloodlust';

export const isTutorialKey = (value: unknown): value is TutorialKey =>
  TUTORIAL_KEYS.some((key) => key === value);

// The rule an event is the first sighting of, if any
export const ruleOf = (event: GameEvent): RuleKey | null => {
  switch (event.type) {
    case 'roll':
      return event.trauma;
    case 'heal':
      return 'heal';
    case 'bloodlust':
      return 'bloodlust';
    default:
      return null;
  }
};
