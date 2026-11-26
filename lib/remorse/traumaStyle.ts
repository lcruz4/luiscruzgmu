import type { Trauma } from '@/types/remorse';

// How each trauma is named and colored across the UI. label: short, for
// tight spots; name: in full. color is the main swatch; dark and light shade
// it (vials, highlights).
export const TRAUMA_STYLE: Record<
  Trauma,
  { label: string; name: string; color: string; dark: string; light: string }
> = {
  devastated: {
    label: 'Devastated',
    name: 'Devastated',
    color: '#2c63c9',
    dark: '#163773',
    light: '#7da6ee',
  },
  guilt: {
    label: 'Guilt',
    name: 'Guilt-ridden',
    color: '#c98a1c',
    dark: '#74490a',
    light: '#ffd27a',
  },
  unaffected: {
    label: 'Unaffected',
    name: 'Unaffected',
    color: '#64717e',
    dark: '#323a43',
    light: '#a3aeb9',
  },
  psychopath: {
    label: 'Psychopath',
    name: 'Psychopath',
    color: '#c62828',
    dark: '#6a0f0f',
    light: '#ef7070',
  },
};
