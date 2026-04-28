
import React, { useState, KeyboardEvent, ChangeEvent, useEffect } from 'react';
import { Scenario, ScenarioCharacter } from '../types';
import { PlusIcon, Trash2Icon, UserIcon, ArrowLeftIcon, InfoIcon, XIcon, CheckIcon, EditIcon, RefreshCwIcon, Wand2Icon, AlertTriangleIcon } from './icons';
import ScenarioCharacterEditor from './ScenarioCharacterEditor';
import { analyzeDescription, analyzeWorldDetails, checkFormattingIssues, Suggestion } from '../services/scenarioSuggestions';

interface ScenarioEditorProps {
  onSave: (scenario: Scenario) => void;
  onBack: () => void;
  initialData?: Scenario | null;
}

const createInitialScenario = (): Scenario => ({
  id: `custom-${crypto.randomUUID()}`,
  name: '',
  description: '',
  image: undefined,
  tags: [],
  worldDetails: '',
  introduction: undefined,
  greetingMessage: '',
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
});

const BACKSTORY_PLACEHOLDER = `Write the scenario's backstory here. This will directly affect how the scenario will play and how the characters will interact.
Use as much detail as possible and explain things that are happening in the scenario. Writing in story format usually gives the best results.

NOTES:
- In case you enable the 'separate user character' option and plan on having the user act as themselves, use {{user}} when mentioning them.
- DO NOT define the character personalities in the backstory. Character definition is done in the characters section!
- Remember to define where the scenario starts and what the characters are currently doing/experiencing.
- A good backstory usually ends in a situation that requires the user's input.`;

const GREETING_PLACEHOLDER = `This will be the first message users receive. It can be used to drive the scenario into a certain direction.
Alternatively, you can just add dialogue to the backstory using the same format.

*Joe and Emma had agreed to meet up in to local coffee shop. They both sat down on the table and started talking.*
[Joe]: "How have you been feeling lately? Is everything okay?" *Joe asked before taking a sip from his coffee cup*

Use the following format when characters talk:
[Jack]: "Wow, the sun looks really beautiful today!" *Joe smiled at {{user}}*
*asterisks* = action/narration`;

const INSTRUCTIONS_PLACEHOLDER = `You can use this field to define events that will happen during the scenario.

Ex. When Joe opens the chest, a trap will activate.
Ex. Jin won't be able to unlock the door unless {{user}} finds the key.`;


