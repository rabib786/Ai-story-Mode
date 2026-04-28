import React, { useState, useEffect } from 'react';
import { ApiSettings, ApiProvider } from '../types';
import { LLM_PROVIDER_CONFIG } from '../constants/llmProviders';
import { validateProvider } from '../services/apiUtils';
import { SettingsIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon, ShieldCheckIcon } from './icons';

interface SetupWizardProps {
  onComplete: (settings: ApiSettings) => void;
  initialSettings: ApiSettings;
  onSkip?: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, initialSettings, onSkip }) => {
  const [settings, setSettings] = useState<ApiSettings>(initialSettings);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const providerConfig = LLM_PROVIDER_CONFIG[settings.provider];
  const providerEntries = Object.entries(LLM_PROVIDER_CONFIG) as Array<[ApiProvider, typeof providerConfig]>;

  const handleProviderChange = (provider: ApiProvider) => {
    const config = LLM_PROVIDER_CONFIG[provider];
    const newSettings = { ...settings, provider };
    if (provider !== 'gemini') {
        newSettings.openAiCompatibleBaseUrl = config.defaultBaseUrl || '';
        newSettings.openAiCompatibleModel = config.defaultModel;
    } else {
        newSettings.geminiModel = config.defaultModel;
    }
    setSettings(newSettings);
    setValidationState('idle');
    setErrorMessage('');
  };

  const handleValidateAndContinue = async () => {
    setValidationState('validating');
    setErrorMessage('');

    const { isValid, error } = await validateProvider(settings);

    if (isValid) {
        setValidationState('success');
        setTimeout(() => {
            onComplete(settings);
        }, 1000);
    } else {
        setValidationState('error');
        setErrorMessage(error || 'Validation failed.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mb-4">
                 <ShieldCheckIcon className="w-8 h-8 text-sky-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Story Mode AI</h2>
            <p className="text-slate-400">Let's set up your AI provider to get started.</p>
        </div>

        <div className="space-y-6">
            <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Select AI Provider</label>
                <select
                    value={settings.provider}
                    onChange={(e) => handleProviderChange(e.target.value as ApiProvider)}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                >
                    <optgroup label="Recommended">
                        <option value="gemini">Gemini API (Fast & Reliable)</option>
                        <option value="openrouter">OpenRouter (Free Models Available)</option>
                    </optgroup>
                    <optgroup label="Local / Free (No Key Required)">
                        <option value="pollinations">Pollinations (Hosted Free)</option>
                        <option value="lmstudio">LM Studio (Local)</option>
                        <option value="ollama">Ollama (Local)</option>
                    </optgroup>
                    <optgroup label="Other Providers">
                        {providerEntries.filter(([k]) => !['gemini', 'openrouter', 'pollinations', 'lmstudio', 'ollama'].includes(k)).map(([k, c]) => (
                             <option key={k} value={k}>{c.label}</option>
                        ))}
                    </optgroup>
                </select>
                {providerConfig.description && (
                    <p className="text-sm text-slate-500 mt-2">{providerConfig.description}</p>
                )}
            </div>

            {settings.provider === 'gemini' ? (
                <div>
                     <label className="text-sm font-semibold text-slate-300 mb-2 block">Gemini API Key</label>
                     <input
                        type="password"
                        value={settings.geminiApiKey}
                        onChange={(e) => { setSettings({...settings, geminiApiKey: e.target.value}); setValidationState('idle'); }}
                        placeholder="AIzaSy..."
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                     />
                     <p className="text-xs text-slate-500 mt-2">Get a free key from Google AI Studio.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {providerConfig.requiresApiKey && (
                        <div>
                            <label className="text-sm font-semibold text-slate-300 mb-2 block">API Key</label>
                            <input
                                type="password"
                                value={settings.openAiCompatibleApiKey}
                                onChange={(e) => { setSettings({...settings, openAiCompatibleApiKey: e.target.value}); setValidationState('idle'); }}
                                placeholder="sk-..."
                                className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-semibold text-slate-300 mb-2 block">Base URL</label>
                        <input
                            type="text"
                            value={settings.openAiCompatibleBaseUrl}
                            onChange={(e) => { setSettings({...settings, openAiCompatibleBaseUrl: e.target.value}); setValidationState('idle'); }}
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                        />
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
                    <XCircleIcon className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
                <button
                    onClick={handleValidateAndContinue}
                    disabled={validationState === 'validating'}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {validationState === 'validating' ? 'Checking...' : validationState === 'success' ? 'Ready!' : 'Continue'}
                    {validationState === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <ArrowRightIcon className="w-5 h-5" />}
                </button>

                {onSkip && (
                    <button onClick={onSkip} className="w-full text-slate-400 hover:text-white py-2 text-sm transition-colors">
                        Skip for now
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
