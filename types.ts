export interface ScenarioCharacter {
  name: string;
  role: string;
  personality: string;
  backstory: string;
  portrait?: string;
}

export interface StoryCard {
  id: string;
  title: string;
  content: string;
  triggers: string[];
  alwaysActive?: boolean;
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
  storyCards?: StoryCard[];
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
  memoryBank: string[];
}

export type ApiProvider = 'gemini' | 'openai-compatible';

export interface ApiSettings {
  provider: ApiProvider;
  geminiApiKey: string;
  geminiModel: string;
  openAiCompatibleApiKey: string;
  openAiCompatibleBaseUrl: string;
  openAiCompatibleModel: string;
}
