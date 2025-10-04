import React, { useState, useEffect } from 'react';
import { ScenarioCharacter } from '../types';
import { UserIcon, XIcon, RefreshCwIcon, SaveIcon, InfoIcon } from './icons';
import { generateCharacterPortrait } from '../services/geminiService';

interface ScenarioCharacterEditorProps {
  onClose: () => void;
  onSave: (character: ScenarioCharacter) => void;
  initialData?: ScenarioCharacter;
}

const ScenarioCharacterEditor: React.FC<ScenarioCharacterEditorProps> = ({ onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setPersonality(initialData.personality);
      setBackstory(initialData.backstory);
      setPortrait(initialData.portrait || null);
    }
  }, [initialData]);

  const canGenerate = !isGenerating && !!name.trim() && (!!role.trim() || !!personality.trim() || !!backstory.trim());

  const handleGeneratePortrait = async () => {
    if (!canGenerate) {
      setError('Please provide a name and at least one other detail before generating a portrait.');
      return;
    }
    const description = `Role: ${role}. Personality: ${personality}. Backstory: ${backstory}`;
    setIsGenerating(true);
    setError(null);
    setPortrait(null);
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
      setError('Please give the character a name.');
      return;
    }
    onSave({ name, role, personality, backstory, portrait: portrait || undefined });
  };
  
  const inputClass = "w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-black/90 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-zinc-800 backdrop-blur-xl animate-fade-in-scale"
      >
        <header className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-xl font-bold text-cyan-400">{initialData ? 'Edit NPC' : 'Create NPC'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-900">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} id="npc-editor-form" className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
            <div className="space-y-4">
                <div>
                    <label htmlFor="npc-name" className={labelClass}>Name</label>
                    <input id="npc-name" type="text" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="E.g., Elara" className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="npc-role" className={labelClass}>Role</label>
                    <input id="npc-role" type="text" value={role} onChange={(e) => { setRole(e.target.value); setError(null); }} placeholder="Guardian of the Spire" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="npc-personality" className={labelClass}>Personality</label>
                    <textarea id="npc-personality" value={personality} onChange={(e) => { setPersonality(e.target.value); setError(null); }} placeholder="Wise, cautious, speaks in riddles." className={inputClass} rows={3} />
                </div>
                 <div>
                    <label htmlFor="npc-backstory" className={labelClass}>Backstory</label>
                    <textarea id="npc-backstory" value={backstory} onChange={(e) => { setBackstory(e.target.value); setError(null); }} placeholder="An ancient elven warrior bound by an oath." className={inputClass} rows={4} />
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-start gap-4">
              <div className="w-full h-64 bg-zinc-950 rounded-lg flex items-center justify-center border border-zinc-800 overflow-hidden">
                {isGenerating ? (
                   <div className="w-full h-full animate-shimmer" />
                ) : portrait ? (
                   <img src={portrait} alt={name} className="w-full h-full object-cover rounded-lg" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                ) : (
                  <div className="text-center text-slate-500 p-4">
                    <UserIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>Portrait will appear here</p>
                  </div>
                )}
              </div>

               <button
                  type="button"
                  onClick={handleGeneratePortrait}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
                  disabled={!canGenerate}
                >
                  <RefreshCwIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {portrait ? 'Re-generate Portrait' : 'Generate Portrait'}
                </button>
                 {error && (
                    <div className="w-full bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-lg p-3 flex items-start gap-2 mt-2">
                        <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </form>
         <footer className="p-4 border-t border-zinc-800 mt-auto flex-shrink-0">
             <button
                type="submit"
                form="npc-editor-form"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
                disabled={!name.trim() || isGenerating}
            >
                <SaveIcon className="w-5 h-5" />
                {initialData ? 'Update Character' : 'Save Character'}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ScenarioCharacterEditor;