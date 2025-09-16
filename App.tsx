
import React, { useState, useCallback, useEffect } from 'react';
import { Scenario, UserCharacter, ActiveChat } from './types';
import ScenarioSelector from './components/ScenarioSelector';
import StoryView from './components/StoryView';
import CharacterSelector from './components/CharacterSelector';
import { PREBUILT_SCENARIOS } from './constants/scenarios';
import BottomNavBar from './components/BottomNavBar';
import ScenarioEditor from './components/ScenarioEditor';
import ProfileScreen from './components/ProfileScreen';
import ChatsScreen from './components/ChatsScreen';
import { ACTIVE_CHATS_KEY, SCENARIOS_KEY } from './constants/storageKeys';

type Screen = 'scenario_selector' | 'character_selector' | 'story_view' | 'scenario_editor' | 'profile' | 'chats_list';
type View = 'home' | 'search' | 'create' | 'chats' | 'profile';

interface HeaderProps {
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 z-40 flex items-center justify-between px-4 sm:px-6">
    {/* Spacer to balance the profile button */}
    <div className="w-8"></div>
    <div className="flex items-center gap-2 text-xl font-bold text-slate-100">
      <span>Story Mode AI</span>
    </div>
     <button onClick={onProfileClick} className="flex items-center justify-center font-bold text-slate-200 bg-slate-700 rounded-full w-8 h-8 hover:bg-slate-600 transition-colors" aria-label="User profile">
        S
    </button>
  </header>
);


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('scenario_selector');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  
  const [scenarioForSelection, setScenarioForSelection] = useState<Scenario | null>(null);
  const [currentChat, setCurrentChat] = useState<ActiveChat | null>(null);
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  
  useEffect(() => {
    const savedScenariosRaw = localStorage.getItem(SCENARIOS_KEY);
    if (savedScenariosRaw) {
      setScenarios(JSON.parse(savedScenariosRaw));
    } else {
      // First time load, populate from prebuilt and save
      setScenarios(PREBUILT_SCENARIOS);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(PREBUILT_SCENARIOS));
    }

    const savedChats = localStorage.getItem(ACTIVE_CHATS_KEY);
    if (savedChats) {
      setActiveChats(JSON.parse(savedChats));
    }
  }, []);

  const handleScenarioSelect = useCallback((scenario: Scenario) => {
    setScenarioForSelection(scenario);
    setCurrentScreen('character_selector');
  }, []);
  
  const handleCharacterSelect = useCallback((character: UserCharacter) => {
    if (!scenarioForSelection) return;

    const id = `${scenarioForSelection.name}-${character.name}-${Date.now()}`;
    const newChat: ActiveChat = {
      id,
      scenario: scenarioForSelection,
      userCharacter: character,
      lastUpdate: Date.now()
    };
    
    const updatedChats = [newChat, ...activeChats.filter(c => c.id !== id)]; // Add new, remove old if re-creating
    setActiveChats(updatedChats);
    localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));

    setCurrentChat(newChat);
    setScenarioForSelection(null);
    setCurrentScreen('story_view');
  }, [scenarioForSelection, activeChats]);

  const handleExitStory = useCallback(() => {
    if (currentChat) {
      // Update the timestamp of the current chat session
      const updatedChats = activeChats.map(c => 
        c.id === currentChat.id ? { ...c, lastUpdate: Date.now() } : c
      );
      // Sort by most recent
      updatedChats.sort((a, b) => b.lastUpdate - a.lastUpdate);
      setActiveChats(updatedChats);
      localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));
    }
    setCurrentChat(null);
    setCurrentScreen('scenario_selector');
  }, [currentChat, activeChats]);
  
  const handleResumeChat = (chatToResume: ActiveChat) => {
    setCurrentChat(chatToResume);
    setCurrentScreen('story_view');
  };

  const handleDeleteChat = (chatId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this chat history?')) {
      const updatedChats = activeChats.filter(c => c.id !== chatId);
      setActiveChats(updatedChats);
      localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));
      // Also delete the chat history from storage
      localStorage.removeItem(`storymode_chat_history_${chatId}`);
    }
  };

  const handleBackToScenarioSelection = useCallback(() => {
    setScenarioForSelection(null);
    setCurrentScreen('scenario_selector');
  }, []);

  const handleNavigate = (view: View) => {
    setCurrentChat(null); // Ensure no chat is active when navigating away
    setScenarioForSelection(null);
    if (view === 'home') {
      setCurrentScreen('scenario_selector');
    } else if (view === 'create') {
      setCurrentScreen('scenario_editor');
    } else if (view === 'profile') {
      setCurrentScreen('profile');
    } else if (view === 'chats') {
        setCurrentScreen('chats_list');
    } else {
        alert(`${view} screen is not implemented yet.`);
    }
  };
  
  const handleScenarioCreated = (newScenario: Scenario) => {
    const updatedScenarios = [newScenario, ...scenarios];
    setScenarios(updatedScenarios);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updatedScenarios));
    setCurrentScreen('scenario_selector');
  };

  const handleDeleteScenario = (scenarioNameToDelete: string) => {
    const isScenarioInUse = activeChats.some(chat => chat.scenario.name === scenarioNameToDelete);

    if (isScenarioInUse) {
      alert("This scenario is being used in an active chat. Please delete the chat before deleting the scenario.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the scenario "${scenarioNameToDelete}"? This cannot be undone.`)) {
      const updatedScenarios = scenarios.filter(s => s.name !== scenarioNameToDelete);
      setScenarios(updatedScenarios);
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updatedScenarios));
    }
  };
  
  const getActiveView = (): View => {
    switch(currentScreen) {
        case 'scenario_editor': return 'create';
        case 'profile': return 'profile';
        case 'chats_list': return 'chats';
        case 'scenario_selector':
        case 'character_selector':
        case 'story_view':
        default:
            return 'home';
    }
  }

  const renderContent = () => {
    switch (currentScreen) {
      case 'profile':
        return <ProfileScreen />;
      case 'chats_list':
        return <ChatsScreen chats={activeChats} onResumeChat={handleResumeChat} onDeleteChat={handleDeleteChat} />;
      case 'scenario_editor':
        return <ScenarioEditor onSave={handleScenarioCreated} onBack={() => setCurrentScreen('scenario_selector')} />;
      case 'character_selector':
        return (
          <CharacterSelector
            onCharacterSelected={handleCharacterSelect}
            onBack={handleBackToScenarioSelection}
          />
        );
      case 'story_view':
        return (
          <StoryView
            key={currentChat!.id}
            chat={currentChat!}
            onExit={handleExitStory}
          />
        );
      case 'scenario_selector':
      default:
        return (
          <ScenarioSelector
            scenarios={scenarios}
            onSelectScenario={handleScenarioSelect}
            onStartCreation={() => setCurrentScreen('scenario_editor')}
            onDeleteScenario={handleDeleteScenario}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
        {currentScreen !== 'story_view' && <Header onProfileClick={() => handleNavigate('profile')} />}
        <main className={`w-full h-full flex-grow flex flex-col ${currentScreen === 'story_view' ? '' : 'items-center pt-20 pb-20 px-4 sm:px-6 lg:px-8'}`}>
            {renderContent()}
        </main>
        {currentScreen !== 'story_view' && <BottomNavBar 
            activeView={getActiveView()}
            onNavigate={handleNavigate}
        />}
    </div>
  );
};

export default App;
