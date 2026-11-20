import { useId } from 'react';
import { type MarkerProps, markerSvg } from './markerSvg';

// The SVG is built from our own constants, never from user input
export const Marker = (props: MarkerProps & { className?: string }) => {
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <span
      className={props.className}
      dangerouslySetInnerHTML={{ __html: markerSvg(id, props) }}
    />
  );
};
