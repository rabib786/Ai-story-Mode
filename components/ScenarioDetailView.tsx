

import React, { useState } from 'react';
import { Scenario, ScenarioCharacter } from '../types';
import { ArrowLeftIcon, BookOpenIcon, UsersIcon, ClipboardListIcon, ChevronDownIcon, PlayIcon, Wand2Icon, Trash2Icon, UserIcon } from './icons';

interface ScenarioDetailViewProps {
  scenario: Scenario;
  onStart: () => void;
  onCustomize: () => void;
  onBack: () => void;
  onDelete: () => void;
}

const SectionAccordion: React.FC<{
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon: Icon, isOpen, onToggle, children }) => (
  <div className="border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-900 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-sky-400" />
        <h3 className="font-semibold text-slate-200">{title}</h3>
      </div>
      <ChevronDownIcon
        className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
    {isOpen && (
      <div className="p-4 border-t border-zinc-800 bg-black animate-fade-in">
        {children}
      </div>
    )}
  </div>
);

const CharacterInfoCard: React.FC<{ character: ScenarioCharacter }> = ({ character }) => (
    <div className="flex items-start gap-4 p-3 bg-zinc-900/50 rounded-lg">
        {character.portrait ? 
          <img src={character.portrait} alt={character.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" crossOrigin="anonymous" referrerPolicy="no-referrer" />
         : <div className="w-16 h-16 rounded-md bg-black flex items-center justify-center flex-shrink-0"><UserIcon className="w-8 h-8 text-zinc-700" /></div>
        }
        <div className="w-full min-w-0">
            <h4 className="font-bold text-cyan-400">{character.name}</h4>
            <p className="text-sm italic text-slate-400 mb-2">{character.role}</p>
            <div className="text-sm text-slate-300 prose prose-sm prose-invert max-w-none whitespace-pre-wrap break-words">
                <p><strong>Personality:</strong> {character.personality}</p>
                {character.backstory && <p><strong>Backstory:</strong> {character.backstory}</p>}
            </div>
        </div>
    </div>
);


const ScenarioDetailView: React.FC<ScenarioDetailViewProps> = ({ scenario, onStart, onCustomize, onBack, onDelete }) => {
    const [openSection, setOpenSection] = useState<string | null>('details');

    const toggleSection = (sectionName: string) => {
        setOpenSection(prev => (prev === sectionName ? null : sectionName));
    };

  return (
    <div className="w-full h-full flex flex-col items-center">
        <div className="w-full max-w-4xl p-0 sm:p-4 h-full flex flex-col">
             <button onClick={onBack} className="flex-shrink-0 flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors mb-4 p-2 rounded-lg hover:bg-zinc-900/50 self-start">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back to Scenarios</span>
            </button>
            <div className="w-full flex-grow rounded-t-lg no-scrollbar overflow-y-auto">
                <div className="relative h-64 w-full rounded-t-lg overflow-hidden">
                    <img src={scenario.image || 'https://source.unsplash.com/random/1200x400?fantasy,scifi'} alt={scenario.name} className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{scenario.name}</h1>
                        <div className="flex flex-wrap gap-2 mt-3">
                           {scenario.tags.map(tag => (
                                <span key={tag} className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-200 bg-sky-900/70 backdrop-blur-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-black p-4 space-y-4">
                    <p className="text-slate-300 leading-relaxed">{scenario.description}</p>
                    
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 pt-2">
                        <button onClick={onStart} className="col-span-2 sm:flex-grow flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 transform active:scale-95 shadow-lg shadow-sky-900/50">
                            <PlayIcon className="w-5 h-5"/>
                            Start Scenario
                        </button>
                         <button onClick={onCustomize} className="sm:flex-shrink-0 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-bold py-3 px-4 rounded-lg transition-colors duration-300 transform active:scale-95">
                            <Wand2Icon className="w-5 h-5"/>
                           Customize
                        </button>
                        <button onClick={onDelete} title="Delete Scenario" className="sm:flex-shrink-0 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 font-bold py-3 px-4 rounded-lg transition-colors duration-300 transform active:scale-95">
                            <Trash2Icon className="w-5 h-5"/>
                        </button>
                    </div>

                    <div className="pt-4 space-y-3">
                         <SectionAccordion title="Scenario/World Details" icon={BookOpenIcon} isOpen={openSection === 'details'} onToggle={() => toggleSection('details')}>
                            <div className="text-slate-400 prose prose-invert prose-sm max-w-none whitespace-pre-wrap break-words">
                                {scenario.worldDetails}
                            </div>
                        </SectionAccordion>

                         <SectionAccordion title="Scenario Characters" icon={UsersIcon} isOpen={openSection === 'characters'} onToggle={() => toggleSection('characters')}>
                            <div className="space-y-4">
                                {scenario.characters.map((char, index) => <CharacterInfoCard key={index} character={char} />)}
                                 <div className="flex items-start gap-4 p-3 bg-zinc-900/50 rounded-lg">
                                    <div className="w-16 h-16 rounded-md bg-black flex items-center justify-center flex-shrink-0 border-2 border-dashed border-zinc-700">
                                        <UsersIcon className="w-8 h-8 text-zinc-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-cyan-400">Your Character</h4>
                                        <p className="text-sm text-slate-400">You will select or create your own character to play as when you start the scenario.</p>
                                    </div>
                                </div>
                            </div>
                        </SectionAccordion>

                         <SectionAccordion title="Scenario Instructions" icon={ClipboardListIcon} isOpen={openSection === 'instructions'} onToggle={() => toggleSection('instructions')}>
                            <div className="text-slate-400 prose prose-invert prose-sm max-w-none whitespace-pre-wrap break-words">
                                {scenario.customInstructions}
                            </div>
                        </SectionAccordion>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ScenarioDetailView;