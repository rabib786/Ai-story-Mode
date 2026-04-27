

import React from 'react';
import { XIcon, ChevronRightIcon, ArrowLeftIcon } from './icons';
import { ApiSettings } from '../types';
import { LLM_PROVIDER_CONFIG } from '../constants/llmProviders';

type ResponseLength = 'Long' | 'Medium' | 'Short';

interface StorySettings {
  responseLength: ResponseLength;
  showResponseSuggestions: boolean;
  customLlmInstructions: string;
  model: string;
  enableTTS: boolean;
}

interface StorySettingsModalProps {
  onClose: () => void;
  settings: StorySettings;
  onSettingsChange: (field: keyof StorySettings, value: any) => void;
  apiSettings: ApiSettings;
  onApiSettingsChange: (field: keyof ApiSettings, value: ApiSettings[keyof ApiSettings]) => void;
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
    className={`relative inline-flex items-center h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-sky-500 ${enabled ? 'bg-sky-500' : 'bg-zinc-800'}`}
    aria-checked={enabled}
  >
    <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);


const StorySettingsModal: React.FC<StorySettingsModalProps> = ({ onClose, settings, onSettingsChange, apiSettings, onApiSettingsChange, onEditCharacter, onViewMemoryBank }) => {
  const providerConfig = LLM_PROVIDER_CONFIG[apiSettings.provider];
  const providerEntries = Object.entries(LLM_PROVIDER_CONFIG) as Array<[ApiSettings['provider'], typeof providerConfig]>;
  const modelOptions = apiSettings.provider === 'gemini'
    ? providerConfig.modelOptions
    : (providerConfig.modelOptions.length > 0 ? providerConfig.modelOptions : [apiSettings.openAiCompatibleModel]);

  const handleCustomInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 300) {
      onSettingsChange('customLlmInstructions', e.target.value);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex justify-end animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm h-full bg-black/80 backdrop-blur-xl text-slate-200 flex flex-col animate-slide-in-right border-l border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-zinc-900">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold">Settings</h2>
          <div className="w-9"></div>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
          <SettingsSection title="Response Length">
            <div className="flex items-center bg-zinc-950 rounded-lg p-1">
              {(['Long', 'Medium', 'Short'] as ResponseLength[]).map(length => (
                <button
                  key={length}
                  onClick={() => onSettingsChange('responseLength', length)}
                  className={`w-full py-2 rounded-md text-sm font-semibold transition-colors ${settings.responseLength === length ? 'bg-zinc-800 text-white' : 'text-slate-300 hover:bg-zinc-900'}`}
                >
                  {length}
                </button>
              ))}
            </div>
          </SettingsSection>
          
          <SettingsSection title="LLM Model Selection">
            <div className="bg-zinc-950 rounded-lg p-1">
              <select
                value={apiSettings.provider === 'gemini' ? apiSettings.geminiModel : apiSettings.openAiCompatibleModel}
                onChange={(e) => {
                  if (apiSettings.provider === 'gemini') {
                    onApiSettingsChange('geminiModel', e.target.value);
                    onSettingsChange('model', e.target.value);
                  } else {
                    onApiSettingsChange('openAiCompatibleModel', e.target.value);
                    onSettingsChange('model', e.target.value);
                  }
                }}
                className="w-full bg-zinc-950 border-none rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors text-white appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                aria-label="Select Large Language Model"
              >
                {modelOptions.map(model => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          </SettingsSection>

          <SettingsSection title="API Configuration">
            <div className="bg-zinc-950 rounded-lg p-3 space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Provider</label>
                <select
                  value={apiSettings.provider}
                  onChange={(e) => {
                    const provider = e.target.value as ApiSettings['provider'];
                    const config = LLM_PROVIDER_CONFIG[provider];
                    onApiSettingsChange('provider', provider);
                    if (provider !== 'gemini') {
                      onApiSettingsChange('openAiCompatibleBaseUrl', config.defaultBaseUrl || apiSettings.openAiCompatibleBaseUrl);
                      onApiSettingsChange('openAiCompatibleModel', config.defaultModel);
                      onSettingsChange('model', config.defaultModel);
                    } else {
                      onApiSettingsChange('geminiModel', config.defaultModel);
                      onSettingsChange('model', config.defaultModel);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors text-white"
                >
                  {providerEntries.map(([providerKey, config]) => (
                    <option key={providerKey} value={providerKey}>{config.label}</option>
                  ))}
                </select>
                {providerConfig.description && (
                  <p className="text-xs text-slate-500 mt-1">{providerConfig.description}</p>
                )}
              </div>

              {apiSettings.provider === 'gemini' ? (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Gemini API Key</label>
                  <input
                    type="password"
                    value={apiSettings.geminiApiKey}
                    onChange={(e) => onApiSettingsChange('geminiApiKey', e.target.value)}
                    placeholder="Leave blank to use .env key"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Base URL</label>
                    <input
                      type="text"
                      value={apiSettings.openAiCompatibleBaseUrl}
                      onChange={(e) => onApiSettingsChange('openAiCompatibleBaseUrl', e.target.value)}
                      placeholder={providerConfig.defaultBaseUrl || 'https://api.openai.com/v1'}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                      disabled={apiSettings.provider !== 'custom'}
                    />
                  </div>
                  {providerConfig.requiresApiKey && <div>
                    <label className="text-xs text-slate-400 mb-1 block">API Key</label>
                    <input
                      type="password"
                      value={apiSettings.openAiCompatibleApiKey}
                      onChange={(e) => onApiSettingsChange('openAiCompatibleApiKey', e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                    />
                  </div>}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Model</label>
                    <input
                      type="text"
                      value={apiSettings.openAiCompatibleModel}
                      onChange={(e) => onApiSettingsChange('openAiCompatibleModel', e.target.value)}
                      placeholder="gpt-4o-mini"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          </SettingsSection>

          <SettingsSection title="Story & Memory Cards">
             <button onClick={onViewMemoryBank} className="w-full bg-zinc-950 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors">
                <span className="font-semibold">View Memory Bank</span>
                <ChevronRightIcon className="w-6 h-6 text-slate-400" />
            </button>
          </SettingsSection>

          <SettingsSection title="Other Settings" className="bg-zinc-950 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="suggestions-toggle" className="font-semibold pr-4">Show Response Suggestions</label>
                <ToggleSwitch enabled={settings.showResponseSuggestions} onChange={(val) => onSettingsChange('showResponseSuggestions', val)} />
              </div>
              <div className="w-full h-px bg-zinc-800/50"></div>
              <div className="flex items-center justify-between">
                <label htmlFor="tts-toggle" className="font-semibold pr-4">Enable Text-to-Speech</label>
                <ToggleSwitch enabled={settings.enableTTS} onChange={(val) => onSettingsChange('enableTTS', val)} />
              </div>
          </SettingsSection>

          <SettingsSection title="Edit User Character">
            <button onClick={onEditCharacter} className="w-full bg-zinc-950 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-900 transition-colors">
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
                  className="w-full bg-zinc-950 rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors placeholder:text-slate-500"
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
