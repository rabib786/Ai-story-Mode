import React from 'react';
import { Scenario } from '../types';
import { Trash2Icon, BookOpenIcon, PlusIcon } from './icons';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  onStartCreation: () => void;
  onDeleteScenario: (scenarioId: string) => void;
}

const ScenarioCard = React.memo(({ scenario, onSelect, onDelete }: { scenario: Scenario; onSelect: (scenario: Scenario) => void; onDelete: (id: string) => void; }) => (
  <div
    className="relative rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer transform hover:-translate-y-1 transition-transform duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 aspect-[4/3]"
    onClick={() => onSelect(scenario)}
  >
    {scenario.image ? 
        <img src={scenario.image} alt={scenario.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      : <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center"><BookOpenIcon className="w-16 h-16 text-zinc-700"/></div>
    }

    <div className="relative z-10 flex flex-col justify-end h-full p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
      {scenario.characters && scenario.characters.length > 0 && (
          <div className="flex items-center mb-3">
              {scenario.characters.slice(0, 4).map((char, index) => (
                  char.portrait && (
                      <img
                          key={index}
                          src={char.portrait}
                          alt={char.name}
                          className={`w-10 h-10 rounded-full object-cover border-2 border-black/50 ${index > 0 ? '-ml-3' : ''}`}
                          title={char.name}
                          crossOrigin="anonymous" referrerPolicy="no-referrer"
                      />
                  )
              ))}
          </div>
      )}
      <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{scenario.name}</h3>
       <div className="flex flex-wrap gap-2 mt-2">
        {scenario.tags.slice(0, 3).map(tag => (
             <span key={tag} className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-200 bg-sky-900/70 backdrop-blur-sm">
                {tag}
             </span>
        ))}
      </div>
      <p className="text-slate-300 mt-2 text-sm line-clamp-2">{scenario.description}</p>
    </div>

     <button
        onClick={(e) => {
            e.stopPropagation(); // Prevent onSelect from firing
            onDelete(scenario.id);
        }}
        title="Delete scenario"
        className="absolute top-3 right-3 z-20 p-1.5 text-slate-200 bg-black/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-black"
    >
        <Trash2Icon className="w-4 h-4" />
    </button>
  </div>
));

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, onSelectScenario, onStartCreation, onDeleteScenario }) => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-scale">
       <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500 bg-[length:200%_auto] animate-text-shimmer">
                Choose Your Adventure
              </h1>
              <p className="text-slate-400 mt-3 max-w-2xl mx-auto">Select a pre-built world crafted for immersive storytelling, or bring your own universe to life.</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onSelect={onSelectScenario}
            onDelete={onDeleteScenario}
          />
        ))}
        <div
            className="rounded-lg p-6 border-2 border-dashed border-zinc-800 hover:border-cyan-500 hover:bg-zinc-950 transition-all duration-300 flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer transform hover:-translate-y-1 group aspect-[4/3]"
            onClick={onStartCreation}
          >
            <div className="w-16 h-16 rounded-full bg-zinc-900 group-hover:bg-cyan-500/10 border border-zinc-800 group-hover:border-cyan-500 flex items-center justify-center transition-colors mb-4">
              <PlusIcon className="w-8 h-8 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 group-hover:text-cyan-400 transition-colors">Create a New World</h3>
            <p className="mt-2 text-slate-400">Define your own characters, setting, and story from scratch.</p>
          </div>
      </div>
    </div>
  );
};

export default ScenarioSelector;