const FormSection: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  info?: string;
  actions?: React.ReactNode;
  titleChildren?: React.ReactNode;
}> = ({ title, children, info, actions, titleChildren }) => (
  <section className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-4">
    <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <span>{title}</span>
            {titleChildren}
            {info && <span title={info} className="cursor-help"><InfoIcon className="w-4 h-4 text-slate-500" /></span>}
        </h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
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
    <input type="text" id={id} name={id} value={value} onChange={onChange} maxLength={maxLength} placeholder={placeholder} className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors" />
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
  info?: string;
  showAiButton?: boolean;
  onAiButtonClick?: () => void;
}> = ({ label, id, value, onChange, maxLength, rows, placeholder, info, showAiButton = false, onAiButtonClick }) => (
  <div>
    <div className="flex justify-between items-center mb-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
        {label}
        {info && <span title={info} className="cursor-help"><InfoIcon className="w-4 h-4 text-slate-500" /></span>}
      </label>
      <span className="text-xs text-slate-500">{value.length} / {maxLength}</span>
    </div>
    <div className="relative">
        <textarea id={id} name={id} value={value} onChange={onChange} maxLength={maxLength} rows={rows} placeholder={placeholder} className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors" />
        {showAiButton && (
            <button
                type="button"
                onClick={onAiButtonClick}
                className="absolute bottom-2.5 right-2.5 p-1.5 bg-zinc-800/80 text-slate-300 rounded-full hover:bg-sky-500/50 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate with AI (Coming Soon)"
                disabled
            >
                <Wand2Icon className="w-4 h-4" />
            </button>
        )}
    </div>
  </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-sky-500 ${enabled ? 'bg-sky-500' : 'bg-zinc-800'}`}
    aria-checked={enabled}
  >
    <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const AddSectionButton: React.FC<{ onClick: () => void; label: string; }> = ({ onClick, label }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-zinc-800 bg-zinc-950/50 rounded-lg p-3 text-slate-400 hover:border-sky-500 hover:text-sky-400 transition-colors">
        <PlusIcon className="w-5 h-5"/>
        {label}
    </button>
);


const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ onSave, onBack, initialData }) => {
  const [scenario, setScenario] = useState<Scenario>(() => initialData || createInitialScenario());
  const [isCharacterModalOpen, setCharacterModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<{data: ScenarioCharacter, index: number} | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showIntroduction, setShowIntroduction] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [showCustomInstructions, setShowCustomInstructions] = useState(true);
  
  useEffect(() => {
    if (initialData) {
      setShowIntroduction(!!initialData.introduction);
      setShowGreeting(!!initialData.greetingMessage);
      setShowCustomInstructions(!!initialData.customInstructions);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScenario(prev => ({ ...prev, [name]: value }));
    if (name === 'name' && value.trim()) {
      setError(null);
    }
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
      setError("Please provide a name for your scenario.");
      window.scrollTo(0,0);
      return;
    }
    if (!scenario.description.trim() || scenario.description.length < 10) {
      setError("Description is too short. Please provide at least 10 characters.");
      window.scrollTo(0,0);
      return;
    }
    if (!scenario.worldDetails.trim() || scenario.worldDetails.length < 50) {
      setError("Backstory / World Details are too short. Please provide at least 50 characters.");
      window.scrollTo(0,0);
      return;
    }

    // Check formatting globally
    const allText = `${scenario.description} ${scenario.worldDetails} ${scenario.introduction || ''} ${scenario.greetingMessage || ''} ${scenario.customInstructions}`;
    const formatIssue = checkFormattingIssues(allText);
    if (formatIssue && formatIssue.type === 'warning') {
        if (!confirm(`Warning: ${formatIssue.message}

Are you sure you want to save anyway?`)) {
            return;
        }
    }

    onSave(scenario);
  };

  const totalCharacterLength = scenario.characters.reduce((acc, char) => {
    return acc + (char.name?.length || 0) + (char.role?.length || 0) + (char.personality?.length || 0) + (char.backstory?.length || 0);
  }, 0);

  return (
    <>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between mb-2">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-sky-400 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-slate-100">{initialData ? 'Edit Scenario' : 'Create Scenario'}</h1>
            <div className="w-20"></div> {/* Spacer */}
        </header>
        
         {error && (
            <div className="w-full bg-red-900/50 border border-red-500/50 text-red-300 text-sm rounded-lg p-3 flex items-start gap-2 -mb-2">
                <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        <FormSection title="Details & Metadata">
             <LabeledInput id="name" label="Scenario Name" value={scenario.name} onChange={handleInputChange} maxLength={35} placeholder="Life Experiment" />
            <LabeledTextarea id="description" label="Scenario Description" value={scenario.description} onChange={handleInputChange} maxLength={250} rows={3} placeholder="In a vibrant American city..." />
            <SuggestionBox suggestions={analyzeDescription(scenario.description)} />
            
             <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">Scenario Tags & Genres</label>
                    <span className="text-xs text-slate-500">{scenario.tags.length} / 5 Slots Used</span>
                </div>
                 <div className="flex flex-wrap items-center gap-2 p-2 bg-black border border-zinc-800 rounded-md">
                    {scenario.tags.map(tag => (
                        <div key={tag} className="flex items-center gap-1.5 bg-sky-500/20 text-sky-300 text-sm font-semibold px-2 py-1 rounded">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)}><XIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder={scenario.tags.length < 5 ? "Add a tag..." : "Max tags reached"} className="bg-transparent focus:outline-none flex-grow" disabled={scenario.tags.length >= 5} />
                </div>
            </div>
            
             <div className="h-48 bg-black rounded-md flex items-center justify-center border border-dashed border-zinc-800 relative group">
                {scenario.image ? (
                    <>
                        <img src={scenario.image} alt="Scenario preview" className="w-full h-full object-cover rounded-md" loading="lazy" />
                        <button type="button" onClick={() => setScenario(prev => ({...prev, image: undefined}))} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100">
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


        {!showIntroduction && (
            <div className="text-center">
                <button type="button" onClick={() => setShowIntroduction(true)} className="text-slate-300 font-semibold hover:text-sky-400 transition-colors flex items-center gap-2 mx-auto">
                    <PlusIcon className="w-5 h-5" /> Add Introduction Section
                </button>
            </div>
        )}
        {showIntroduction && (
             <FormSection 
                title="Introduction"
                actions={<button onClick={() => { setShowIntroduction(false); setScenario(p => ({...p, introduction: undefined})); }} className="p-1 text-slate-500 hover:text-white"><XIcon className="w-4 h-4"/></button>}
             >
                <LabeledTextarea id="introduction" label="" value={scenario.introduction || ''} onChange={(e) => setScenario(p=>({...p, introduction: e.target.value}))} maxLength={1000} rows={4} placeholder="Write a brief introduction that appears before the story begins..." />
                <SuggestionBox suggestions={checkFormattingIssues(scenario.introduction || '')} />
            </FormSection>
        )}

        <h2 className="text-xl font-bold text-slate-200 pt-4 -mb-2">Scenario Building</h2>
        
        <FormSection title="Backstory / World Details">
            <LabeledTextarea id="worldDetails" label="" value={scenario.worldDetails} onChange={handleInputChange} maxLength={3000} rows={12} placeholder={BACKSTORY_PLACEHOLDER} showAiButton={true} />
            <SuggestionBox suggestions={[...analyzeWorldDetails(scenario.worldDetails, scenario.characters), ...(checkFormattingIssues(scenario.worldDetails) ? [checkFormattingIssues(scenario.worldDetails) as Suggestion] : [])]} />
        </FormSection>
        
        {showGreeting ? (
             <FormSection 
                title="Greeting Message" 
                info="This will be the first message users receive. It can be used to drive the scenario into a certain direction."
                actions={
                    <>
                        <button onClick={() => {}} className="p-1 text-slate-500 hover:text-white" disabled title="Generate (Coming Soon)"><RefreshCwIcon className="w-4 h-4"/></button>
                        <button onClick={() => { setShowGreeting(false); setScenario(p => ({...p, greetingMessage: ''})); }} className="p-1 text-slate-500 hover:text-white"><XIcon className="w-4 h-4"/></button>
                    </>
                }
             >
                <LabeledTextarea id="greetingMessage" label="" value={scenario.greetingMessage || ''} onChange={(e) => setScenario(p=>({...p, greetingMessage: e.target.value}))} maxLength={2000} rows={8} placeholder={GREETING_PLACEHOLDER} showAiButton={true} />
            </FormSection>
        ) : <AddSectionButton onClick={() => setShowGreeting(true)} label="Add Greeting Message" />}

        {showCustomInstructions ? (
             <FormSection 
                title="Custom Scenario Instructions" 
                info="You can use this field to define events that will happen during the scenario."
                actions={<button onClick={() => { setShowCustomInstructions(false); setScenario(p => ({...p, customInstructions: ''})); }} className="p-1 text-slate-500 hover:text-white"><XIcon className="w-4 h-4"/></button>}
             >
                <LabeledTextarea id="customInstructions" label="" value={scenario.customInstructions} onChange={handleInputChange} maxLength={3000} rows={5} placeholder={INSTRUCTIONS_PLACEHOLDER} />
            </FormSection>
        ) : <AddSectionButton onClick={() => setShowCustomInstructions(true)} label="Add Custom Scenario Instructions" />}

        <button type="button" className="w-full flex items-center justify-center gap-2 border-2 border-zinc-800 bg-zinc-950 rounded-lg p-3 text-slate-500 cursor-not-allowed" disabled>
          <PlusIcon className="w-5 h-5"/>
          Add Story Cards
        </button>

        <FormSection 
            title="Story Characters"
            info="Define the Non-Player Characters (NPCs) that will interact with the user in the story."
            titleChildren={<span className="text-sm font-normal text-slate-500">{totalCharacterLength} / 10,000</span>}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenario.characters.map((char, index) => (
                  <div key={index} className="bg-black p-3 rounded-lg flex items-start gap-3 border border-zinc-800 relative group">
                    {char.portrait ? <img src={char.portrait} alt={char.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer"/> : <div className="w-16 h-16 bg-zinc-900 rounded-md flex items-center justify-center flex-shrink-0"><UserIcon className="w-8 h-8 text-slate-500"/></div>}
                    <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-cyan-300 truncate">{char.name}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2">{char.personality || char.role}</p>
                    </div>
                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => openCharacterModalForEdit(char, index)} title="Edit Character" className="p-1 text-slate-400 hover:text-sky-400 bg-zinc-900/50 rounded"><EditIcon className="w-4 h-4"/></button>
                        <button type="button" onClick={() => handleRemoveCharacter(index)} title="Delete Character" className="p-1 text-slate-400 hover:text-red-400 bg-zinc-900/50 rounded"><Trash2Icon className="w-4 h-4"/></button>
                     </div>
                  </div>
              ))}
            </div>
            {scenario.characters.length === 0 && (
                <div className="text-center text-slate-500 p-4">Create a character for this scenario by clicking the button below!</div>
            )}
            <button type="button" onClick={openCharacterModalForCreate} className="w-full flex items-center justify-center gap-2 border-2 border-zinc-800 bg-zinc-950/50 rounded-lg p-3 text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors">
              <PlusIcon className="w-5 h-5"/>
              Create Character
            </button>
        </FormSection>

        <div className="flex flex-col items-center gap-4 pt-4">
            <button type="button" onClick={handleSave} className="flex items-center justify-center gap-2 font-semibold bg-sky-600 text-white py-3 px-8 rounded-lg hover:bg-sky-500 transition-all shadow-lg shadow-sky-500/10 transform active:scale-95">
                <CheckIcon className="w-5 h-5"/>
                {initialData ? 'Save Changes' : 'Create Scenario'}
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
