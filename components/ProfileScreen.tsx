

import React, { useState, useEffect } from 'react';
import { UserCharacter } from '../types';
import CharacterCreation from './CharacterCreation';
import { PlusIcon, Trash2Icon, UserIcon } from './icons';
import { USER_CHARACTERS_KEY } from '../constants/storageKeys';

const ProfileScreen: React.FC = () => {
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const savedCharacters = localStorage.getItem(USER_CHARACTERS_KEY);
    if (savedCharacters) {
      setCharacters(JSON.parse(savedCharacters));
    }
  }, []);

  const saveCharacters = (updatedCharacters: UserCharacter[]) => {
    setCharacters(updatedCharacters);
    localStorage.setItem(USER_CHARACTERS_KEY, JSON.stringify(updatedCharacters));
  };
  
  const handleSaveNewCharacter = (newCharacter: UserCharacter) => {
    // Check for duplicate names
    if (characters.some(c => c.name.toLowerCase() === newCharacter.name.toLowerCase())) {
        alert("A character with this name already exists.");
        return;
    }
    const updatedCharacters = [...characters, newCharacter];
    saveCharacters(updatedCharacters);
    setIsCreating(false);
  };

  const handleDeleteCharacter = (characterNameToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete ${characterNameToDelete}?`)) {
      const updatedCharacters = characters.filter(c => c.name !== characterNameToDelete);
      saveCharacters(updatedCharacters);
    }
  };

  return (
    <>
      <div className="w-full max-w-5xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
                Your Characters
            </h1>
            <p className="text-slate-400 mt-2">Create and manage your adventurers here.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <div key={char.name} className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between group relative overflow-hidden">
                {char.portrait ? (
                    <img src={char.portrait} alt={char.name} className="w-full h-48 object-cover" />
                ) : (
                    <div className="w-full h-48 bg-slate-900 flex items-center justify-center">
                        <UserIcon className="w-20 h-20 text-slate-600" />
                    </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-purple-400">{char.name}</h3>
                    <p className="text-slate-400 mt-2 text-sm h-20 overflow-hidden text-ellipsis flex-grow">
                        {char.description || <em>No description provided.</em>}
                    </p>
                </div>
                 <button 
                    onClick={() => handleDeleteCharacter(char.name)}
                    title="Delete character"
                    className="absolute top-2 right-2 p-1.5 text-slate-200 bg-black/40 hover:text-red-400 transition-all rounded-full hover:bg-slate-700/80">
                    <Trash2Icon className="w-4 h-4" />
                </button>
            </div>
          ))}
          <div
              className="bg-slate-800/50 rounded-lg p-6 border-2 border-dashed border-slate-700 hover:border-sky-500 transition-all duration-300 flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer min-h-[250px]"
              onClick={() => setIsCreating(true)}
            >
              <PlusIcon className="w-10 h-10 mb-2 text-slate-600" />
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

export default ProfileScreen;