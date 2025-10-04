import React, { useState, useCallback } from 'react';
import { UserCharacter, ActiveChat } from '../types';
import CharacterCreation from './CharacterCreation';
import { ArrowLeftIcon, PlusIcon, Trash2Icon, UserIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface CharacterSelectorProps {
  characters: UserCharacter[];
  onSaveCharacters: (characters: UserCharacter[]) => void;
  onCharacterSelected: (character: UserCharacter) => void;
  onBack: () => void;
  activeChats: ActiveChat[];
  showAlert: (title: string, message: string) => void;
}

const CharacterCard: React.FC<{ char: UserCharacter, onSelect: () => void, onDelete: () => void }> = ({ char, onSelect, onDelete }) => (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col group relative overflow-hidden transform transition-transform hover:-translate-y-1 hover:scale-[1.02]">
        {char.portrait ? (
            <img src={char.portrait} alt={char.name} className="w-full h-48 object-cover" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        ) : (
            <div className="w-full h-48 bg-black flex items-center justify-center">
                <UserIcon className="w-20 h-20 text-zinc-700" />
            </div>
        )}
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-cyan-400">{char.name}</h3>
            <p className="text-slate-400 mt-2 text-sm text-ellipsis flex-grow line-clamp-3">
                {char.description || <em>No description provided.</em>}
            </p>
            <button 
                onClick={onSelect}
                className="mt-4 w-full text-center font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md py-2 transition-colors transform active:scale-95">
                Select
            </button>
        </div>
         <button 
            onClick={onDelete}
            title="Delete character"
            className="absolute top-2 right-2 p-1.5 text-slate-200 bg-black/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-zinc-900/80">
            <Trash2Icon className="w-4 h-4" />
        </button>
    </div>
);

const CharacterSelector: React.FC<CharacterSelectorProps> = ({ characters, onSaveCharacters, onCharacterSelected, onBack, activeChats, showAlert }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);

  const handleSaveNewCharacter = (newCharacter: UserCharacter) => {
    if (characters.some(c => c.name.toLowerCase() === newCharacter.name.toLowerCase())) {
        showAlert("Name Conflict", "A character with this name already exists.");
        return;
    }
    const updatedCharacters = [...characters, newCharacter];
    onSaveCharacters(updatedCharacters);
    setIsCreating(false);
  };

  const handleDeleteCharacter = useCallback((characterIdToDelete: string) => {
    const characterToDelete = characters.find(c => c.id === characterIdToDelete);
    if (!characterToDelete) return;
    
    const isCharacterInUse = activeChats.some(chat => chat.userCharacter.id === characterIdToDelete);

    if (isCharacterInUse) {
      showAlert("Cannot Delete Character", "This character is being used in an active chat. Please delete the chat before deleting this character.");
      return;
    }
    
    setConfirmation({
        title: "Delete Character",
        message: `Are you sure you want to delete ${characterToDelete.name}?`,
        onConfirm: () => {
             const updatedCharacters = characters.filter(c => c.id !== characterIdToDelete);
             onSaveCharacters(updatedCharacters);
             setConfirmation(null);
        }
    });
  }, [characters, onSaveCharacters, activeChats, showAlert]);

  return (
    <>
      {confirmation && (
        <ConfirmationModal
          isOpen={!!confirmation}
          title={confirmation.title}
          message={confirmation.message}
          onConfirm={confirmation.onConfirm}
          onClose={() => setConfirmation(null)}
        />
      )}
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold text-center">Select Your Character</h2>
            <button onClick={onBack} className="flex-shrink-0 flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Scenario Details
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <CharacterCard
                key={char.id}
                char={char}
                onSelect={() => onCharacterSelected(char)}
                onDelete={() => handleDeleteCharacter(char.id)}
            />
          ))}
          <div
              className="bg-transparent rounded-lg p-6 border-2 border-dashed border-zinc-800 hover:border-sky-500 hover:bg-zinc-950 transition-all duration-300 flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]"
              onClick={() => setIsCreating(true)}
            >
              <PlusIcon className="w-10 h-10 mb-2 text-zinc-700" />
              <h3 className="text-xl font-bold text-slate-400">Create New Character</h3>
            </div>
        </div>
      </div>
      {isCreating && (
        <CharacterCreation 
          onClose={() => setIsCreating(false)}
          onSave={handleSaveNewCharacter}
        />
      )}
    </>
  );
};

export default CharacterSelector;