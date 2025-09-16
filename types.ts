
export interface ScenarioCharacter {
  name: string;
  role: string;
  personality: string;
  backstory: string;
  portrait?: string;
}

export interface Scenario {
  name:string;
  description: string;
  image?: string;
  tags: string[];
  worldDetails: string;
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
  name:string;
  description: string;
  portrait?: string;
}

// A single generated response from the model, including narrative, dialogue, and actions
export interface ModelResponsePart {
  narrative: string;
  dialogue?: string; // The part of the narrative to highlight
  suggestedActions: string[];
}

// A message in the chat history
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  // For user roles, it's just a simple string message
  text?: string;
  // For model roles, it contains potentially multiple generated parts for regeneration
  parts?: ModelResponsePart[];
  currentPartIndex: number;
}


export interface ActiveChat {
  id: string;
  scenario: Scenario;
  userCharacter: UserCharacter;
  lastUpdate: number;
}
