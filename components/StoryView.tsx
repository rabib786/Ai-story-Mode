import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ActiveChat, ModelResponsePart, UserCharacter } from '../types';
import { startChat, getInitialMessageStream, getInitialMessage, sendMessageStream, sendMessage } from '../services/geminiService';
import { type Chat, type GenerateContentResponse } from '@google/genai';
import { SendIcon, ArrowLeftIcon, RefreshCwIcon, SettingsIcon, EyeIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon, LightbulbIcon, UserIcon } from './icons';
import { CHAT_HISTORY_PREFIX } from '../constants/storageKeys';
import StorySettingsModal from './StorySettingsModal';
import CharacterCreation from './CharacterCreation';
import MemoryBankModal from './MemoryBankModal';

interface StoryViewProps {
  chat: ActiveChat;
  onExit: (finalMemoryBank: string[]) => void;
  onUpdateUserCharacter: (chatId: string, updatedCharacter: UserCharacter) => void;
}

type ResponseLength = 'Long' | 'Medium' | 'Short';

interface StorySettings {
  responseLength: ResponseLength;
  streamTextResponses: boolean;
  showResponseSuggestions: boolean;
  customLlmInstructions: string;
  model: string;
}

const emptyPart: ModelResponsePart = { narrative: '', suggestedActions: [] };

