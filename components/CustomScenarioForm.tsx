import React, { useState } from 'react';
import { Scenario, ScenarioCharacter } from '../types';
import { PlusIcon, Trash2Icon, XIcon } from './icons';

interface CustomScenarioFormProps {
  onClose: () => void;
  onSubmit: (scenario: Scenario) => void;
}

// FIX: Aligned initialScenario with the Scenario interface from types.ts
const initialScenario: Scenario = {
  name: '',
  description: '',
  tags: [],
  worldDetails: '',
  customInstructions: '',
  characters: [
    { name: '', role: '', personality: '', backstory: '' }
  ],
  // FIX: Added missing 'views' and 'rating' properties to match the Scenario type.
  views: 0,
  rating: 0,
  forceCharacter: undefined,
  separateUserCharacter: false,
  sensitiveContent: false,
  publicScenario: true,
  allowStoryCustomization: true,
  hideScenarioPrompts: false,
  allowCommenting: true,
};

const CustomScenarioForm: React.FC<CustomScenarioFormProps> = ({ onClose, onSubmit }) => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScenario(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCharacterChange = (index: number, field: keyof ScenarioCharacter, value: string) => {
    const updatedCharacters = [...scenario.characters];
    updatedCharacters[index] = { ...updatedCharacters[index], [field]: value };
    setScenario(prev => ({ ...prev, characters: updatedCharacters }));
  };

  const addCharacter = () => {
    setScenario(prev => ({
      ...prev,
      characters: [...prev.characters, { name: '', role: '', personality: '', backstory: '' }]
    }));
  };

  const removeCharacter = (index: number) => {
    if (scenario.characters.length > 1) {
      setScenario(prev => ({
        ...prev,
        characters: prev.characters.filter((_, i) => i !== index)
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    // FIX: Changed check from scenario.title to scenario.name
    if (!scenario.name.trim()) {
        alert("Please provide a title for your scenario.");
        return;
    }
    onSubmit(scenario);
  };

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors";
  const labelClass = "block text-sm font-medium text-slate-400 mb-1";
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-3xl h-[90vh] rounded-xl shadow-2xl flex flex-col border border-slate-700">
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-purple-400">Create a New Scenario</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-slate-700">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* --- Basic Info --- */}
          {/* FIX: Updated to use `name` and removed `genre`. */}
          <fieldset className="space-y-4">
            <div>
              <label htmlFor="name" className={labelClass}>Title</label>
              <input type="text" name="name" id="name" value={scenario.name} onChange={handleInputChange} className={inputClass} placeholder="The Sunken City of Algor" required />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>Short Description</label>
              <input name="description" id="description" value={scenario.description} onChange={handleInputChange} className={inputClass} placeholder="A deep-sea expedition uncovers a lost civilization." />
            </div>
          </fieldset>

          {/* --- Setting --- */}
          {/* FIX: Replaced complex setting fields with a single `worldDetails` textarea. */}
          <fieldset className="space-y-4 p-4 border border-slate-700 rounded-lg">
            <legend className="text-lg font-semibold text-sky-400 px-2">World Details</legend>
             <div>
                <label htmlFor="worldDetails" className={labelClass}>Full Setting Description</label>
                <textarea name="worldDetails" id="worldDetails" value={scenario.worldDetails} onChange={handleInputChange} className={inputClass} rows={5} placeholder="Describe the world the player will be in. Include details about the time, place, and atmosphere."></textarea>
            </div>
          </fieldset>
          
          {/* --- Characters --- */}
          <fieldset className="space-y-4 p-4 border border-slate-700 rounded-lg">
             <legend className="text-lg font-semibold text-sky-400 px-2">Characters</legend>
             {scenario.characters.map((char, index) => (
                <div key={index} className="space-y-3 p-3 bg-slate-900/50 rounded-md relative">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div><label className={labelClass}>Name</label><input type="text" value={char.name} onChange={e => handleCharacterChange(index, 'name', e.target.value)} className={inputClass} placeholder="Dr. Aris Thorne" /></div>
                       <div><label className={labelClass}>Role</label><input type="text" value={char.role} onChange={e => handleCharacterChange(index, 'role', e.target.value)} className={inputClass} placeholder="Lead Marine Biologist" /></div>
                   </div>
                   <div><label className={labelClass}>Personality</label><textarea value={char.personality} onChange={e => handleCharacterChange(index, 'personality', e.target.value)} className={inputClass} rows={2} placeholder="Brilliant but haunted by a past failure."/></div>
                   <div><label className={labelClass}>Backstory</label><textarea value={char.backstory} onChange={e => handleCharacterChange(index, 'backstory', e.target.value)} className={inputClass} rows={2} placeholder="Lost a crew on his last deep-sea venture."/></div>
                   {scenario.characters.length > 1 && <button type="button" onClick={() => removeCharacter(index)} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400"><Trash2Icon className="w-4 h-4" /></button>}
                </div>
             ))}
             <button type="button" onClick={addCharacter} className="flex items-center gap-2 text-sky-400 hover:text-sky-300 font-semibold py-2 px-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                <PlusIcon className="w-5 h-5" /> Add Character
             </button>
          </fieldset>

          {/* --- Plot --- */}
          {/* FIX: Replaced plot hooks/rules with a single `customInstructions` textarea. */}
          <fieldset className="space-y-4 p-4 border border-slate-700 rounded-lg">
             <legend className="text-lg font-semibold text-sky-400 px-2">Custom Instructions</legend>
             <div>
                <h4 className="font-semibold text-slate-300 mb-2">Rules & Hooks for the AI</h4>
                <textarea name="customInstructions" id="customInstructions" value={scenario.customInstructions} onChange={handleInputChange} className={inputClass} rows={5} placeholder="Provide specific rules (e.g., 'The main character cannot die') or story hooks (e.g., 'The story begins with a mysterious message') for the AI storyteller." />
             </div>
          </fieldset>
        </form>
        
        <footer className="p-4 border-t border-slate-700 flex-shrink-0">
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
            // FIX: Changed disabled check from scenario.title to scenario.name
            disabled={!scenario.name.trim()}
          >
            Start Adventure
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CustomScenarioForm;
