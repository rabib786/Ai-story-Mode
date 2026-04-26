

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Scenario, UserCharacter, ActiveChat } from './types';
const ScenarioSelector = React.lazy(() => import('./components/ScenarioSelector'));
const StoryView = React.lazy(() => import('./components/StoryView'));
const CharacterSelector = React.lazy(() => import('./components/CharacterSelector'));
import { PREBUILT_SCENARIOS } from './constants/scenarios';
const BottomNavBar = React.lazy(() => import('./components/BottomNavBar'));
const ScenarioEditor = React.lazy(() => import('./components/ScenarioEditor'));
const ProfileScreen = React.lazy(() => import('./components/ProfileScreen'));
const ChatsScreen = React.lazy(() => import('./components/ChatsScreen'));
import { ACTIVE_CHATS_KEY, SCENARIOS_KEY, CHAT_HISTORY_PREFIX, USER_CHARACTERS_KEY, DELETED_PREBUILT_SCENARIOS_KEY } from './constants/storageKeys';
import { UserCircleIcon, BookOpenIcon } from './components/icons';
const ScenarioDetailView = React.lazy(() => import('./components/ScenarioDetailView'));
const ConfirmationModal = React.lazy(() => import('./components/ConfirmationModal'));
const AlertModal = React.lazy(() => import('./components/AlertModal'));

type Screen = 'scenario_selector' | 'scenario_details' | 'character_selector' | 'story_view' | 'scenario_editor' | 'profile' | 'chats_list';
type View = 'home' | 'create' | 'chats' | 'profile';

interface HeaderProps {
  onProfileClick: () => void;
}

interface ConfirmationState {
  title: string;
  message: string;
  onConfirm: () => void;
}

