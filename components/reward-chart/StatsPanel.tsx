import React from 'react';

interface StatsPanelProps {
  stickerCount: number;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stickerCount }) => {
  return (
    <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="bg-gradient-to-r from-red-200 to-pink-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border-2 sm:border-3 border-red-300">
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-red-700">📊 Total Stickers</div>
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-800">{stickerCount}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-200 to-cyan-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border-2 sm:border-3 border-blue-300">
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-blue-700">🎯 Goal</div>
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800">50 Stickers!</div>
      </div>
      <div className="bg-gradient-to-r from-green-200 to-lime-200 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center border-2 sm:border-3 border-green-300">
        <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-green-700">🏆 Progress</div>
        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800">
          {Math.round((stickerCount / 50) * 100)}%
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;