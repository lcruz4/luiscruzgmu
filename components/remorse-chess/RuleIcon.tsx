import { useId } from 'react';
import type { RuleKey } from '@/lib/remorse/tutorial';
import type { GameEvent } from '@/types/remorse';
import { healSvg } from './landingArt';
import { Marker } from './Marker';
import { type MarkerProps, medallionSvg } from './markerSvg';
import { BLOODLUST_MARKER, FATES } from './rulesContent';

const MARKERS: Partial<Record<RuleKey, MarkerProps>> = {
  ...Object.fromEntries(FATES.map(({ key, marker }) => [key, marker])),
  bloodlust: BLOODLUST_MARKER,
};

// A rule's marker, or the healing bishop for 'heal'. `medallion` drops the
// ring and drips so every rule draws at the same size (inline in text).
export const RuleIcon = ({
  rule,
  className,
  medallion = false,
}: {
  rule: RuleKey;
  className?: string;
  medallion?: boolean;
}) => {
  const id = `i${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const marker = MARKERS[rule];
  if (!marker) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: healSvg(id) }}
      />
    );
  }
  if (medallion) {
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{
          __html: medallionSvg(id, marker.trauma, rule === 'bloodlust'),
        }}
      />
    );
  }
  return <Marker {...marker} className={className} />;
};

// The rule a log line is about, if any
export const ruleMentioned = (event: GameEvent): RuleKey | null => {
  switch (event.type) {
    case 'roll':
    case 'reactivate':
      return event.trauma;
    case 'kill':
    case 'extraMove':
    case 'skipExtraMove':
      return 'psychopath';
    case 'bloodlust':
      return 'bloodlust';
    case 'heal':
      return 'heal';
    case 'death':
      return 'devastated';
    default:
      return null;
  }
};

// The words of a log line's text that name its rule
export const ruleWords = (event: GameEvent): string | null => {
  switch (event.type) {
    case 'roll':
    case 'reactivate':
      return event.trauma === 'guilt'
        ? 'guilt-ridden'
        : event.trauma === 'psychopath'
        ? 'psychopath'
        : event.trauma;
    case 'kill':
      return 'psychopath';
    case 'bloodlust':
      return 'bloodlust';
    case 'extraMove':
    case 'skipExtraMove':
      return 'extra move';
    case 'heal':
      return 'healed';
    case 'death':
      return 'died of grief';
    default:
      return null;
  }
};
