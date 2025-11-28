import { Dispatch, SetStateAction } from 'react';

interface TabsProps {
  activeTab: 'games' | 'analysis';
  setActiveTab: Dispatch<SetStateAction<'games' | 'analysis'>>;
}

export const Tabs = ({ activeTab, setActiveTab }: TabsProps) => {
  return (
    <div className='flex mb-4 border-b border-gray-600'>
      <button
        className={`px-4 py-2 font-semibold transition-colors ${
          activeTab === 'games'
            ? 'text-white border-b-2 border-blue-400'
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => setActiveTab('games')}
      >
        Games
      </button>
      <button
        className={`px-4 py-2 font-semibold transition-colors ${
          activeTab === 'analysis'
            ? 'text-white border-b-2 border-blue-400'
            : 'text-gray-400 hover:text-white'
        }`}
        onClick={() => setActiveTab('analysis')}
      >
        Analysis
      </button>
    </div>
  );
};
