import { useId } from 'react';
import type { RuleKey } from '@/lib/remorse/tutorial';
import type { GameEvent } from '@/types/remorse';
import { healSvg } from './landingArt';
import { Marker } from './Marker';
import type { MarkerProps } from './markerSvg';
import { BLOODLUST_MARKER, FATES } from './rulesContent';

const MARKERS: Partial<Record<RuleKey, MarkerProps>> = {
  ...Object.fromEntries(FATES.map(({ key, marker }) => [key, marker])),
  bloodlust: BLOODLUST_MARKER,
};

// A rule's marker, or the healing bishop for 'heal'
export const RuleIcon = ({
  rule,
  className,
}: {
  rule: RuleKey;
  className?: string;
}) => {
  const id = `i${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const marker = MARKERS[rule];
  return marker ? (
    <Marker {...marker} className={className} />
  ) : (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: healSvg(id) }}
    />
  );
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
