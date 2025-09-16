
import React from 'react';
import { Scenario } from '../types';
import { XIcon } from './icons';

interface StorySettingsModalProps {
  scenario: Scenario;
  onClose: () => void;
}

const DetailSection: React.FC<{title: string; content: string;}> = ({title, content}) => (
    <div>
        <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-slate-300 whitespace-pre-wrap">{content || 'N/A'}</p>
    </div>
);

const StorySettingsModal: React.FC<StorySettingsModalProps> = ({ scenario, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-2xl h-[80vh] max-h-[700px] rounded-xl shadow-2xl flex flex-col border border-slate-700"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-purple-400">Scenario Details</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-slate-700">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <h2 className="text-2xl font-bold text-slate-100">{scenario.name}</h2>
            <div className="flex flex-wrap gap-2">
                {scenario.tags.map(tag => (
                     <span key={tag} className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-600 bg-sky-200">
                        {tag}
                     </span>
                ))}
            </div>
            
            <DetailSection title="Description" content={scenario.description} />
            <DetailSection title="World Details" content={scenario.worldDetails} />
            <DetailSection title="Custom Instructions for AI" content={scenario.customInstructions} />
            
        </div>
      </div>
    </div>
  );
};

export default StorySettingsModal;
