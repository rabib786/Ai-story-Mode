import React, { useState, useEffect } from 'react';
import { UserCharacter } from '../types';
import { UserIcon, XIcon, RefreshCwIcon, InfoIcon } from './icons';
import { generateCharacterPortrait } from '../services/geminiService';

interface CharacterCreationProps {
  onClose: () => void;
  onSave: (character: UserCharacter) => void;
  initialCharacter?: UserCharacter | null;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onClose, onSave, initialCharacter }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCharacter) {
      setName(initialCharacter.name);
      setDescription(initialCharacter.description);
      setPortrait(initialCharacter.portrait || null);
    }
  }, [initialCharacter]);

  const handleGeneratePortrait = async () => {
    if (!name.trim() || !description.trim()) {
      setError('Please provide a name and description before generating a portrait.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setPortrait(null); // Clear previous portrait
    try {
      const imageUrl = await generateCharacterPortrait(name, description);
      setPortrait(imageUrl);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please give your character a name.');
      return;
    }
    onSave({
        id: initialCharacter?.id || crypto.randomUUID(),
        name,
        description,
        portrait: portrait || undefined
    });
  };
  
  const inputClass = "w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-400 mb-2";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-black/90 w-full max-w-lg rounded-xl shadow-2xl flex flex-col border border-zinc-800 h-full max-h-[90vh] backdrop-blur-xl animate-fade-in-scale">
        <header className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-cyan-400">{initialCharacter ? 'Edit Character' : 'Create a New Character'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-900">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
            <div>
                <label htmlFor="char-name" className={labelClass}>Character Name</label>
                <input
                    id="char-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(null); }}
                    placeholder="E.g., Kaelen the Wanderer"
                    className={inputClass}
                    required
                    disabled={isGenerating}
                />
            </div>
            <div>
                <label htmlFor="char-desc" className={labelClass}>Character Description & Backstory</label>
                <textarea
                    id="char-desc"
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); setError(null); }}
                    placeholder="Describe your character. What do they look like? What is their past? E.g., A former knight, exiled from their homeland, now seeking redemption in the shadows."
                    className={inputClass}
                    rows={5}
                    disabled={isGenerating}
                />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-zinc-950 rounded-lg flex items-center justify-center border border-zinc-800 overflow-hidden">
                {isGenerating ? (
                   <div className="w-full h-full animate-shimmer" />
                ) : portrait ? (
                   <img src={portrait} alt={name} className="w-full h-full object-cover rounded-lg" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center text-slate-500">
                    <UserIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>Portrait will appear here</p>
                  </div>
                )}
              </div>

               <button
                  type="button"
                  onClick={handleGeneratePortrait}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
                  disabled={isGenerating || !name.trim() || !description.trim()}
                >
                  <RefreshCwIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {portrait ? 'Re-generate Portrait' : 'Generate Portrait'}
                </button>
            </div>
            
             {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-lg p-3 flex items-start gap-2">
                    <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

             <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
                disabled={isGenerating || !name.trim()}
            >
                <UserIcon className="w-5 h-5" />
                Save Character
            </button>
        </form>
      </div>
    </div>
  );
};

export default CharacterCreation;