import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ActiveChat, ModelResponsePart } from '../types';
import { startChat, getInitialMessageStream, sendMessageStream } from '../services/geminiService';
import { type Chat } from '@google/genai';
import { SendIcon, ArrowLeftIcon, RefreshCwIcon, SettingsIcon, EyeIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon, LightbulbIcon, UserIcon } from './icons';
import { CHAT_HISTORY_PREFIX } from '../constants/storageKeys';
import StorySettingsModal from './StorySettingsModal';

interface StoryViewProps {
  chat: ActiveChat;
  onExit: () => void;
}

const StoryView: React.FC<StoryViewProps> = ({ chat, onExit }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { scenario } = chat;
  const savedGameKey = `${CHAT_HISTORY_PREFIX}${chat.id}`;
  
  const emptyPart: ModelResponsePart = { narrative: '', suggestedActions: [] };

  const processJsonResponseStream = async (stream: AsyncGenerator<any>, messageIdToUpdate: string, partIndexToUpdate: number) => {
    let accumulatedJson = '';
    let finalResponsePart: ModelResponsePart;
    try {
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            accumulatedJson += chunkText;
        }

        const cleanedJson = accumulatedJson.replace(/^```json\s*|```\s*$/g, '').trim();
        const rawParsed = JSON.parse(cleanedJson);
        
        finalResponsePart = {
            narrative: rawParsed.narrative || 'The story seems to have paused. Try continuing.',
            dialogue: rawParsed.dialogue,
            suggestedActions: Array.isArray(rawParsed.actions) ? rawParsed.actions : []
        };

    } catch (error) {
        console.error("Failed to parse JSON response:", error, "Raw response:", accumulatedJson);
        finalResponsePart = {
            narrative: accumulatedJson || "An error occurred. I might have lost my train of thought.",
            dialogue: undefined,
            suggestedActions: []
        };
    }
    
    setChatHistory(prev => prev.map(msg => {
        if (msg.id === messageIdToUpdate) {
            const newParts = [...(msg.parts || [])];
            newParts[partIndexToUpdate] = finalResponsePart;
            return { ...msg, parts: newParts };
        }
        return msg;
    }));
  };

  const initializeStory = useCallback(async () => {
    setIsLoading(true);
    setChatHistory([]);
    
    const savedHistoryRaw = localStorage.getItem(savedGameKey);
    const savedHistory = savedHistoryRaw ? (JSON.parse(savedHistoryRaw) as ChatMessage[]) : [];

    chatSessionRef.current = startChat(scenario, chat.userCharacter, savedHistory);

    if (savedHistory.length > 0) {
      setChatHistory(savedHistory);
      setIsLoading(false);
      return;
    }

    try {
      const newModelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', parts: [emptyPart], currentPartIndex: 0 };
      setChatHistory([newModelMessage]);
      
      const stream = await getInitialMessageStream(chatSessionRef.current);
      await processJsonResponseStream(stream, newModelMessage.id, 0);

    } catch (error) {
      console.error("Failed to start story:", error);
      const errorPart: ModelResponsePart = {
          narrative: "Sorry, I couldn't start the story. Please check the API key and try again.",
          suggestedActions: []
      };
      setChatHistory([{ id: `model-error-${Date.now()}`, role: 'model', parts: [errorPart], currentPartIndex: 0 }]);
    } finally {
        setIsLoading(false);
    }
  }, [scenario, chat.userCharacter, savedGameKey]);

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
  }, [chatHistory, chatContainerRef.current?.scrollHeight]); // Trigger on scrollHeight change
  
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: messageText, currentPartIndex: 0 };
    const currentHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentHistory);
    setUserInput('');
    
    setIsLoading(true);
    
    chatSessionRef.current = startChat(scenario, chat.userCharacter, currentHistory);

    const newModelMessage: ChatMessage = { id: `model-${Date.now()}`, role: 'model', parts: [emptyPart], currentPartIndex: 0 };
    setChatHistory(prev => [...prev, newModelMessage]);

    try {
      const stream = await sendMessageStream(chatSessionRef.current, messageText);
      await processJsonResponseStream(stream, newModelMessage.id, 0);
    } catch (error) {
      console.error("Failed to get model response:", error);
      const errorPart: ModelResponsePart = { narrative: "An error occurred. I might have lost my train of thought.", suggestedActions: [] };
      setChatHistory(prev => prev.map(msg => msg.id === newModelMessage.id ? { ...msg, parts: [errorPart] } : msg));
    } finally {
      setIsLoading(false);
    }
  };
  
  const highlightText = (narrative: string, textToHighlight?: string) => {
    let processedNarrative = narrative;

    // First, wrap the dialogue in a span for highlighting.
    // This is done before markdown processing to ensure `includes()` works correctly,
    // as markdown conversion would alter the narrative string.
    if (textToHighlight && textToHighlight.trim() && processedNarrative.includes(textToHighlight)) {
        const highlighted = `<span class="text-amber-400 font-medium">${textToHighlight}</span>`;
        // Replace only the first occurrence to avoid potential issues.
        processedNarrative = processedNarrative.replace(textToHighlight, highlighted);
    }
    
    // Second, process markdown for bold (**) and italics (*).
    // This will correctly transform markdown even within the highlighted span.
    processedNarrative = processedNarrative.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');

    return processedNarrative;
  };
  
  const lastModelMessage = chatHistory.filter(m => m.role === 'model').slice(-1)[0];
  const lastUserMessage = chatHistory.filter(m => m.role === 'user').slice(-1)[0];

  const handleRegenerate = async () => {
    if (!lastUserMessage || !lastModelMessage || isLoading) return;
    
    setIsLoading(true);
    
    const historyForRegen = chatHistory.slice(0, -1);
    chatSessionRef.current = startChat(scenario, chat.userCharacter, historyForRegen);
    
    try {
        const stream = await sendMessageStream(chatSessionRef.current, lastUserMessage.text!);
        await processJsonResponseStream(stream, lastModelMessage.id, lastModelMessage.parts?.length || 0);
        
        setChatHistory(prev => prev.map(msg => {
            if (msg.id === lastModelMessage.id) {
                return { ...msg, currentPartIndex: (msg.parts?.length || 1) - 1 };
            }
            return msg;
        }));
    } catch (error) {
        console.error("Failed to regenerate response:", error);
    } finally {
        setIsLoading(false);
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

  return (
    <>
      <div className="w-full h-screen flex flex-col bg-[#0F0F0F] text-slate-200 font-sans">
        {/* Header */}
        <header className="flex-shrink-0 p-4 pt-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onExit} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800" aria-label="Exit story"><ArrowLeftIcon className="w-5 h-5"/></button>
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
                            <p className="text-slate-400 italic text-center">
                                {msg.text}
                            </p>
                        </div>
                    );
                }

                // Model message
                const isLastModelMessage = msg.id === lastModelMessage?.id;
                const currentPart = msg.parts?.[msg.currentPartIndex];
                const hasMultipleParts = (msg.parts?.length || 0) > 1;

                return (
                    <div key={msg.id} className="mb-6 relative" onMouseEnter={() => setHoveredMessageId(msg.id)} onMouseLeave={() => setHoveredMessageId(null)}>
                        {/* Hover controls */}
                        {hoveredMessageId === msg.id && (
                            <div className="absolute top-2 right-2 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 flex items-center text-white text-xs">
                               {hasMultipleParts && (
                                    <>
                                        <button onClick={() => handleChangePart(msg.id, 'prev')} className="p-2 hover:bg-slate-700 rounded-l-lg transition-colors"><ChevronLeftIcon className="w-4 h-4"/></button>
                                        <span className="font-mono px-2 select-none">{msg.currentPartIndex + 1}/{msg.parts!.length}</span>
                                        <button onClick={() => handleChangePart(msg.id, 'next')} className="p-2 hover:bg-slate-700 rounded-r-lg transition-colors border-l border-slate-700"><ChevronRightIcon className="w-4 h-4"/></button>
                                    </>
                                )}
                                {isLastModelMessage && (
                                    <button onClick={handleRegenerate} disabled={isLoading} className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:text-slate-500 disabled:cursor-not-allowed">
                                        <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/>
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                            <img src={scenario.image || `https://source.unsplash.com/random/40x40?${scenario.tags[0]}`} alt="scenario" className="w-10 h-10 rounded-full object-cover"/>
                            <div>
                                <p className="font-bold text-white">{scenario.name}</p>
                            </div>
                        </div>
                        <div className="pl-12 text-slate-300 space-y-4 leading-relaxed selection:bg-sky-400/30">
                            {isLoading && msg.id === lastModelMessage?.id && !currentPart?.narrative ? (
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-5 bg-slate-600 rounded-full animate-pulse"></span>
                                    <span className="inline-block w-2 h-5 bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                                    <span className="inline-block w-2 h-5 bg-slate-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                                </div>
                            ) : (
                                currentPart?.narrative.split('\n').filter(p => p.trim()).map((paragraph, pIndex) => (
                                    <p key={pIndex} dangerouslySetInnerHTML={{ __html: highlightText(paragraph, currentPart.dialogue) }} />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
             {/* Suggested Actions */}
             {!isLoading && !scenario.hideScenarioPrompts && lastModelMessage && lastModelMessage.parts![lastModelMessage.currentPartIndex].suggestedActions.length > 0 && (
                <div className="pl-12 mt-8 space-y-3">
                    {lastModelMessage.parts![lastModelMessage.currentPartIndex].suggestedActions.map((action, i) => (
                         <button 
                            key={i} 
                            onClick={() => handleSendMessage(action)}
                            className="w-full text-left bg-[#252525] hover:bg-[#333] border border-slate-700 rounded-xl px-5 py-3.5 transition-colors group"
                          >
                            <span className="text-slate-500 group-hover:text-slate-400 mr-4 transition-colors">{i + 1}.</span>
                            <span className="text-slate-300">{action}</span>
                         </button>
                    ))}
                </div>
              )}
               {isLoading && chatHistory.length === 0 && (
                  <div className="text-center text-slate-400">Loading story...</div>
              )}
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-[#0F0F0F] flex-shrink-0">
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); handleSendMessage(userInput);}}}
              placeholder="Write how the story continues"
              className="w-full bg-[#252525] border border-slate-700 rounded-xl py-3 pl-12 pr-12 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
              rows={1}
              disabled={isLoading}
              aria-label="Your next action"
            />
            <button className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 hover:text-yellow-400 transition-colors" aria-label="Get suggestion">
                <LightbulbIcon className="w-6 h-6"/>
            </button>
            <button
              onClick={() => handleSendMessage(userInput)}
              disabled={isLoading || !userInput.trim()}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-sky-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
           <p className="text-center text-xs text-slate-600 mt-2">Everything the AI generates is fictional and shouldn't be taken seriously!</p>
        </div>
      </div>
      {isSettingsOpen && <StorySettingsModal scenario={scenario} onClose={() => setIsSettingsOpen(false)} />}
    </>
  );
};

export default StoryView;