import React, { useState, useEffect } from 'react';
import { ScenarioCharacter } from '../types';
import { UserIcon, XIcon, RefreshCwIcon, SaveIcon } from './icons';
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

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setPersonality(initialData.personality);
      setBackstory(initialData.backstory);
      setPortrait(initialData.portrait || null);
    }
  }, [initialData]);

  const handleGeneratePortrait = async () => {
    const description = `Role: ${role}. Personality: ${personality}. Backstory: ${backstory}`;
    if (!name.trim() || !description.trim()) {
      alert('Please provide a name and at least one other detail before generating a portrait.');
      return;
    }
    setIsGenerating(true);
    setPortrait(null);
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
      alert('Please give the character a name.');
      return;
    }
    onSave({ name, role, personality, backstory, portrait: portrait || undefined });
  };
  
  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col border border-slate-700 animate-fade-in">
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-purple-400">{initialData ? 'Edit NPC' : 'Create NPC'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-slate-700">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
            <div className="space-y-4">
                <div>
                    <label htmlFor="npc-name" className={labelClass}>Name</label>
                    <input id="npc-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="E.g., Elara" className={inputClass} required />
                </div>
                <div>
                    <label htmlFor="npc-role" className={labelClass}>Role</label>
                    <input id="npc-role" type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Guardian of the Spire" className={inputClass} />
                </div>
                <div>
                    <label htmlFor="npc-personality" className={labelClass}>Personality</label>
                    <textarea id="npc-personality" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="Wise, cautious, speaks in riddles." className={inputClass} rows={3} />
                </div>
                 <div>
                    <label htmlFor="npc-backstory" className={labelClass}>Backstory</label>
                    <textarea id="npc-backstory" value={backstory} onChange={(e) => setBackstory(e.target.value)} placeholder="An ancient elven warrior bound by an oath." className={inputClass} rows={4} />
                </div>
            </div>
            
            <div className="flex flex-col items-center justify-between gap-4">
              <div className="w-full h-64 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-600">
                {isGenerating ? (
                   <div className="text-center text-slate-400">
                     <RefreshCwIcon className="w-10 h-10 animate-spin mx-auto mb-2" />
                     <p>Generating...</p>
                   </div>
                ) : portrait ? (
                   <img src={portrait} alt={name} className="w-full h-full object-cover rounded-lg" />
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
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isGenerating || !name.trim()}
                >
                  <RefreshCwIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {portrait ? 'Re-generate Portrait' : 'Generate Portrait'}
                </button>
            </div>
        </form>
         <footer className="p-4 border-t border-slate-700 mt-auto flex-shrink-0">
             <button
                type="submit"
                onClick={handleSubmit}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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