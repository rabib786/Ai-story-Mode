import React, { useState } from 'react';
import { UserCharacter } from '../types';
import { UserIcon, XIcon, RefreshCwIcon } from './icons';
import { generateCharacterPortrait } from '../services/geminiService';

interface CharacterCreationProps {
  onClose: () => void;
  onCharacterCreated: (character: UserCharacter) => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onClose, onCharacterCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePortrait = async () => {
    if (!name.trim() || !description.trim()) {
      alert('Please provide a name and description before generating a portrait.');
      return;
    }
    setIsGenerating(true);
    setPortrait(null); // Clear previous portrait
    try {
      const imageUrl = await generateCharacterPortrait(name, description);
      setPortrait(imageUrl);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred while generating the portrait.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please give your character a name.');
      return;
    }
    onCharacterCreated({ name, description, portrait: portrait || undefined });
  };
  
  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-400 mb-2";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col border border-slate-700 h-full max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-purple-400">Create a New Character</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-slate-700">
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
                    onChange={(e) => setName(e.target.value)}
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
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your character. What do they look like? What is their past? E.g., A former knight, exiled from their homeland, now seeking redemption in the shadows."
                    className={inputClass}
                    rows={5}
                    disabled={isGenerating}
                />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-48 h-48 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-600">
                {isGenerating ? (
                   <div className="text-center text-slate-400">
                     <RefreshCwIcon className="w-10 h-10 animate-spin mx-auto mb-2" />
                     <p>Generating...</p>
                   </div>
                ) : portrait ? (
                   <img src={portrait} alt={name} className="w-full h-full object-cover rounded-lg" />
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
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isGenerating || !name.trim() || !description.trim()}
                >
                  <RefreshCwIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {portrait ? 'Re-generate Portrait' : 'Generate Portrait'}
                </button>
            </div>
            
             <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