const StoryView: React.FC<StoryViewProps> = ({ chat, onExit, onUpdateUserCharacter }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCharacterEditorOpen, setCharacterEditorOpen] = useState(false);
  const [isMemoryBankOpen, setMemoryBankOpen] = useState(false);
  const [memoryBank, setMemoryBank] = useState<string[]>(chat.memoryBank || []);
  const [storySettings, setStorySettings] = useState<StorySettings>({
    responseLength: 'Medium',
    streamTextResponses: true,
    showResponseSuggestions: !chat.scenario.hideScenarioPrompts,
    customLlmInstructions: '',
    model: 'gemini-2.5-flash',
  });

  const { scenario } = chat;
  const savedGameKey = `${CHAT_HISTORY_PREFIX}${chat.id}`;
  
  const handleSettingsChange = (field: keyof StorySettings, value: any) => {
    setStorySettings(prev => ({ ...prev, [field]: value }));
  };
  
  const highlightText = (narrative: string) => {
    let processedNarrative = narrative;
    processedNarrative = processedNarrative.replace(/<dialogue>(.*?)<\/dialogue>/gs, '<span class="text-amber-400 font-medium">$1</span>');
    processedNarrative = processedNarrative.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    return processedNarrative;
  };

  const parseModelResponse = (responseText: string): ModelResponsePart => {
    try {
      const cleanedJson = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
      const rawParsed = JSON.parse(cleanedJson);
      return {
        narrative: rawParsed.narrative || 'The story seems to have paused. Try continuing.',
        suggestedActions: Array.isArray(rawParsed.actions) ? rawParsed.actions : [],
        memoryAdditions: Array.isArray(rawParsed.memory_additions) ? rawParsed.memory_additions : [],
      };
    } catch (error) {
      console.error("Failed to parse JSON response:", error, "Raw response:", responseText);
      return {
        narrative: responseText || "An error occurred. I might have lost my train of thought.",
        suggestedActions: [],
      };
    }
  };

  const streamAndParseResponse = async (
    stream: AsyncGenerator<any>,
    updateCallback: (narrativeChunk: string) => void
  ): Promise<ModelResponsePart> => {
    let accumulatedJson = '';
    for await (const chunk of stream) {
      const textChunk = chunk.text;
      if (typeof textChunk === 'string') {
        accumulatedJson += textChunk;
      }
      
      const narrativeKey = '"narrative": "';
      const narrativeStartIndex = accumulatedJson.lastIndexOf(narrativeKey);
      let streamingNarrative = '...';

      if (narrativeStartIndex > -1) {
        let narrativeContent = accumulatedJson.substring(narrativeStartIndex + narrativeKey.length);
        // Clean up potential trailing JSON structure for smoother streaming display
        narrativeContent = narrativeContent.replace(/",\s*"(actions|memory_additions)":.*/s, '');
        // Clean up escaped characters for rendering
        streamingNarrative = narrativeContent
          .replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\').replace(/"$/, '');
      }
      updateCallback(streamingNarrative);
    }
    return parseModelResponse(accumulatedJson);
  };
  
  const handleModelResponse = (finalPart: ModelResponsePart, messageId: string, partIndex: number) => {
      // Update memory bank
      const newMemories = (finalPart.memoryAdditions || []).filter(m => typeof m === 'string' && m.trim() !== '');
      if (newMemories.length > 0) {
        setMemoryBank(prev => [...new Set([...prev, ...newMemories])]);
      }

      // Update chat history with the final, complete part
      setChatHistory(prev => prev.map(msg => {
          if (msg.id === messageId) {
              const newParts = [...(msg.parts || [])];
              newParts[partIndex] = finalPart;
              // If this is a regeneration, also update the current index
              if (partIndex > msg.currentPartIndex) {
                  return { ...msg, parts: newParts, currentPartIndex: partIndex };
              }
              return { ...msg, parts: newParts };
          }
          return msg;
      }));
      
      setIsLoading(false);
  };
  
  const handleError = (error: any, messageId: string) => {
    console.error("Failed to get model response:", error);
    const errorPart: ModelResponsePart = { narrative: "An error occurred. I might have lost my train of thought.", suggestedActions: [] };
    setChatHistory(prev => prev.map(msg => msg.id === messageId ? { ...msg, parts: [errorPart] } : msg));
    setIsLoading(false);
  };

  const initializeStory = useCallback(async () => {
    setIsLoading(true);
    setChatHistory([]);
    
    const savedHistoryRaw = localStorage.getItem(savedGameKey);
    const savedHistory = savedHistoryRaw ? (JSON.parse(savedHistoryRaw) as ChatMessage[]) : [];

    const settingsForChat = {
        responseLength: storySettings.responseLength,
        customInstructions: storySettings.customLlmInstructions,
        model: storySettings.model
    };
    chatSessionRef.current = startChat(scenario, chat.userCharacter, savedHistory, memoryBank, settingsForChat);

    if (savedHistory.length > 0) {
      setChatHistory(savedHistory);
      setIsLoading(false);
      return;
    }

    const newModelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', parts: [emptyPart], currentPartIndex: 0 };
    setChatHistory([newModelMessage]);

    try {
        let finalPart: ModelResponsePart;
        if (storySettings.streamTextResponses) {
            const stream = await getInitialMessageStream(chatSessionRef.current);
            const updateStreamingHistory = (narrativeChunk: string) => {
                setChatHistory(prev => prev.map(msg => {
                    if (msg.id === newModelMessage.id) {
                        const newParts = [...msg.parts!];
                        newParts[msg.currentPartIndex] = { ...newParts[msg.currentPartIndex], narrative: narrativeChunk };
                        return { ...msg, parts: newParts };
                    }
                    return msg;
                }));
            };
            finalPart = await streamAndParseResponse(stream, updateStreamingHistory);
        } else {
            const response = await getInitialMessage(chatSessionRef.current);
            finalPart = parseModelResponse(response.text);
        }
        handleModelResponse(finalPart, newModelMessage.id, 0);
    } catch (error) {
        handleError(error, newModelMessage.id);
    }
  }, [scenario, chat.userCharacter, savedGameKey, storySettings, memoryBank]);

  useEffect(() => {
    initializeStory();
  }, [initializeStory]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(savedGameKey, JSON.stringify(chatHistory));
    }
  }, [chatHistory, savedGameKey]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, chatContainerRef.current?.scrollHeight]);
  
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: messageText, currentPartIndex: 0 };
    const currentHistory = [...chatHistory, newUserMessage];
    setUserInput('');
    setIsLoading(true);
    
    const settingsForChat = {
        responseLength: storySettings.responseLength,
        customInstructions: storySettings.customLlmInstructions,
        model: storySettings.model
    };
    chatSessionRef.current = startChat(scenario, chat.userCharacter, currentHistory, memoryBank, settingsForChat);

    const newModelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', parts: [emptyPart], currentPartIndex: 0 };
    setChatHistory([...currentHistory, newModelMessage]);

    try {
      let finalPart: ModelResponsePart;
      if (storySettings.streamTextResponses) {
        const stream = await sendMessageStream(chatSessionRef.current, messageText);
        const updateStreamingHistory = (narrativeChunk: string) => {
            setChatHistory(prev => prev.map(msg => {
                if (msg.id === newModelMessage.id) {
                    const newParts = [...msg.parts!];
                    newParts[msg.currentPartIndex] = { ...newParts[msg.currentPartIndex], narrative: narrativeChunk };
                    return { ...msg, parts: newParts };
                }
                return msg;
            }));
        };
        finalPart = await streamAndParseResponse(stream, updateStreamingHistory);
      } else {
        const response = await sendMessage(chatSessionRef.current, messageText);
        finalPart = parseModelResponse(response.text);
      }
      handleModelResponse(finalPart, newModelMessage.id, 0);
    } catch (error) {
      handleError(error, newModelMessage.id);
    }
  };
  
  const lastModelMessage = chatHistory.filter(m => m.role === 'model').slice(-1)[0];
  const lastUserMessage = chatHistory.filter(m => m.role === 'user').slice(-1)[0];

  const handleRegenerate = async () => {
    if (!lastUserMessage || !lastModelMessage || isLoading) return;
    
    setIsLoading(true);
    
    const historyForRegen = chatHistory.slice(0, -1);
    const settingsForChat = {
        responseLength: storySettings.responseLength,
        customInstructions: storySettings.customLlmInstructions,
        model: storySettings.model
    };
    chatSessionRef.current = startChat(scenario, chat.userCharacter, historyForRegen, memoryBank, settingsForChat);
    
    const newPartIndex = lastModelMessage.parts?.length || 0;
    setChatHistory(prev => prev.map(msg => 
        msg.id === lastModelMessage.id ? { ...msg, parts: [...(msg.parts || []), emptyPart] } : msg
    ));

    try {
        let finalPart: ModelResponsePart;
        if (storySettings.streamTextResponses) {
            const stream = await sendMessageStream(chatSessionRef.current, lastUserMessage.text!);
            const updateStreamingHistory = (narrativeChunk: string) => {
                setChatHistory(prev => prev.map(msg => {
                    if (msg.id === lastModelMessage.id) {
                        const newParts = [...msg.parts!];
                        newParts[newPartIndex] = { ...newParts[newPartIndex], narrative: narrativeChunk };
                        return { ...msg, parts: newParts };
                    }
                    return msg;
                }));
            };
            finalPart = await streamAndParseResponse(stream, updateStreamingHistory);
        } else {
            const response = await sendMessage(chatSessionRef.current, lastUserMessage.text!);
            finalPart = parseModelResponse(response.text);
        }
        handleModelResponse(finalPart, lastModelMessage.id, newPartIndex);
    } catch (error) {
       handleError(error, lastModelMessage.id);
    }
  };

  const handleChangePart = (messageId: string, direction: 'next' | 'prev') => {
    setChatHistory(prev => prev.map(msg => {
        if (msg.id === messageId) {
            const totalParts = msg.parts?.length || 1;
            let newIndex = msg.currentPartIndex;
            if (direction === 'next') {
                newIndex = (newIndex + 1) % totalParts;
            } else {
                newIndex = (newIndex - 1 + totalParts) % totalParts;
            }
            return { ...msg, currentPartIndex: newIndex };
        }
        return msg;
    }));
  };

  const handleEditCharacter = () => {
    setIsSettingsOpen(false);
    setCharacterEditorOpen(true);
  };
  
  const handleViewMemoryBank = () => {
    setIsSettingsOpen(false);
    setMemoryBankOpen(true);
  };

  return (
    <>
      <div className="w-full h-screen flex flex-col bg-[#0F0F0F] text-slate-200 font-sans">
        {/* Header */}
        <header className="flex-shrink-0 p-4 pt-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => onExit(memoryBank)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800" aria-label="Exit story"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <img src={scenario.image || `https://source.unsplash.com/random/40x40?${scenario.tags[0]}`} alt={scenario.name} className="w-10 h-10 rounded-full object-cover"/>
                    <div>
                      <h2 className="font-bold text-white">{scenario.name}</h2>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1.5"><EyeIcon className="w-4 h-4"/> {scenario.views}</span>
                          <span className="flex items-center gap-1.5"><StarIcon className="w-4 h-4"/> {scenario.rating.toFixed(1)} / 10</span>
                      </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"><SettingsIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </header>
        
        {/* Story Content Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
            {chatHistory.map((msg) => {
                if (msg.role === 'user') {
                    return (
                        <div key={msg.id} className="flex justify-center items-center gap-3 my-8">
                            <UserIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
                            <p className="text-slate-300 italic max-w-2xl text-center">{msg.text}</p>
                        </div>
                    );
                } else { // Model message
                    const currentPart = msg.parts ? msg.parts[msg.currentPartIndex] : null;
                    const narrativeToRender = currentPart?.narrative || '';

                    return (
                        <div 
                            key={msg.id}
                            className="flex flex-col items-center my-6"
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                        >
                            <div className="w-full max-w-3xl leading-relaxed text-slate-300 prose prose-invert prose-p:text-slate-300">
                                {narrativeToRender ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: highlightText(narrativeToRender) }} 
                                    />
                                ) : (
                                  isLoading && <div className="w-full h-8" /> // Placeholder for loading
                                )}
                            </div>
                            
                            {/* Actions & Regeneration */}
                            <div className={`transition-opacity duration-300 w-full max-w-3xl mt-4 flex items-center justify-center ${hoveredMessageId === msg.id || (msg.id === lastModelMessage?.id && isLoading) ? 'opacity-100' : 'opacity-0'}`}>
                                {msg.id === lastModelMessage?.id && !isLoading && (
                                     <button onClick={handleRegenerate} title="Regenerate Response" className="p-2 text-slate-400 hover:text-sky-400 transition-colors rounded-full hover:bg-slate-800">
                                        <RefreshCwIcon className="w-4 h-4"/>
                                    </button>
                                )}
                                {msg.parts && msg.parts.length > 1 && (
                                    <div className="flex items-center gap-2 text-sm ml-4">
                                        <button onClick={() => handleChangePart(msg.id, 'prev')} className="p-1 rounded-full hover:bg-slate-800"><ChevronLeftIcon className="w-5 h-5"/></button>
                                        <span>{msg.currentPartIndex + 1} / {msg.parts.length}</span>
                                        <button onClick={() => handleChangePart(msg.id, 'next')} className="p-1 rounded-full hover:bg-slate-800"><ChevronRightIcon className="w-5 h-5"/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }
            })}
            {isLoading && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                </div>
            )}
        </div>

        {/* Action Suggestions */}
        {storySettings.showResponseSuggestions && lastModelMessage && lastModelMessage.parts && lastModelMessage.parts[lastModelMessage.currentPartIndex]?.suggestedActions.length > 0 && !isLoading && (
            <div className="flex-shrink-0 p-4 pt-0">
                <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4">
                    {lastModelMessage.parts[lastModelMessage.currentPartIndex].suggestedActions.map((action, index) => (
                        <button 
                            key={index}
                            onClick={() => handleSendMessage(action)}
                            className="flex-shrink-0 flex items-center gap-2 bg-slate-800/70 border border-slate-700 backdrop-blur-sm text-slate-300 px-4 py-2 rounded-full hover:bg-slate-700/80 hover:border-sky-500 transition-all text-sm"
                        >
                            <LightbulbIcon className="w-4 h-4 text-sky-400"/>
                            {action}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Input Area */}
        <footer className="flex-shrink-0 p-4">
            <div className="w-full max-w-3xl mx-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }}>
                    <div className="relative">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="What do you do next?"
                          disabled={isLoading}
                          className="w-full bg-[#1e1f22] border border-slate-700 text-slate-200 rounded-full py-3 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-50"
                        />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-sky-600 text-white hover:bg-sky-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                          <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </footer>
      </div>
      {isSettingsOpen && (
        <StorySettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          settings={storySettings} 
          onSettingsChange={handleSettingsChange}
          onEditCharacter={handleEditCharacter}
          onViewMemoryBank={handleViewMemoryBank}
        />
      )}
      {isCharacterEditorOpen && (
        <CharacterCreation
          onClose={() => setCharacterEditorOpen(false)}
          onSave={(updatedCharacter) => {
            onUpdateUserCharacter(chat.id, updatedCharacter);
            setCharacterEditorOpen(false);
          }}
          initialCharacter={chat.userCharacter}
        />
      )}
      {isMemoryBankOpen && (
        <MemoryBankModal
          onClose={() => setMemoryBankOpen(false)}
          memories={memoryBank}
          onUpdateMemories={setMemoryBank}
        />
      )}
    </>
  );
};

export default StoryView;