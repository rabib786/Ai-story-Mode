import React, { useState, KeyboardEvent, ChangeEvent } from 'react';
import { Scenario, ScenarioCharacter } from '../types';
import { PlusIcon, Trash2Icon, UserIcon, ArrowLeftIcon, InfoIcon, XIcon, CheckIcon, EditIcon } from './icons';
import ScenarioCharacterEditor from './ScenarioCharacterEditor';

interface ScenarioEditorProps {
  onSave: (scenario: Scenario) => void;
  onBack: () => void;
}

const initialScenario: Scenario = {
  name: '',
  description: '',
  image: undefined,
  tags: [],
  worldDetails: '',
  customInstructions: '',
  characters: [],
  views: 0,
  rating: 0,
  forceCharacter: undefined,
  separateUserCharacter: false,
  sensitiveContent: false,
  publicScenario: false,
  allowStoryCustomization: true,
  hideScenarioPrompts: false,
  allowCommenting: true,
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-4">
    <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
    {children}
  </section>
);

const LabeledInput: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  maxLength?: number;
  placeholder?: string;
}> = ({ label, id, value, onChange, maxLength, placeholder }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-slate-300">{label}</label>
      {maxLength && <span className="text-xs text-slate-500">{value.length} / {maxLength}</span>}
    </div>
    <input type="text" id={id} name={id} value={value} onChange={onChange} maxLength={maxLength} placeholder={placeholder} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors" />
  </div>
);

