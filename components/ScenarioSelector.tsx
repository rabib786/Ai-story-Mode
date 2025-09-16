
import React from 'react';
import { Scenario } from '../types';
import { Trash2Icon } from './icons';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  onStartCreation: () => void;
  onDeleteScenario: (scenarioName: string) => void;
}

const ScenarioCard: React.FC<{ scenario: Scenario; onSelect: () => void; onDelete: () => void; }> = ({ scenario, onSelect, onDelete }) => (
  <div
    className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700/50 border border-slate-700 hover:border-purple-500 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative"
    onClick={onSelect}
  >
    <div>
      <h3 className="text-xl font-bold text-purple-400">{scenario.name}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {scenario.tags.slice(0, 3).map(tag => (
             <span key={tag} className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-600 bg-sky-200">
                {tag}
             </span>
        ))}
      </div>
      <p className="text-slate-400 mt-2">{scenario.description}</p>
    </div>
    <button className="mt-4 text-left font-semibold text-sky-400 hover:text-sky-300 transition-colors">
      Start Adventure &rarr;
    </button>
     <button
        onClick={(e) => {
            e.stopPropagation(); // Prevent onSelect from firing
            onDelete();
        }}
        title="Delete scenario"
        className="absolute top-2 right-2 p-1.5 text-slate-200 bg-black/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-slate-700/80"
    >
        <Trash2Icon className="w-4 h-4" />
    </button>
  </div>
);

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ scenarios, onSelectScenario, onStartCreation, onDeleteScenario }) => {
  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
       <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
                Story Mode AI
              </h1>
              <p className="text-slate-400 mt-2">Your interactive adventure awaits. Select a pre-built world or create your own.</p>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.name}
            scenario={scenario}
            onSelect={() => onSelectScenario(scenario)}
            onDelete={() => onDeleteScenario(scenario.name)}
          />
        ))}
        <div
            className="bg-slate-800/50 rounded-lg p-6 border-2 border-dashed border-slate-700 hover:border-sky-500 transition-all duration-300 flex flex-col items-center justify-center text-center text-slate-500 cursor-pointer"
            onClick={onStartCreation}
          >
            <h3 className="text-xl font-bold text-slate-400">Create Your Own</h3>
            <p className="mt-2">Define your own world and story.</p>
          </div>
      </div>
    </div>
  );
};

export default ScenarioSelector;
