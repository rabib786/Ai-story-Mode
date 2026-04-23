import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ActiveChat, ModelResponsePart, UserCharacter, Scenario, ApiSettings } from '../types';
import { generateStoryPart } from '../services/geminiService';
import { parseApiResponse, parseNarrative } from '../services/storyUtils';
import { type GenerateContentResponse } from '@google/genai';
import { SendIcon, ArrowLeftIcon, RefreshCwIcon, SettingsIcon, EyeIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon, LightbulbIcon, UserIcon, Volume2Icon, StopCircleIcon, ChevronsRightIcon, Trash2Icon, Undo2Icon, MoreHorizontalIcon } from './icons';
import { CHAT_HISTORY_PREFIX, API_SETTINGS_KEY } from '../constants/storageKeys';
import StorySettingsModal from './StorySettingsModal';
import CharacterCreation from './CharacterCreation';
import MemoryBankModal from './MemoryBankModal';
import ConfirmationModal from './ConfirmationModal';
import DynamicBackground from './DynamicBackground';

interface StoryViewProps {
  chat: ActiveChat;
  onExit: (finalMemoryBank: string[]) => void;
  onUpdateUserCharacter: (chatId: string, updatedCharacter: UserCharacter) => void;
}

type ResponseLength = 'Long' | 'Medium' | 'Short';

interface StorySettings {
  responseLength: ResponseLength;
  showResponseSuggestions: boolean;
  customLlmInstructions: string;
  model: string;
  enableTTS: boolean;
}

const defaultApiSettings: ApiSettings = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openAiCompatibleApiKey: '',
  openAiCompatibleBaseUrl: 'https://api.openai.com/v1',
  openAiCompatibleModel: 'gpt-4o-mini',
};

interface ConfirmationState {
  title: string;
  message: string;
  onConfirm: () => void;
}

const emptyPart: ModelResponsePart = { narrative: '', suggestedActions: [] };
const errorNarrative = `<i class="text-red-400 text-center block w-full">Sorry, the AI failed to respond. Please try regenerating or rewinding.</i>`;



const UserMessageBubble = React.memo(({
    message,
    character,
    onEditCharacter,
}: {
    message: ChatMessage;
    character: UserCharacter;
    onEditCharacter: () => void;
}) => (
    <div className="flex justify-end items-start gap-2 my-2 animate-slide-in-up group">
        <div className="max-w-[85%] sm:max-w-xl bg-gradient-to-tr from-sky-600 to-cyan-700 border border-sky-500/30 rounded-2xl rounded-br-lg p-3 sm:p-4 shadow-lg shadow-sky-900/50 group-hover:brightness-110 transition-all duration-300">
            <p className="text-white whitespace-pre-wrap">{message.text}</p>
        </div>
         <button onClick={onEditCharacter} title="Edit your character">
             {character.portrait ?
                <img src={character.portrait} alt="You" className="w-10 h-10 rounded-full flex-shrink-0 hover:ring-2 ring-sky-400 transition-all" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                : <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 hover:ring-2 ring-sky-400 transition-all"><UserIcon className="w-6 h-6 text-slate-400" /></div>
            }
         </button>
    </div>
));

interface ModelMessageBubbleProps {
    message: ChatMessage;
    scenario: Scenario;
    isLoading: boolean;
    isSpeaking: boolean;
    isActionable: boolean;
    hasUserMessages: boolean;
    onChangePart: (direction: 'next' | 'prev') => void;
    onPlayTTS: (messageId: string, text: string) => void;
    enableTTS: boolean;
    onRewind: () => void;
    onRegenerate: () => void;
    onContinue: () => void;
    onDeleteLastResponse: () => void;
}


