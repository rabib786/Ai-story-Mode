
export interface CharacterArc {
  goals: string[];
  conflict: string;
  growthCheckpoints: string[];
}

export interface RelationshipState {
  targetCharacterId: string; // id or name
  level: number; // e.g. -100 to 100
  label: string; // e.g. "trust", "rivalry"
  history: string[]; // logs of changes
}

export interface ScenarioCharacter {
  name: string;
  role: string;
  personality: string;
  backstory: string;
  portrait?: string;
}

export interface Scenario {
  id: string;
  name:string;
  description: string;
  image?: string;
  tags: string[];
  worldDetails: string;
  introduction?: string;
  greetingMessage?: string;
  customInstructions: string;
  characters: ScenarioCharacter[];
  views: number;
  rating: number;
  
  // Settings
  forceCharacter?: string;
  separateUserCharacter: boolean;
  sensitiveContent: boolean;
  publicScenario: boolean;
  allowStoryCustomization: boolean;
  hideScenarioPrompts: boolean;
  allowCommenting: boolean;
}

export interface UserCharacter {
  id: string;
  name:string;
  description: string;
  portrait?: string;
}

// A single generated response from the model, including narrative, dialogue, and actions
export interface ModelResponsePart {
  narrative: string;
  suggestedActions: string[];
  memoryAdditions?: string[]; // Key facts from the narrative to remember
  dominantEmotion?: string; // e.g., 'romance', 'danger', 'mystery', 'calm'
}

// A message in the chat history
export interface ChatMessage {
  id:string;
  role: 'user' | 'model';
  type?: 'system' | 'error'; // Used to identify UI-only messages that shouldn't be sent to the AI
  // For user roles, it's just a simple string message
  text?: string;
  apiContent?: string; // Stores the full message sent to the API, including memory context.
  // For model roles, it contains potentially multiple generated parts for regeneration
  parts?: ModelResponsePart[];
  currentPartIndex: number;
}


export interface ActiveChat {
  id: string;
  scenario: Scenario;
  userCharacter: UserCharacter;
  lastUpdate: number;
  memoryBank: MemoryEntry[];

    // Phase 2: Branching Timeline
    rootChatId?: string; // The ID of the original chat this branch descends from (or its own id if root)
    parentId?: string; // The ID of the chat this branch directly forked from
    forkedAtMessageId?: string; // The message ID in the parent chat where the fork occurred

    // Phase 2: Character Depth Features
    characterArcs?: Record<string, CharacterArc>; // Map character name/id to their arc
    relationshipMatrix?: Record<string, Record<string, RelationshipState>>; // charA -> charB -> relationship

}

export type ApiProvider =
  | 'gemini'
  | 'openai'
  | 'openrouter'
  | 'groq'
  | 'together'
  | 'deepseek'
  | 'cerebras'
  | 'sambanova'
  | 'fireworks'
  | 'mistral'
  | 'xai'
  | 'pollinations'
  | 'lmstudio'
  | 'ollama'
  | 'custom';

export interface ApiSettings {
  provider: ApiProvider;
  geminiApiKey: string;
  geminiModel: string;
  openAiCompatibleApiKey: string;
  openAiCompatibleBaseUrl: string;
  openAiCompatibleModel: string;
}

export type MemoryType = 'fact' | 'relationship' | 'hook';

export interface MemoryEntry {
  id: string;
  content: string;
  type: MemoryType;
  confidence: number;
  timestamp: number;
  sourceTurnId?: string;
  locked: boolean;
}