const LabeledTextarea: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength: number;
  rows: number;
  placeholder: string;
}> = ({ label, id, value, onChange, maxLength, rows, placeholder }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-slate-300">{label}</label>
      <span className="text-xs text-slate-500">{value.length} / {maxLength}</span>
    </div>
    <textarea id={id} name={id} value={value} onChange={onChange} maxLength={maxLength} rows={rows} placeholder={placeholder} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors" />
  </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 ${enabled ? 'bg-sky-500' : 'bg-slate-600'}`}
    aria-checked={enabled}
  >
    <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);


const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ onSave, onBack }) => {
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [isCharacterModalOpen, setCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<{data: ScenarioCharacter, index: number} | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScenario(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setScenario(prev => ({ ...prev, image: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleToggleChange = (field: keyof Scenario, value: boolean) => {
    setScenario(prev => ({ ...prev, [field]: value }));
  };
  
  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !scenario.tags.includes(newTag) && scenario.tags.length < 5) {
        setScenario(prev => ({...prev, tags: [...prev.tags, newTag]}));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setScenario(prev => ({...prev, tags: prev.tags.filter(tag => tag !== tagToRemove)}));
  };
  
  const openCharacterModalForCreate = () => {
    setEditingCharacter(null);
    setCharacterModalOpen(true);
  };
  
  const openCharacterModalForEdit = (character: ScenarioCharacter, index: number) => {
    setEditingCharacter({ data: character, index });
    setCharacterModalOpen(true);
  };

  const handleSaveCharacter = (characterData: ScenarioCharacter) => {
    const newCharacters = [...scenario.characters];
    if (editingCharacter !== null) {
      newCharacters[editingCharacter.index] = characterData;
    } else {
      newCharacters.push(characterData);
    }
    setScenario(prev => ({ ...prev, characters: newCharacters }));
    setCharacterModalOpen(false);
  };
  
  const handleRemoveCharacter = (indexToRemove: number) => {
    setScenario(prev => ({...prev, characters: prev.characters.filter((_, index) => index !== indexToRemove)}));
  };

  const handleSave = () => {
    if (!scenario.name.trim()) {
      alert("Please provide a name for your scenario.");
      return;
    }
    onSave(scenario);
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-6">
        <header className="flex items-center justify-between mb-2">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-slate-100">Create Scenario</h1>
            <div className="w-20"></div> {/* Spacer */}
        </header>

        <FormSection title="Scenario Image">
             <div className="h-48 bg-slate-900 rounded-md flex items-center justify-center border border-dashed border-slate-600 relative group">
                {scenario.image ? (
                    <>
                        <img src={scenario.image} alt="Scenario preview" className="w-full h-full object-cover rounded-md" />
                        <button onClick={() => setScenario(prev => ({...prev, image: undefined}))} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <label htmlFor="image-upload" className="cursor-pointer text-center text-slate-500 hover:text-sky-400 transition-colors p-4">
                        <p>Click to upload image</p>
                        <p className="text-xs mt-1">(Recommended: 16:9 aspect ratio)</p>
                    </label>
                )}
                <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
             </div>
        </FormSection>
        
        <FormSection title="Scenario Details">
            <LabeledInput id="name" label="Scenario Name" value={scenario.name} onChange={handleInputChange} maxLength={35} placeholder="Life Experiment" />
            <LabeledTextarea id="description" label="Scenario Description" value={scenario.description} onChange={handleInputChange} maxLength={250} rows={3} placeholder="In a vibrant American city..." />
            
             <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">Scenario Tags & Genres</label>
                    <span className="text-xs text-slate-500">{scenario.tags.length} / 5 Slots Used</span>
                </div>
                 <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900 border border-slate-600 rounded-md">
                    {scenario.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-1.5 bg-sky-500/20 text-sky-300 text-sm font-semibold px-2 py-1 rounded">
                            {tag}
                            <button onClick={() => removeTag(tag)}><XIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder={scenario.tags.length < 5 ? "Add a tag..." : "Max tags reached"} className="bg-transparent focus:outline-none flex-grow" disabled={scenario.tags.length >= 5} />
                </div>
            </div>
        </FormSection>
        
        <FormSection title="Scenario Building">
            <LabeledTextarea id="worldDetails" label="Backstory / World Details" value={scenario.worldDetails} onChange={handleInputChange} maxLength={3000} rows={8} placeholder="Describe the world, its history, key locations, and the overall context for the AI storyteller." />
            <LabeledTextarea id="customInstructions" label="Custom Scenario Instructions" value={scenario.customInstructions} onChange={handleInputChange} maxLength={3000} rows={8} placeholder="Provide specific rules or instructions for the AI to follow during the story." />
        </FormSection>

        <FormSection title="Story Characters">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenario.characters.map((char, index) => (
                  <div key={index} className="bg-slate-900 p-3 rounded-lg flex items-start gap-3 border border-slate-700 relative group">
                    {char.portrait ? <img src={char.portrait} alt={char.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0"/> : <div className="w-16 h-16 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0"><UserIcon className="w-8 h-8 text-slate-500"/></div>}
                    <div className="flex-grow"><h3 className="font-bold text-purple-300">{char.name}</h3><p className="text-sm text-slate-400 line-clamp-2">{char.role}</p></div>
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openCharacterModalForEdit(char, index)} title="Edit Character" className="p-1 text-slate-400 hover:text-sky-400 bg-slate-700/50 rounded"><EditIcon className="w-4 h-4"/></button>
                        <button onClick={() => handleRemoveCharacter(index)} title="Delete Character" className="p-1 text-slate-400 hover:text-red-400 bg-slate-700/50 rounded"><Trash2Icon className="w-4 h-4"/></button>
                     </div>
                  </div>
              ))}
            </div>
            <button type="button" onClick={openCharacterModalForCreate} className="w-full flex items-center justify-center gap-2 border-2 border-slate-700 bg-slate-800 rounded-lg p-3 text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors">
              <PlusIcon className="w-5 h-5"/>
              Create Character
            </button>
        </FormSection>

        <FormSection title="Settings">
            <div className="space-y-4">
                 <div className="flex items-center justify-between p-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">Sensitive Content (18+) <span title="Adds a content advisory to the AI's instructions to handle mature themes appropriately."><InfoIcon className="w-4 h-4 text-slate-500" /></span></label>
                    <ToggleSwitch enabled={scenario.sensitiveContent} onChange={(val) => handleToggleChange('sensitiveContent', val)} />
                </div>
                 <div className="flex items-center justify-between p-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">Hide Scenario Prompts <span title="If enabled, the AI-suggested action buttons will not be shown to the player."><InfoIcon className="w-4 h-4 text-slate-500" /></span></label>
                    <ToggleSwitch enabled={scenario.hideScenarioPrompts} onChange={(val) => handleToggleChange('hideScenarioPrompts', val)} />
                </div>
            </div>
        </FormSection>

        <div className="flex flex-col items-center gap-4 pt-4">
            <button onClick={handleSave} className="flex items-center justify-center gap-2 font-semibold bg-sky-600 text-white py-3 px-8 rounded-lg hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/10">
                <CheckIcon className="w-5 h-5"/>
                Create Scenario
            </button>
        </div>

      </div>
      {isCharacterModalOpen && (
        <ScenarioCharacterEditor 
            onClose={() => setCharacterModalOpen(false)} 
            onSave={handleSaveCharacter}
            initialData={editingCharacter?.data}
        />
      )}
    </>
  );
};

export default ScenarioEditor;