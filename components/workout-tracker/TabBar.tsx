import { Clock, Dumbbell, List } from 'lucide-react';
import { TabBar as MistTabBar } from '@/components/mist/TabBar';

const HOME = '/projects/workout-tracker';

const TABS = [
  { href: HOME, label: 'Log', Icon: Dumbbell },
  { href: `${HOME}/history`, label: 'History', Icon: Clock },
  { href: `${HOME}/plan`, label: 'Plan', Icon: List },
];

export const TabBar = () => (
  <MistTabBar label='Workout tracker' tabs={TABS} home={HOME} />
);
