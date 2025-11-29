import React from 'react';

interface AddStickerFormProps {
  newSticker: string;
  setNewSticker: (sticker: string) => void;
  onAddSticker: () => void;
  onRandomEmoji: () => void;
  isLoading: boolean;
}

const AddStickerForm: React.FC<AddStickerFormProps> = ({
  newSticker,
  setNewSticker,
  onAddSticker,
  onRandomEmoji,
  isLoading,
}) => {
  // Function to check if a character is an emoji
  const isEmoji = (char: string) => {
    // Unicode ranges for emojis
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{1F300}-\u{1F320}]|[\u{1F32D}-\u{1F335}]|[\u{1F337}-\u{1F37C}]|[\u{1F37E}-\u{1F393}]|[\u{1F3A0}-\u{1F3CA}]|[\u{1F3CF}-\u{1F3D3}]|[\u{1F3E0}-\u{1F3F0}]|[\u{1F3F4}]|[\u{1F3F8}-\u{1F43E}]|[\u{1F440}]|[\u{1F442}-\u{1F4FC}]|[\u{1F4FF}-\u{1F53D}]|[\u{1F54B}-\u{1F54E}]|[\u{1F550}-\u{1F567}]|[\u{1F57A}]|[\u{1F595}]|[\u{1F596}]|[\u{1F5A4}]|[\u{1F5FB}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F6CC}]|[\u{1F6D0}-\u{1F6D2}]|[\u{1F6D5}]|[\u{1F6EB}]|[\u{1F6EC}]|[\u{1F6F4}-\u{1F6FA}]|[\u{1F7E0}-\u{1F7EB}]|[\u{1F90C}-\u{1F93A}]|[\u{1F93C}-\u{1F945}]|[\u{1F947}-\u{1F978}]|[\u{1F97A}-\u{1F9CB}]|[\u{1F9CD}-\u{1F9FF}]|[\u{1FA70}-\u{1FA74}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA86}]|[\u{1FA90}-\u{1FAC2}]|[\u{1FAD0}-\u{1FAD6}]/u;
    return emojiRegex.test(char);
  };

  // Function to filter input to only allow emojis
  const filterEmojisOnly = (input: string) => {
    return Array.from(input).filter(char => isEmoji(char)).join('').slice(0, 3); // Limit to 3 emojis
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filteredValue = filterEmojisOnly(e.target.value);
    setNewSticker(filteredValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAddSticker();
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-200 to-pink-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 sm:border-4 border-orange-400">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-2 text-orange-700">
        🎨 Add a New Sticker! 🎨
      </h3>
      <p className="text-center text-orange-600 mb-3 sm:mb-4 text-xs sm:text-sm">
        💡 Tip: Only emojis allowed! Max 3 emojis per sticker. Click stickers above to remove them!
      </p>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={newSticker}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="⭐ 🎉 🌈 🦄"
            className="flex-1 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 text-lg sm:text-xl md:text-2xl border-2 sm:border-4 border-purple-300 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-purple-400 focus:border-purple-500 outline-none bg-white shadow-lg transition-all"
            disabled={isLoading}
            title="Only emojis are allowed (max 3)"
          />
          <button
            onClick={onRandomEmoji}
            disabled={isLoading}
            className="px-3 sm:px-4 py-2.5 sm:py-3 md:py-4 text-lg sm:text-xl md:text-2xl bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl sm:rounded-2xl hover:from-yellow-500 hover:to-orange-500 transform hover:scale-105 active:scale-95 transition-all duration-300 shadow-lg disabled:opacity-50"
            title="Get random emoji!"
          >
            🎲
          </button>
        </div>
        <button
          onClick={onAddSticker}
          disabled={isLoading || !newSticker.trim()}
          className={`w-full px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-base sm:text-lg md:text-xl font-bold rounded-xl sm:rounded-2xl transform transition-all duration-300 shadow-lg ${
            isLoading || !newSticker.trim()
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-400 to-blue-500 text-white hover:from-green-500 hover:to-blue-600 hover:scale-105 active:scale-95'
          }`}
        >
          {isLoading ? (
            <span className="animate__animated animate__pulse animate__infinite">
              🔄 Adding...
            </span>
          ) : (
            <span>🎯 Add Sticker!</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddStickerForm;