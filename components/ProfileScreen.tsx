import React, { useState, useCallback } from 'react';
import { UserCharacter, ActiveChat } from '../types';
import CharacterCreation from './CharacterCreation';
import { PlusIcon, Trash2Icon, UserIcon, EditIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';

interface ProfileScreenProps {
    characters: UserCharacter[];
    onSaveCharacters: (characters: UserCharacter[]) => void;
    activeChats: ActiveChat[];
    showAlert: (title: string, message: string) => void;
}

const CharacterCard: React.FC<{ char: UserCharacter; onEdit: (char: UserCharacter) => void; onDelete: (id: string) => void; }> = ({ char, onEdit, onDelete }) => (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 flex flex-col group relative overflow-hidden transform transition-transform hover:-translate-y-1 hover:scale-[1.02]">
        <div className="relative h-48 w-full">
            {char.portrait ? (
                <img src={char.portrait} alt={char.name} className="w-full h-full object-cover" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <UserIcon className="w-20 h-20 text-zinc-700" />
                </div>
            )}
             <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 <button 
                    onClick={() => onEdit(char)}
                    title="Edit character"
                    className="p-1.5 text-slate-200 bg-black/60 hover:text-sky-400 transition-all rounded-full hover:bg-zinc-900/80">
                    <EditIcon className="w-4 h-4" />
                </button>
                 <button 
                    onClick={() => onDelete(char.id)}
                    title="Delete character"
                    className="p-1.5 text-slate-200 bg-black/60 hover:text-red-400 transition-all rounded-full hover:bg-zinc-900/80">
                    <Trash2Icon className="w-4 h-4" />
                </button>
            </div>
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-cyan-400">{char.name}</h3>
            <p className="text-slate-400 mt-2 text-sm text-ellipsis flex-grow line-clamp-3">
                {char.description || <em>No description provided.</em>}
            </p>
        </div>
    </div>
);


const ProfileScreen: React.FC<ProfileScreenProps> = ({ characters, onSaveCharacters, activeChats, showAlert }) => {
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<UserCharacter | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);


  const handleOpenCreator = () => {
    setEditingCharacter(null);
    setEditorOpen(true);
  };

  const handleOpenEditor = (character: UserCharacter) => {
    setEditingCharacter(character);
    setEditorOpen(true);
  };
  
  const handleSaveOrUpdateCharacter = (character: UserCharacter) => {
    // Check for name conflict (if name was changed)
    if (characters.some(c => c.id !== character.id && c.name.toLowerCase() === character.name.toLowerCase())) {
        showAlert("Name Conflict", "A character with this name already exists.");
        return;
    }

    const isUpdating = characters.some(c => c.id === character.id);
    let updatedCharacters;

    if (isUpdating) {
        updatedCharacters = characters.map(c => c.id === character.id ? character : c);
    } else {
        updatedCharacters = [...characters, character];
    }
    
    onSaveCharacters(updatedCharacters);
    setEditorOpen(false);
    setEditingCharacter(null);
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
        message: `Are you sure you want to delete ${characterToDelete.name}? This action cannot be undone.`,
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
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
                Your Characters
            </h1>
            <p className="text-slate-400 mt-2">Create and manage the protagonists of your stories.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <CharacterCard key={char.id} char={char} onEdit={handleOpenEditor} onDelete={handleDeleteCharacter} />
          ))}
          <div
              className="bg-transparent rounded-lg p-6 border-2 border-dashed border-zinc-800 hover:border-sky-500 hover:bg-zinc-950 transition-all duration-300 flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer min-h-[320px] transform hover:-translate-y-1 hover:scale-[1.02] group"
              onClick={handleOpenCreator}
            >
              <div className="w-16 h-16 rounded-full bg-zinc-900 group-hover:bg-cyan-500/10 border border-zinc-800 group-hover:border-cyan-500 flex items-center justify-center transition-colors mb-4">
                <PlusIcon className="w-8 h-8 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-300 group-hover:text-cyan-400 transition-colors">Create New Character</h3>
            </div>
        </div>
      </div>
      {isEditorOpen && (
        <CharacterCreation 
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveOrUpdateCharacter}
          initialCharacter={editingCharacter}
        />
      )}
    </>
  );
};

export default ProfileScreen;