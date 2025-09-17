import React from 'react';
import { XIcon, ChevronRightIcon, ArrowLeftIcon } from './icons';

type ResponseLength = 'Long' | 'Medium' | 'Short';

interface StorySettings {
  responseLength: ResponseLength;
  streamTextResponses: boolean;
  showResponseSuggestions: boolean;
  customLlmInstructions: string;
  model: string;
}

interface StorySettingsModalProps {
  onClose: () => void;
  settings: StorySettings;
  onSettingsChange: (field: keyof StorySettings, value: any) => void;
  onEditCharacter: () => void;
  onViewMemoryBank: () => void;
}

const SettingsSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1">{title}</h3>
    {children}
  </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500 ${enabled ? 'bg-orange-500' : 'bg-slate-700'}`}
    aria-checked={enabled}
  >
    <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);


const StorySettingsModal: React.FC<StorySettingsModalProps> = ({ onClose, settings, onSettingsChange, onEditCharacter, onViewMemoryBank }) => {

  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 300) {
      onSettingsChange('customLlmInstructions', e.target.value);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex justify-end"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm h-full bg-[#202123] text-slate-200 flex flex-col animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-700">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Settings</h2>
          <div className="w-9"></div>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          <SettingsSection title="Response Length">
            <div className="flex items-center bg-[#2A2B2E] rounded-lg p-1">
              {(['Long', 'Medium', 'Short'] as ResponseLength[]).map(length => (
                <button
                  key={length}
                  onClick={() => onSettingsChange('responseLength', length)}
                  className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${settings.responseLength === length ? 'bg-slate-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                >
                  {length}
                </button>
              ))}
            </div>
          </SettingsSection>
          
          <SettingsSection title="LLM Model Selection">
            <div className="bg-[#2A2B2E] rounded-lg p-1">
              <select
                value={settings.model}
                onChange={(e) => onSettingsChange('model', e.target.value)}
                className="w-full bg-[#2A2B2E] border-none rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-white appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                aria-label="Select Large Language Model"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                {/* Add other models here when available */}
              </select>
            </div>
          </SettingsSection>

          <SettingsSection title="Story & Memory Cards">
             <button onClick={onViewMemoryBank} className="w-full bg-[#2A2B2E] rounded-lg p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                <span className="font-semibold">View Memory Bank</span>
                <ChevronRightIcon className="w-6 h-6 text-slate-400" />
            </button>
          </SettingsSection>

          <SettingsSection title="Other Settings" className="bg-[#2A2B2E] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="stream-toggle" className="font-semibold pr-4">Stream Text Responses</label>
                <ToggleSwitch enabled={settings.streamTextResponses} onChange={(val) => onSettingsChange('streamTextResponses', val)} />
              </div>
              <div className="w-full h-px bg-slate-700/50"></div>
              <div className="flex items-center justify-between">
                <label htmlFor="suggestions-toggle" className="font-semibold pr-4">Show Response Suggestions</label>
                <ToggleSwitch enabled={settings.showResponseSuggestions} onChange={(val) => onSettingsChange('showResponseSuggestions', val)} />
              </div>
          </SettingsSection>

          <SettingsSection title="Edit User Character">
            <button onClick={onEditCharacter} className="w-full bg-[#2A2B2E] rounded-lg p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                <span className="font-semibold">Edit Character</span>
                <ChevronRightIcon className="w-6 h-6 text-slate-400" />
            </button>
          </SettingsSection>

          <SettingsSection title="Custom LLM Instructions">
            <div className="relative">
                <textarea
                  value={settings.customLlmInstructions}
                  onChange={handleCustomInstructionsChange}
                  placeholder="You can put custom instructions for the AI here!&#10;Ex. Emma has a secret key that allows her to escape."
                  className="w-full bg-[#2A2B2E] rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors placeholder:text-slate-500"
                  maxLength={300}
                />
                <span className="absolute bottom-2 right-2 text-xs text-slate-500">
                    {settings.customLlmInstructions.length} / 300
                </span>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};

export default StorySettingsModal;