interface AlertState {
  title: string;
  message: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Header: React.FC<HeaderProps> = ({ onProfileClick }) => (
  <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-b border-zinc-800 z-40 flex items-center justify-between px-4 sm:px-6">
    <h1 className="flex items-center gap-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">
      <BookOpenIcon className="w-6 h-6 text-sky-400" />
      Story Mode AI
    </h1>
     <button onClick={onProfileClick} className="text-slate-400 hover:text-sky-400 transition-colors" aria-label="User profile">
        <UserCircleIcon className="w-8 h-8" />
    </button>
  </header>
);


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('scenario_selector');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);
  
  const [viewedScenario, setViewedScenario] = useState<Scenario | null>(null);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [scenarioForSelection, setScenarioForSelection] = useState<Scenario | null>(null);

  const [currentChat, setCurrentChat] = useState<ActiveChat | null>(null);
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = (title: string, message: string) => setAlert({ title, message });
  
  useEffect(() => {
    // ONE-TIME MIGRATION to separate custom scenarios from the old mixed storage
    const savedScenariosRaw = localStorage.getItem(SCENARIOS_KEY);
    if (savedScenariosRaw) {
        try {
            const allScenarios: Scenario[] = JSON.parse(savedScenariosRaw);
            const prebuiltIds = new Set(PREBUILT_SCENARIOS.map(ps => ps.id));
            if (allScenarios.some(s => prebuiltIds.has(s.id))) {
                const customScenarios = allScenarios.filter(s => !prebuiltIds.has(s.id));
                localStorage.setItem(SCENARIOS_KEY, JSON.stringify(customScenarios));
            }
        } catch (e) {
            console.error("Failed to migrate scenarios, clearing for safety.", e);
            localStorage.removeItem(SCENARIOS_KEY);
        }
    }

    // Load Scenarios (New Robust Logic)
    try {
        const savedCustomScenariosRaw = localStorage.getItem(SCENARIOS_KEY);
        const customScenarios: Scenario[] = savedCustomScenariosRaw ? JSON.parse(savedCustomScenariosRaw) : [];
        let wasUpdated = false;
        
        // BUG FIX: Use robust UUID check for migrating custom scenario IDs
        const migratedCustomScenarios = customScenarios.map(s => {
          const currentId = String(s.id || '');
          if (currentId.startsWith('custom-')) {
            const uuidPart = currentId.replace('custom-', '');
            if (UUID_REGEX.test(uuidPart)) {
              return s;
            }
          } else if (UUID_REGEX.test(currentId)) {
            wasUpdated = true;
            return { ...s, id: `custom-${currentId}` };
          }

          wasUpdated = true;
          return { ...s, id: `custom-${crypto.randomUUID()}` };
        });
        if (wasUpdated) {
          localStorage.setItem(SCENARIOS_KEY, JSON.stringify(migratedCustomScenarios));
        }

        const deletedPrebuiltIdsRaw = localStorage.getItem(DELETED_PREBUILT_SCENARIOS_KEY);
        const deletedPrebuiltIds: string[] = deletedPrebuiltIdsRaw ? JSON.parse(deletedPrebuiltIdsRaw) : [];
        const activePrebuiltScenarios = PREBUILT_SCENARIOS.filter(s => !deletedPrebuiltIds.includes(s.id));
        
        setScenarios([...activePrebuiltScenarios, ...migratedCustomScenarios]);
    } catch (error) {
        console.error("Failed to load scenarios, falling back to default:", error);
        setScenarios(PREBUILT_SCENARIOS);
        localStorage.removeItem(SCENARIOS_KEY);
    }


    // Load Active Chats
    try {
      const savedChats = localStorage.getItem(ACTIVE_CHATS_KEY);
      if (savedChats) {
        setActiveChats(JSON.parse(savedChats));
      }
    } catch (error) {
      console.error("Failed to load or parse active chats:", error);
      setActiveChats([]);
    }
    
    // Load User Characters
    try {
      const savedCharactersRaw = localStorage.getItem(USER_CHARACTERS_KEY);
      if (savedCharactersRaw) {
        let characters: UserCharacter[] = JSON.parse(savedCharactersRaw);
        let wasUpdated = false;
        characters = characters.map(c => {
            if (!c.id || !UUID_REGEX.test(c.id)) {
                wasUpdated = true;
                return { ...c, id: crypto.randomUUID() };
            }
            return c;
        });
        setUserCharacters(characters);
        if (wasUpdated) {
             localStorage.setItem(USER_CHARACTERS_KEY, JSON.stringify(characters));
        }
      } else {
        const defaultCharacter: UserCharacter = {
          id: crypto.randomUUID(),
          name: "Steve",
          description: "A tall, breathtakingly handsome man with chiseled features and captivating presence. He carries a quiet yet intense aura, craving deep, meaningful connections. Caring, romantic, and fiercely loyal.",
          portrait: undefined
        };
        setUserCharacters([defaultCharacter]);
        localStorage.setItem(USER_CHARACTERS_KEY, JSON.stringify([defaultCharacter]));
      }
    } catch (error) {
      console.error("Failed to load or parse user characters, falling back to default:", error);
      const defaultCharacter: UserCharacter = {
          id: crypto.randomUUID(),
          name: "Steve",
          description: "A tall, breathtakingly handsome man with chiseled features and captivating presence. He carries a quiet yet intense aura, craving deep, meaningful connections. Caring, romantic, and fiercely loyal.",
          portrait: undefined
        };
      setUserCharacters([defaultCharacter]);
    }
  }, []);
  
  const handleSaveCharacters = (updatedCharacters: UserCharacter[]) => {
    setUserCharacters(updatedCharacters);
    try {
      localStorage.setItem(USER_CHARACTERS_KEY, JSON.stringify(updatedCharacters));
    } catch (error) {
      console.error(error);
      showAlert("Storage Error", "Failed to save data. Please check your storage space.");
    }

    // Sync character updates to any active chats using them
    const updatedActiveChats = activeChats.map(chat => {
        const correspondingUpdatedChar = updatedCharacters.find(uc => uc.id === chat.userCharacter.id);
        // If the character in the chat exists in the updated global list, sync it.
        if (correspondingUpdatedChar) {
            return { ...chat, userCharacter: correspondingUpdatedChar };
        }
        return chat;
    });

    // Only update state and storage if there was a meaningful change
    if (JSON.stringify(updatedActiveChats) !== JSON.stringify(activeChats)) {
        setActiveChats(updatedActiveChats);
        try {
          localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedActiveChats));
        } catch (error) {
          console.error(error);
          showAlert("Storage Error", "Failed to save data. Please check your storage space.");
        }
    }
  };

  const handleViewScenarioDetails = useCallback((scenario: Scenario) => {
    setViewedScenario(scenario);
    setCurrentScreen('scenario_details');
  }, []);
  
  const handleStartFromDetails = useCallback(() => {
    if (!viewedScenario) return;
    setScenarioForSelection(viewedScenario);
    setViewedScenario(null);
    setCurrentScreen('character_selector');
  }, [viewedScenario]);
  
  const handleCustomizeScenario = useCallback(() => {
    if (!viewedScenario) return;
    setEditingScenario(viewedScenario);
    setViewedScenario(null);
    setCurrentScreen('scenario_editor');
  }, [viewedScenario]);

  const handleCharacterSelect = useCallback((character: UserCharacter) => {
    if (!scenarioForSelection) return;

    const id = crypto.randomUUID();
    const newChat: ActiveChat = {
      id,
      scenario: scenarioForSelection,
      userCharacter: character,
      lastUpdate: Date.now(),
      memoryBank: [],
    };

    const updatedChats = [newChat, ...activeChats.filter(c => c.id !== id)];
    setActiveChats(updatedChats);
    try {
      localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));
    } catch (error) {
      console.error(error);
      showAlert("Storage Error", "Failed to save data. Please check your storage space.");
    }

    setCurrentChat(newChat);
    setScenarioForSelection(null);
    setCurrentScreen('story_view');
  }, [scenarioForSelection, activeChats]);

  const handleExitStory = useCallback((finalMemoryBank: string[]) => {
    if (currentChat) {
      const updatedChats = activeChats.map(c =>
        c.id === currentChat.id ? { ...c, lastUpdate: Date.now(), memoryBank: finalMemoryBank.slice(-50) } : c
      );
      updatedChats.sort((a, b) => b.lastUpdate - a.lastUpdate);
      setActiveChats(updatedChats);
      try {
        localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));
      } catch (error) {
        console.error(error);
        showAlert("Storage Error", "Failed to save data. Please check your storage space.");
      }
    }
    setCurrentChat(null);
    setCurrentScreen('scenario_selector');
  }, [currentChat, activeChats]);
  
  const handleResumeChat = useCallback((chatToResume: ActiveChat) => {
    setCurrentChat(chatToResume);
    setCurrentScreen('story_view');
  }, []);

  const handleDeleteChat = useCallback((chatId: string) => {
    setConfirmation({
      title: "Delete Chat History",
      message: "Are you sure you want to permanently delete this chat history? This action cannot be undone.",
      onConfirm: () => {
        const updatedChats = activeChats.filter(c => c.id !== chatId);
        setActiveChats(updatedChats);
        try {
          localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedChats));
        } catch (error) {
          console.error(error);
          showAlert("Storage Error", "Failed to save data. Please check your storage space.");
        }
        try {
          localStorage.removeItem(`${CHAT_HISTORY_PREFIX}${chatId}`);
        } catch (error) {
          console.error(error);
        }
        setConfirmation(null);
      }
    });
  }, [activeChats]);
  
  const handleBackToScenarioList = useCallback(() => {
    setViewedScenario(null);
    setEditingScenario(null);
    setCurrentScreen('scenario_selector');
  }, []);

  const handleBackToDetails = useCallback(() => {
    if (!scenarioForSelection) return;
    setViewedScenario(scenarioForSelection);
    setScenarioForSelection(null);
    setCurrentScreen('scenario_details');
  }, [scenarioForSelection]);

  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      if (currentScreen === 'story_view') {
        handleExitStory(currentChat?.memoryBank || []);
      } else if (
        currentScreen === 'scenario_editor' ||
        currentScreen === 'profile' ||
        currentScreen === 'chats_list' ||
        currentScreen === 'scenario_details'
      ) {
        setCurrentScreen('scenario_selector');
      } else if (currentScreen === 'character_selector') {
        setCurrentScreen('scenario_details');
      } else if (currentScreen === 'scenario_selector') {
        CapacitorApp.minimizeApp();
      }
    });
    return () => {
      backButtonListener.then((l) => l.remove());
    };
  }, [currentScreen, currentChat, handleExitStory]);

  const handleNavigate = (view: View) => {
    setCurrentChat(null);
    setScenarioForSelection(null);
    setViewedScenario(null);
    setEditingScenario(null);
    if (view === 'home') {
      setCurrentScreen('scenario_selector');
    } else if (view === 'create') {
      setCurrentScreen('scenario_editor');
    } else if (view === 'profile') {
      setCurrentScreen('profile');
    } else if (view === 'chats') {
        setCurrentScreen('chats_list');
    }
  };
  
  const handleSaveScenario = (scenarioToSave: Scenario) => {
    let savedCustomScenariosRaw = null;
    try {
      savedCustomScenariosRaw = localStorage.getItem(SCENARIOS_KEY);
    } catch (error) {
      console.error(error);
    }
    let customScenarios: Scenario[] = savedCustomScenariosRaw ? JSON.parse(savedCustomScenariosRaw) : [];

    const isOriginallyPrebuilt = PREBUILT_SCENARIOS.some(s => s.id === editingScenario?.id);
    let newCustomScenario: Scenario | null = null;

    if (isOriginallyPrebuilt) {
        let newName = scenarioToSave.name === editingScenario!.name 
            ? `${scenarioToSave.name} (Custom)` 
            : scenarioToSave.name;
        
        let nameExists = scenarios.some(s => s.name.toLowerCase() === newName.toLowerCase());
        let counter = 2;
        let baseName = newName;
        while (nameExists) {
            baseName = baseName.replace(/ \(\d+\)$/, '').replace(/ \(Custom\)$/, '');
            newName = `${baseName} (Custom ${counter})`;
            nameExists = scenarios.some(s => s.name.toLowerCase() === newName.toLowerCase());
            counter++;
        }

        newCustomScenario = {
            ...scenarioToSave,
            id: `custom-${crypto.randomUUID()}`,
            name: newName,
        };
        customScenarios = [newCustomScenario, ...customScenarios];
    } else {
        const isNameTaken = scenarios.some(
            s => s.name.toLowerCase() === scenarioToSave.name.toLowerCase() && s.id !== scenarioToSave.id
        );
        if (isNameTaken) {
            showAlert("Name Conflict", "A scenario with this name already exists. Please choose a different name.");
            return; // Stop the save process
        }

        const existsInCustom = customScenarios.some(s => s.id === scenarioToSave.id);
        if (existsInCustom) {
            customScenarios = customScenarios.map(s => s.id === scenarioToSave.id ? scenarioToSave : s);
        } else {
            customScenarios = [scenarioToSave, ...customScenarios];
        }
    }

    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(customScenarios));
    } catch (error) {
      console.error(error);
      showAlert("Storage Error", "Failed to save data. Please check your storage space.");
    }

    let deletedPrebuiltIdsRaw = null;
    try {
      deletedPrebuiltIdsRaw = localStorage.getItem(DELETED_PREBUILT_SCENARIOS_KEY);
    } catch (error) {
      console.error(error);
    }
    const deletedPrebuiltIds: string[] = deletedPrebuiltIdsRaw ? JSON.parse(deletedPrebuiltIdsRaw) : [];
    const activePrebuiltScenarios = PREBUILT_SCENARIOS.filter(s => !deletedPrebuiltIds.includes(s.id));
    
    const allAvailableScenarios = [...activePrebuiltScenarios, ...customScenarios];
    setScenarios(allAvailableScenarios);

    const updatedActiveChats = activeChats.map(chat => {
        const correspondingUpdatedScenario = allAvailableScenarios.find(s => s.id === chat.scenario.id);
        if (correspondingUpdatedScenario) {
            return { ...chat, scenario: correspondingUpdatedScenario };
        }
        return chat;
    });

    if (JSON.stringify(updatedActiveChats) !== JSON.stringify(activeChats)) {
        setActiveChats(updatedActiveChats);
        try {
          localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedActiveChats));
        } catch (error) {
          console.error(error);
          showAlert("Storage Error", "Failed to save data. Please check your storage space.");
        }
    }
    
    setEditingScenario(null);
    setCurrentScreen('scenario_selector');
};

  const handleDeleteScenario = useCallback((scenarioIdToDelete: string) => {
    const scenarioToDelete = scenarios.find(s => s.id === scenarioIdToDelete);
    if (!scenarioToDelete) return;

    const isScenarioInUse = activeChats.some(chat => chat.scenario.id === scenarioIdToDelete);
    if (isScenarioInUse) {
        showAlert("Cannot Delete Scenario", "This scenario is being used in an active chat. Please delete the chat before deleting the scenario.");
        return;
    }

    setConfirmation({
        title: "Delete Scenario",
        message: `Are you sure you want to delete the scenario "${scenarioToDelete.name}"? This cannot be undone.`,
        onConfirm: () => {
            const isPrebuilt = PREBUILT_SCENARIOS.some(s => s.id === scenarioIdToDelete);

            if (isPrebuilt) {
                let deletedPrebuiltIdsRaw = null;
                try {
                  deletedPrebuiltIdsRaw = localStorage.getItem(DELETED_PREBUILT_SCENARIOS_KEY);
                } catch (error) {
                  console.error(error);
                }
                const deletedPrebuiltIds: string[] = deletedPrebuiltIdsRaw ? JSON.parse(deletedPrebuiltIdsRaw) : [];
                if (!deletedPrebuiltIds.includes(scenarioIdToDelete)) {
                    deletedPrebuiltIds.push(scenarioIdToDelete);
                    try {
                      localStorage.setItem(DELETED_PREBUILT_SCENARIOS_KEY, JSON.stringify(deletedPrebuiltIds));
                    } catch (error) {
                      console.error(error);
                      showAlert("Storage Error", "Failed to save data. Please check your storage space.");
                    }
                }
            } else {
                let savedCustomScenariosRaw = null;
                try {
                  savedCustomScenariosRaw = localStorage.getItem(SCENARIOS_KEY);
                } catch (error) {
                  console.error(error);
                }
                let customScenarios: Scenario[] = savedCustomScenariosRaw ? JSON.parse(savedCustomScenariosRaw) : [];
                const updatedCustomScenarios = customScenarios.filter(s => s.id !== scenarioIdToDelete);
                try {
                  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updatedCustomScenarios));
                } catch (error) {
                  console.error(error);
                  showAlert("Storage Error", "Failed to save data. Please check your storage space.");
                }
            }

            const updatedScenarios = scenarios.filter(s => s.id !== scenarioIdToDelete);
            setScenarios(updatedScenarios);
            // If we deleted the scenario we were just viewing, go back to the list.
            if (viewedScenario?.id === scenarioIdToDelete) {
                setViewedScenario(null);
                setCurrentScreen('scenario_selector');
            }
            setConfirmation(null);
        }
    });
  }, [activeChats, scenarios, viewedScenario]);

  const handleDeleteAndViewedScenario = useCallback(() => {
    if (!viewedScenario) return;
    handleDeleteScenario(viewedScenario.id)
  }, [viewedScenario, handleDeleteScenario]);
  
  const handleUpdateUserCharacter = (chatId: string, updatedCharacter: UserCharacter) => {
    if (!updatedCharacter.id) {
      console.error("Attempted to update a character without an ID.");
      return;
    }
    
    if (userCharacters.some(c => c.id !== updatedCharacter.id && c.name.toLowerCase() === updatedCharacter.name.toLowerCase())) {
        showAlert("Name Conflict", "A character with this name already exists. Please choose a different name.");
        return;
    }

    // 1. Update the global list of characters and persist it.
    const characterExistsInGlobalList = userCharacters.some(char => char.id === updatedCharacter.id);
    let updatedGlobalCharacters;
    if (characterExistsInGlobalList) {
        updatedGlobalCharacters = userCharacters.map(char => 
            char.id === updatedCharacter.id ? updatedCharacter : char
        );
    } else {
        updatedGlobalCharacters = [...userCharacters, updatedCharacter];
    }
    setUserCharacters(updatedGlobalCharacters);
    try {
      localStorage.setItem(USER_CHARACTERS_KEY, JSON.stringify(updatedGlobalCharacters));
    } catch (error) {
      console.error(error);
      showAlert("Storage Error", "Failed to save data. Please check your storage space.");
    }

    // 2. Sync this change to all active chats, adding a timestamp to the specific one being edited.
    const updatedActiveChats = activeChats.map(chat => {
        let chatNeedsUpdate = false;
        let updatedCharForChat = chat.userCharacter;

        if (chat.userCharacter.id === updatedCharacter.id) {
            chatNeedsUpdate = true;
            updatedCharForChat = updatedCharacter;
        }
        
        if (chatNeedsUpdate) {
            const isTargetChat = chat.id === chatId;
            return { 
                ...chat, 
                userCharacter: updatedCharForChat, 
                ...(isTargetChat && { lastUpdate: Date.now() })
            };
        }
        
        return chat;
    });

    setActiveChats(updatedActiveChats);
    try {
      localStorage.setItem(ACTIVE_CHATS_KEY, JSON.stringify(updatedActiveChats));
    } catch (error) {
      console.error(error);
      showAlert("Storage Error", "Failed to save data. Please check your storage space.");
    }
    
    // 3. Update currentChat state for immediate UI reflection.
    if (currentChat?.id === chatId) {
      const newCurrentChat = updatedActiveChats.find(c => c.id === chatId);
      if(newCurrentChat) {
          setCurrentChat(newCurrentChat);
      }
    }
  };

  const getActiveView = (): View => {
    switch(currentScreen) {
        case 'scenario_editor': return 'create';
        case 'profile': return 'profile';
        case 'chats_list': return 'chats';
        case 'scenario_selector':
        case 'scenario_details':
        case 'character_selector':
        case 'story_view':
        default:
          return 'home';
    }
  };

  let content;
  switch (currentScreen) {
    case 'scenario_details':
      if (viewedScenario) {
        content = <ScenarioDetailView 
          scenario={viewedScenario} 
          onStart={handleStartFromDetails} 
          onCustomize={handleCustomizeScenario}
          onBack={handleBackToScenarioList}
          onDelete={handleDeleteAndViewedScenario}
        />;
      } else {
        setCurrentScreen('scenario_selector'); // Failsafe
      }
      break;
    case 'character_selector':
      if (scenarioForSelection) {
        content = <CharacterSelector characters={userCharacters} onSaveCharacters={handleSaveCharacters} onCharacterSelected={handleCharacterSelect} onBack={handleBackToDetails} activeChats={activeChats} showAlert={showAlert} />;
      } else {
        setCurrentScreen('scenario_selector'); // Failsafe
      }
      break;
    case 'story_view':
      if (currentChat) {
        content = <StoryView chat={currentChat} onExit={handleExitStory} onUpdateUserCharacter={handleUpdateUserCharacter} />;
      } else {
        setCurrentScreen('scenario_selector'); // Failsafe
      }
      break;
    case 'scenario_editor':
      content = <ScenarioEditor key={editingScenario?.id || 'new-scenario'} onSave={handleSaveScenario} onBack={handleBackToScenarioList} initialData={editingScenario} />;
      break;
    case 'profile':
      content = <ProfileScreen characters={userCharacters} onSaveCharacters={handleSaveCharacters} activeChats={activeChats} showAlert={showAlert}/>;
      break;
    case 'chats_list':
        content = <ChatsScreen chats={activeChats} onResumeChat={handleResumeChat} onDeleteChat={handleDeleteChat}/>;
        break;
    case 'scenario_selector':
    default:
      content = (
        <ScenarioSelector
          scenarios={scenarios}
          onSelectScenario={handleViewScenarioDetails}
          onStartCreation={() => { setEditingScenario(null); setCurrentScreen('scenario_editor'); }}
          onDeleteScenario={handleDeleteScenario}
        />
      );
  }

  const showHeaderAndNav = !['story_view'].includes(currentScreen);

  return (
    <div className={`w-full min-h-screen ${showHeaderAndNav ? 'pt-20 pb-20' : ''}`}>
      {confirmation && (
        <Suspense fallback={<div>Loading...</div>}>
          <ConfirmationModal
            isOpen={!!confirmation}
            title={confirmation.title}
            message={confirmation.message}
            onConfirm={confirmation.onConfirm}
            onClose={() => setConfirmation(null)}
          />
        </Suspense>
      )}
       {alert && (
        <Suspense fallback={<div>Loading...</div>}>
          <AlertModal
            isOpen={!!alert}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        </Suspense>
      )}
      {showHeaderAndNav && <Header onProfileClick={() => handleNavigate('profile')} />}
      <main className={`w-full h-full ${showHeaderAndNav ? 'px-4 sm:px-6' : ''}`}>
        <Suspense fallback={<div>Loading...</div>}>
          {content}
        </Suspense>
      </main>
      {showHeaderAndNav && <Suspense fallback={<div>Loading...</div>}><BottomNavBar activeView={getActiveView()} onNavigate={handleNavigate} /></Suspense>}
    </div>
  );
};

export default App;