const ModelMessageBubble = React.memo(({
    message,
    scenario,
    isLoading,
    isSpeaking,
    isActionable,
    hasUserMessages,
    onChangePart,
    onPlayTTS,
    enableTTS,
    onRewind,
    onRegenerate,
    onContinue,
    onDeleteLastResponse,
}: ModelMessageBubbleProps) => {
    const currentPart = message.parts ? message.parts[message.currentPartIndex] : null;
    const narrativeToRender = currentPart?.narrative || '';
    const isSystemMessage = narrativeToRender.startsWith('<i class');
    
    return (
        <div 
            className="flex items-start gap-3 my-2 animate-slide-in-up"
        >
            {/* If it's a system message, don't show the avatar */}
            {message.type === 'system' ? <div className="w-10 flex-shrink-0" /> : <img src={scenario.image || `https://source.unsplash.com/random/40x40?${scenario.tags[0]}`} alt="Scenario" className="w-10 h-10 rounded-full flex-shrink-0" loading="lazy" crossOrigin="anonymous" referrerPolicy="no-referrer" /> }
            <div className="flex-grow flex flex-col items-start">
                <div className="w-full max-w-[95%] sm:max-w-3xl leading-relaxed text-slate-300 prose prose-invert prose-p:text-slate-300 bg-zinc-900 border border-zinc-800 p-3 sm:p-4 rounded-2xl rounded-bl-lg transition-all duration-300">
                    {narrativeToRender ? (
                        isSystemMessage ? (
                          <div dangerouslySetInnerHTML={{ __html: narrativeToRender }} />
                        ) : (
                          <p>
                            {parseNarrative(narrativeToRender).map((part, index) =>
                              part.type === 'dialogue' ? (
                                <span key={index} className="text-sky-300 font-semibold italic">"{part.content}"</span>
                              ) : (
                                <React.Fragment key={index}>{part.content}</React.Fragment>
                              )
                            )}
                          </p>
                        )
                    ) : (
                      isLoading && (
                        <div className="flex items-center text-sm text-slate-400">
                            <MoreHorizontalIcon className="w-5 h-5 mr-1 animate-dot-pulse" />
                        </div>
                      )
                    )}
                </div>
                 {/* Toolbar */}
                {isActionable && !isLoading && message.type !== 'system' && (
                    <div className="mt-1.5 transition-opacity duration-300">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-full p-1 flex items-center gap-1">
                            {/* Original buttons */}
                            {enableTTS && narrativeToRender && (
                                <button onClick={() => onPlayTTS(message.id, narrativeToRender)} title={isSpeaking ? "Stop" : "Read aloud"} className={`p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-800 ${isSpeaking ? 'text-sky-400' : ''}`}>
                                    {isSpeaking ? <StopCircleIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
                                </button>
                            )}
                            {message.parts && message.parts.length > 1 && (
                                <>
                                    {enableTTS && narrativeToRender && <div className="w-px h-4 bg-zinc-700 mx-1"></div>}
                                    <button onClick={() => onChangePart('prev')} className="p-1 rounded-full hover:bg-zinc-800 text-slate-400"><ChevronLeftIcon className="w-5 h-5"/></button>
                                    <span className="text-xs text-zinc-400 w-8 text-center">{message.currentPartIndex + 1}/{message.parts.length}</span>
                                    <button onClick={() => onChangePart('next')} className="p-1 rounded-full hover:bg-zinc-800 text-slate-400"><ChevronRightIcon className="w-5 h-5"/></button>
                                </>
                            )}
                
                            {/* Divider */}
                            {((enableTTS && narrativeToRender) || (message.parts && message.parts.length > 1)) && (
                                 <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                            )}
                            
                            {/* New action buttons */}
                            <button onClick={onRewind} disabled={!hasUserMessages} title="Rewind" className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed">
                                <Undo2Icon className="w-4 h-4" />
                            </button>
                            <button onClick={onRegenerate} title="Regenerate" className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-800">
                                <RefreshCwIcon className="w-4 h-4" />
                            </button>
                            <button onClick={onContinue} title="Continue Story" className="p-1.5 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-zinc-800">
                                <ChevronsRightIcon className="w-4 h-4" />
                            </button>
                            <button onClick={onDeleteLastResponse} title="Delete Last Response" className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-full hover:bg-zinc-800">
                                <Trash2Icon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});


const StoryView: React.FC<StoryViewProps> = ({ chat, onExit, onUpdateUserCharacter }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memoryBank, setMemoryBank] = useState<string[]>(chat.memoryBank);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isCharacterModalOpen, setCharacterModalOpen] = useState(false);
  const [isMemoryBankModalOpen, setMemoryBankModalOpen] = useState(false);
  const [settings, setSettings] = useState<StorySettings>({
    responseLength: 'Medium',
    showResponseSuggestions: !chat.scenario.hideScenarioPrompts,
    customLlmInstructions: '',
    model: 'gemini-2.5-flash',
    enableTTS: false,
  });
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    try {
      const raw = localStorage.getItem(API_SETTINGS_KEY);
      return raw ? { ...defaultApiSettings, ...JSON.parse(raw) } : defaultApiSettings;
    } catch (error) {
      console.error("Failed to parse API settings:", error);
      return defaultApiSettings;
    }
  });
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [dominantEmotion, setDominantEmotion] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevSettingsRef = useRef<StorySettings>();
  const prevUserCharacterRef = useRef<UserCharacter>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const recalculateMemoryBankFromHistory = useCallback((history: ChatMessage[]): string[] => {
      const memories = new Set<string>(); // Always start fresh
      history.forEach(msg => {
          if (msg.role === 'model' && msg.type !== 'system' && msg.parts && msg.parts.length > 0) {
              const currentPart = msg.parts[msg.currentPartIndex];
              if (currentPart?.memoryAdditions) {
                  currentPart.memoryAdditions.forEach(mem => memories.add(mem));
              }
          }
      });
      return Array.from(memories);
  }, []);

  // Effect for showing system messages when settings or character change.
  useEffect(() => {
    const prevSettings = prevSettingsRef.current;
    if (prevSettings) {
      const settingsChanged = prevSettings.responseLength !== settings.responseLength ||
                              prevSettings.customLlmInstructions !== settings.customLlmInstructions ||
                              prevSettings.model !== settings.model;
      if (settingsChanged) {
        const systemMessage: ChatMessage = {
          id: `system-settings-${Date.now()}`,
          role: 'model', type: 'system',
          parts: [{ narrative: `<i class="text-slate-400 text-center block w-full">Settings updated.</i>`, suggestedActions: [] }],
          currentPartIndex: 0,
        };
        setChatHistory(prev => [...prev, systemMessage]);
      }
    }
    prevSettingsRef.current = settings;

    const prevUserCharacter = prevUserCharacterRef.current;
    if (prevUserCharacter && JSON.stringify(prevUserCharacter) !== JSON.stringify(chat.userCharacter)) {
        const systemMessage: ChatMessage = {
            id: `system-char-${Date.now()}`,
            role: 'model', type: 'system',
            parts: [{ narrative: `<i class="text-slate-400 text-center block w-full">Character updated to ${chat.userCharacter.name}.</i>`, suggestedActions: [] }],
            currentPartIndex: 0,
        };
        setChatHistory(prev => [...prev, systemMessage]);
    }
    prevUserCharacterRef.current = chat.userCharacter;
  }, [settings, chat.userCharacter]);

  
  const handleApiError = (messageId: string, error?: any) => {
     if (error) console.error("API Error:", error);
     setChatHistory(prev => {
        const messageIndex = prev.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return prev;
        const updatedHistory = [...prev];
        updatedHistory[messageIndex] = { 
            ...prev[messageIndex], 
            type: 'error', 
            parts: [{ narrative: errorNarrative, suggestedActions: [] }], 
            currentPartIndex: 0 
        };
        return updatedHistory;
     });
  };

 const initializeStory = useCallback(async () => {
    setIsLoading(true);
    let savedHistory: ChatMessage[] = [];
    try {
        const savedHistoryRaw = localStorage.getItem(`${CHAT_HISTORY_PREFIX}${chat.id}`);
        savedHistory = savedHistoryRaw ? JSON.parse(savedHistoryRaw) : [];
    } catch (error) {
        console.error("Failed to parse chat history:", error);
        localStorage.removeItem(`${CHAT_HISTORY_PREFIX}${chat.id}`);
    }
    
    prevSettingsRef.current = settings;
    prevUserCharacterRef.current = chat.userCharacter;
    
    if (savedHistory.length > 0) {
      setChatHistory(savedHistory);
      setMemoryBank(recalculateMemoryBankFromHistory(savedHistory));
      setIsLoading(false);
    } else {
      setChatHistory([]);
      
      if (chat.scenario.greetingMessage) {
        const greetingPart: ModelResponsePart = {
          narrative: chat.scenario.greetingMessage.replace(/{{user}}/gi, chat.userCharacter.name),
          suggestedActions: [],
          memoryAdditions: [],
          dominantEmotion: 'neutral',
        };
        const greetingMessage: ChatMessage = {
          id: `model-greeting-${Date.now()}`,
          role: 'model',
          parts: [greetingPart],
          currentPartIndex: 0,
        };
        setChatHistory([greetingMessage]);
        setIsLoading(false);
      } else {
        const messageId = `model-${Date.now()}`;
        setChatHistory([{ id: messageId, role: 'model', parts: [emptyPart], currentPartIndex: 0 }]);
        
        try {
          const response = await generateStoryPart(chat.scenario, chat.userCharacter, [], chat.memoryBank, "Begin the story.", { ...settings, apiSettings });
          const finalPart = parseApiResponse(response);

          if (finalPart) {
              setChatHistory(prev => {
                  const updatedHistory = [...prev];
                  const idx = updatedHistory.findIndex(m => m.id === messageId);
                  if (idx > -1) {
                      updatedHistory[idx] = { ...updatedHistory[idx], parts: [finalPart], currentPartIndex: 0 };
                  }
                  const newMemoryBank = recalculateMemoryBankFromHistory(updatedHistory);
                  setMemoryBank(newMemoryBank);
                  return updatedHistory;
              });
          } else {
             handleApiError(messageId, new Error("Failed to parse initial story response"));
          }
        } catch (error) {
            handleApiError(messageId, error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [chat.id, chat.scenario, chat.userCharacter, recalculateMemoryBankFromHistory, settings, apiSettings]); 
  
  useEffect(() => {
    initializeStory();
  }, [initializeStory]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [userInput]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`${CHAT_HISTORY_PREFIX}${chat.id}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, chat.id]);
  
  useEffect(() => {
    // This effect syncs the dominant emotion for the background
    // with the currently displayed model message.
    const lastModelMessage = chatHistory.slice().reverse().find(m => m.role === 'model' && m.type !== 'system' && m.type !== 'error');
    if (lastModelMessage && lastModelMessage.parts && lastModelMessage.parts.length > 0) {
      const currentPart = lastModelMessage.parts[lastModelMessage.currentPartIndex];
      if (currentPart && currentPart.dominantEmotion) {
        const emotion = currentPart.dominantEmotion.toLowerCase();
        if (emotion !== 'neutral') {
          setDominantEmotion(emotion);
        } else {
          setDominantEmotion(null); // Set to null for neutral to fade out
        }
      }
    }
  }, [chatHistory]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth < 768;
    const lastMessage = chatHistory[chatHistory.length - 1];
    // Check if the last message is a newly loaded response from the model.
    const isNewModelMessageLoaded = !isLoading && lastMessage && lastMessage.role === 'model' && lastMessage.type !== 'system' && lastMessage.type !== 'error';

    if (isMobile && isNewModelMessageLoaded) {
      // On mobile, after a new AI response arrives, scroll to the TOP of that new message element
      // so the user can start reading from the beginning.
      const lastMessageElement = container.lastElementChild;
      if (lastMessageElement) {
        lastMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // In all other cases (desktop view, user sending a message, AI is thinking),
      // scroll to the very bottom of the chat.
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = (messageText || userInput).trim();
    if (!textToSend || isLoading) return;

    setUserInput('');
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      currentPartIndex: 0,
    };
    const modelMessageId = `model-${Date.now()}`;
    const modelMessagePlaceholder: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      parts: [emptyPart],
      currentPartIndex: 0,
    };

    const newHistory = [...chatHistory, userMessage];
    setChatHistory([...newHistory, modelMessagePlaceholder]);

    try {
      const response = await generateStoryPart(chat.scenario, chat.userCharacter, newHistory, memoryBank, textToSend, { ...settings, apiSettings });
      const finalPart = parseApiResponse(response);
      
      if (finalPart) {
        setChatHistory(prev => {
            const updatedHistory = [...prev];
            const idx = updatedHistory.findIndex(m => m.id === modelMessageId);
            if (idx > -1) {
                updatedHistory[idx] = { ...updatedHistory[idx], parts: [finalPart], currentPartIndex: 0 };
            }
            const newMemoryBank = recalculateMemoryBankFromHistory(updatedHistory);
            setMemoryBank(newMemoryBank);
            return updatedHistory;
        });
      } else {
        handleApiError(modelMessageId, new Error("Failed to parse response"));
      }
    } catch (error) {
        handleApiError(modelMessageId, error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (userInput.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleRegenerate = async () => {
    if (isLoading) return;

    const lastUserMessageIndex = chatHistory.slice().reverse().findIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) {
        return;
    }
    const userMessageIndex = chatHistory.length - 1 - lastUserMessageIndex;
    const userMessage = chatHistory[userMessageIndex];

    const modelMessageIndex = userMessageIndex + 1;
    if (modelMessageIndex >= chatHistory.length || chatHistory[modelMessageIndex].role !== 'model') {
        return;
    }
    
    setIsLoading(true);
    setChatHistory(prev => {
        const historyCopy = [...prev];
        historyCopy[modelMessageIndex] = { ...historyCopy[modelMessageIndex], parts: [emptyPart], currentPartIndex: 0 };
        return historyCopy;
    });

    try {
        const historyForRegen = chatHistory.slice(0, userMessageIndex);
        const memoryForRegen = recalculateMemoryBankFromHistory(historyForRegen);
        const response = await generateStoryPart(chat.scenario, chat.userCharacter, historyForRegen, memoryForRegen, userMessage.text!, { ...settings, apiSettings });
        const newPart = parseApiResponse(response);

        if (newPart) {
            setChatHistory(prev => {
                const updatedHistory = JSON.parse(JSON.stringify(prev));
                const messageToUpdate = updatedHistory[modelMessageIndex];
                
                const existingParts = messageToUpdate.parts?.filter((p: ModelResponsePart) => p.narrative || (p.suggestedActions && p.suggestedActions.length > 0)) || [];
                const newParts = [...existingParts, newPart];
                messageToUpdate.parts = newParts;
                messageToUpdate.currentPartIndex = newParts.length - 1;
                messageToUpdate.type = undefined;

                const newMemoryBank = recalculateMemoryBankFromHistory(updatedHistory);
                setMemoryBank(newMemoryBank);

                return updatedHistory;
            });
        } else {
            throw new Error("Regeneration failed to produce a valid response.");
        }
    } catch (error) {
        handleApiError(chatHistory[modelMessageIndex].id, error);
        const errorMsg: ChatMessage = { 
            id: `system-error-${Date.now()}`, 
            role: 'model', 
            type: 'system', 
            parts: [{ narrative: `<i class="text-amber-400 text-center block w-full">Failed to regenerate. Please try again.</i>`, suggestedActions: []}], 
            currentPartIndex: 0 
        };
        setChatHistory(prev => [...prev, errorMsg]);
        setTimeout(() => setChatHistory(prev => prev.filter(m => m.id !== errorMsg.id)), 4000);
    } finally {
        setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    if (isLoading) return;
    setIsLoading(true);
    const continueInstruction = "(SYSTEM: Continue the story from the last message. Do not write a user action. Simply continue the narrative.)";
    
    const modelMessageId = `model-${Date.now()}`;
    const modelMessagePlaceholder: ChatMessage = {
      id: modelMessageId,
      role: 'model', parts: [emptyPart], currentPartIndex: 0,
    };
    setChatHistory(prev => [...prev, modelMessagePlaceholder]);

    try {
      const response = await generateStoryPart(chat.scenario, chat.userCharacter, chatHistory, memoryBank, continueInstruction, { ...settings, apiSettings });
      const finalPart = parseApiResponse(response);
      
      if (finalPart) {
        setChatHistory(prev => {
            const updatedHistory = [...prev];
            const idx = updatedHistory.findIndex(m => m.id === modelMessageId);
            if (idx > -1) {
                updatedHistory[idx] = { ...updatedHistory[idx], parts: [finalPart], currentPartIndex: 0 };
            }
            const newMemoryBank = recalculateMemoryBankFromHistory(updatedHistory);
            setMemoryBank(newMemoryBank);
            return updatedHistory;
        });
      } else {
        handleApiError(modelMessageId, new Error("Failed to parse response"));
      }
    } catch (error) {
        handleApiError(modelMessageId, error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleRewind = useCallback(() => {
    if (isLoading) return;

    setConfirmation({
        title: "Rewind Last Action",
        message: "This will remove your last action and the AI's response. Are you sure you want to proceed?",
        onConfirm: () => {
            const lastUserMessageIndex = chatHistory.slice().reverse().findIndex(m => m.role === 'user');
            if (lastUserMessageIndex !== -1) {
                const indexToRemoveFrom = chatHistory.length - 1 - lastUserMessageIndex;
                const newHistory = chatHistory.slice(0, indexToRemoveFrom);
                setChatHistory(newHistory);
                const newMemoryBank = recalculateMemoryBankFromHistory(newHistory);
                setMemoryBank(newMemoryBank);
            }
            setConfirmation(null);
        }
    });
  }, [chatHistory, isLoading, recalculateMemoryBankFromHistory]);
  
  const handleDeleteLastResponse = useCallback(() => {
    if (isLoading) return;

    const lastModelMessageIndex = chatHistory.slice().reverse().findIndex(m => m.role === 'model' && m.type !== 'system' && m.type !== 'error');
    if (lastModelMessageIndex === -1) return;
    const actualIndex = chatHistory.length - 1 - lastModelMessageIndex;

    setConfirmation({
        title: "Delete Last Response",
        message: "Are you sure you want to delete the AI's last response? You can regenerate it after.",
        onConfirm: () => {
            const newHistory = chatHistory.slice(0, actualIndex);
            setChatHistory(newHistory);
            const newMemoryBank = recalculateMemoryBankFromHistory(newHistory);
            setMemoryBank(newMemoryBank);
            setConfirmation(null);
        }
    });
  }, [chatHistory, isLoading, recalculateMemoryBankFromHistory]);

  const handleChangePart = useCallback((messageId: string, direction: 'next' | 'prev') => {
      setChatHistory(prev => {
          const newHistory = prev.map(msg => {
              if (msg.id === messageId && msg.parts && msg.parts.length > 1) {
                  const newIndex = direction === 'next'
                      ? (msg.currentPartIndex + 1) % msg.parts.length
                      : (msg.currentPartIndex - 1 + msg.parts.length) % msg.parts.length;
                  return { ...msg, currentPartIndex: newIndex };
              }
              return msg;
          });
          const newMemoryBank = recalculateMemoryBankFromHistory(newHistory);
          setMemoryBank(newMemoryBank);
          return newHistory;
      });
  }, [recalculateMemoryBankFromHistory]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handlePlayTTS = useCallback((messageId: string, textToRead: string) => {
    if (speakingMessageId === messageId) {
      speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }
    
    speechSynthesis.cancel();
    
    const plainText = textToRead
      .replace(/<dialogue>(.*?)<\/dialogue>/g, '$1')
      .replace(/<[^>]+>/g, '');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.onstart = () => setSpeakingMessageId(messageId);
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    
    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [speakingMessageId]);

  const handleSettingsChange = (field: keyof StorySettings, value: any) => {
    setSettings(prev => ({...prev, [field]: value}));
  };

  const handleApiSettingsChange = (field: keyof ApiSettings, value: ApiSettings[keyof ApiSettings]) => {
    setApiSettings(prev => {
      const updated = { ...prev, [field]: value };
      localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  };
  
  const lastModelMessage = chatHistory.slice().reverse().find(m => m.role === 'model' && m.type !== 'system');
  const suggestedActions = settings.showResponseSuggestions && lastModelMessage?.parts?.[lastModelMessage.currentPartIndex]?.suggestedActions || [];

  useEffect(() => {
    return () => {
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const hasUserMessages = chatHistory.some(m => m.role === 'user');
  const lastActionableModelMessageIndex = chatHistory.map(m => m.role === 'model' && m.type !== 'system' && m.type !== 'error').lastIndexOf(true);

  return (
    <div className="flex flex-col h-screen bg-transparent text-white w-full relative">
      <DynamicBackground emotion={dominantEmotion} />
      <header className="flex items-center justify-between p-2 sm:p-4 border-b border-zinc-800 flex-shrink-0 bg-black/80 backdrop-blur-md z-10">
        <button onClick={() => onExit(memoryBank)} disabled={isLoading} className="p-2 hover:bg-zinc-800 rounded-full transition-colors disabled:text-zinc-600 disabled:bg-transparent disabled:cursor-not-allowed">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-center truncate">
            <h2 className="font-bold truncate text-slate-100">{chat.scenario.name}</h2>
            <p className="text-sm text-slate-400 truncate">as {chat.userCharacter.name}</p>
        </div>
        <button onClick={() => setSettingsModalOpen(true)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <SettingsIcon className="w-6 h-6"/>
        </button>
      </header>

      <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar">
        {chatHistory.map((msg, index) => (
          msg.role === 'user' ? (
            <UserMessageBubble
              key={msg.id}
              message={msg}
              character={chat.userCharacter}
              onEditCharacter={() => setCharacterModalOpen(true)}
            />
          ) : (
            <ModelMessageBubble
              key={msg.id}
              message={msg}
              scenario={chat.scenario}
              isLoading={isLoading && index === chatHistory.length - 1}
              isSpeaking={speakingMessageId === msg.id}
              isActionable={index === lastActionableModelMessageIndex}
              onChangePart={(dir) => handleChangePart(msg.id, dir)}
              onPlayTTS={handlePlayTTS}
              enableTTS={settings.enableTTS}
              hasUserMessages={hasUserMessages}
              onRewind={handleRewind}
              onRegenerate={handleRegenerate}
              onContinue={handleContinue}
              onDeleteLastResponse={handleDeleteLastResponse}
            />
          )
        ))}
      </div>
      
      <footer className="p-4 border-t border-zinc-800 flex-shrink-0 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
             { !isLoading && suggestedActions.length > 0 && (
                <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                    {suggestedActions.map((action, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSendMessage(action)} 
                            className="bg-zinc-900 text-sm text-slate-300 hover:bg-zinc-800 px-4 py-2 rounded-full transition-colors whitespace-nowrap flex-shrink-0"
                        >
                            {action}
                        </button>
                    ))}
                </div>
            )}
            
            <div className="flex items-end gap-2">
                <form 
                    onSubmit={(e) => { e.preventDefault(); if (userInput.trim()) { handleSendMessage(); } }} 
                    className="flex-grow flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 transition-all duration-150 focus-within:ring-2 focus-within:ring-cyan-500"
                >
                    <textarea
                      ref={textareaRef}
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Your move..."
                      className="w-full flex-grow bg-transparent px-2.5 py-2 focus:outline-none resize-none overflow-y-auto no-scrollbar text-white placeholder-slate-500"
                      style={{ maxHeight: '150px' }}
                      rows={1}
                      disabled={isLoading}
                      aria-label="Chat input"
                    />
                    <button 
                        type="submit" 
                        className="bg-sky-600 hover:bg-sky-500 rounded-xl p-2.5 text-white disabled:bg-zinc-700 disabled:opacity-50 transition-all flex-shrink-0" 
                        disabled={isLoading || !userInput.trim()} 
                        aria-label="Send message">
                      <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
      </footer>

      {isSettingsModalOpen && <StorySettingsModal 
        onClose={() => setSettingsModalOpen(false)} 
        settings={settings} 
        onSettingsChange={handleSettingsChange} 
        apiSettings={apiSettings}
        onApiSettingsChange={handleApiSettingsChange}
        onEditCharacter={() => { setSettingsModalOpen(false); setCharacterModalOpen(true); }} 
        onViewMemoryBank={() => { setSettingsModalOpen(false); setMemoryBankModalOpen(true); }} 
      />}
      {isCharacterModalOpen && <CharacterCreation 
        onClose={() => setCharacterModalOpen(false)} 
        onSave={(char) => onUpdateUserCharacter(chat.id, char)} 
        initialCharacter={chat.userCharacter} 
      />}
      {isMemoryBankModalOpen && <MemoryBankModal 
        onClose={() => setMemoryBankModalOpen(false)} 
        memories={memoryBank} 
        onUpdateMemories={setMemoryBank}
      />}
      {confirmation && <ConfirmationModal 
        isOpen={!!confirmation} 
        onClose={() => setConfirmation(null)} 
        onConfirm={confirmation.onConfirm} 
        title={confirmation.title} 
        message={confirmation.message} 
      />}
    </div>
  );
};

export default StoryView;
