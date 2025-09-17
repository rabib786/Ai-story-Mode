import { GoogleGenAI, Chat, GenerateContentResponse, Content, Type } from "@google/genai";
import { Scenario, ChatMessage, UserCharacter, ModelResponsePart } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: 'The story continuation, including environment descriptions and character actions. Narrate in the third person. Any spoken dialogue MUST be wrapped in <dialogue> tags.' },
    actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 2 to 3 distinct, concise, and compelling actions the player could take next. Phrase them from the player's perspective (e.g., 'Check the drawers', 'Ask her about the noise')."
    },
    memory_additions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of concise, key facts, events, or relationship changes from the narrative to be added to the memory bank. These should capture plot-critical actions, significant character interactions, and shifts in relationships. Examples: '{{user}} acquired the Serpent's Eye gem.', '{{user}} promised to help Elara.', 'Lisa's relationship with {{user}} has become romantic after they kissed.'"
    }
  }
};

function buildSystemInstruction(
  scenario: Scenario, 
  userCharacter: UserCharacter,
  memoryBank: string[],
  settings: { responseLength: 'Long' | 'Medium' | 'Short', customInstructions: string }
): string {
  // Helper to replace {{user}} placeholder with the actual user character's name
  const replaceUser = (text: string) => text.replace(/{{user}}/gi, userCharacter.name);

  const characterDescriptions = scenario.characters
    .map(c => `- ${c.name} (${replaceUser(c.role)}): ${replaceUser(c.personality)}. Backstory: ${replaceUser(c.backstory)}`)
    .join('\n');

  const customInstructionsWithAdvisory = replaceUser(scenario.customInstructions) + 
    (scenario.sensitiveContent 
      ? "\n\n**Content Advisory:** This scenario is marked for sensitive content (18+). Handle mature themes with narrative weight and discretion." 
      : "");
      
  const worldDetails = replaceUser(scenario.worldDetails);

  const lengthInstruction = `Your response should be of ${settings.responseLength.toLowerCase()} length.`;
  const sessionInstructions = settings.customInstructions ? `\n**Custom Session Instructions:**\n${settings.customInstructions}` : '';
  
  const memoryBankContent = memoryBank.length > 0 
    ? memoryBank.map(m => `- ${replaceUser(m)}`).join('\n') 
    : 'No memories yet.';


  return `
You are an expert storyteller and game master for an interactive text-based adventure.
Your goal is to create an immersive, engaging, and coherent narrative based on the user's choices.
Adhere strictly to the following rules:
1.  **Acknowledge the Protagonist:** The user is playing as their own character, who is the protagonist of this story. Their details are below. Address them by name and weave their backstory into the narrative.
2.  **Stay in Character:** Portray all non-player characters (NPCs) according to their defined personalities and roles.
3.  **Describe the World:** Richly describe the environment, sounds, and atmosphere based on the World Details to bring the setting to life.
4.  **Drive the Narrative:** Respond to the user's actions and advance the plot. Introduce challenges, mysteries, or conflicts. Your primary goal is to maintain a seamless, immersive narrative. Ensure consistent tone, pacing, and logical progression. Eliminate lag, repetition, or unnatural pauses. The story must feel like a continuous, evolving experience.
5.  **Acknowledge User's Actions:** Your response must directly follow and react to the user's last message.
6.  **Follow Instructions:** Strictly adhere to the Custom Scenario Instructions provided.
7.  **Use the Memory Bank for Continuity and Evolution:** The Memory Bank contains established facts. You MUST refer to it to maintain story consistency. More importantly, use these memories to evolve the world and character relationships. For example, if a memory states 'Lisa and {{user}} shared a kiss', future interactions with Lisa should reflect this newfound intimacy. Promises made should be remembered, and conflicts should have lasting consequences.
8.  **Response Length:** ${lengthInstruction}
9.  **JSON Output:** YOU MUST ALWAYS respond with a JSON object that conforms to the provided schema. Provide a narrative, a list of suggested actions for the player, and a list of key events to add to the memory bank.
10. **Dialogue Formatting:** When an NPC speaks, you MUST wrap their exact dialogue directly within the narrative text using <dialogue> and </dialogue> tags. For example: \`She looked up and said, <dialogue>Hello, {{user}}.</dialogue>\`

--- PLAYER CHARACTER ---
Name: ${userCharacter.name}
Description: ${userCharacter.description}

--- MEMORY BANK ---
Here are key facts and events that have happened so far. Use them to maintain consistency and evolve the story.
${memoryBankContent}

--- SCENARIO BRIEFING ---

**Title:** ${scenario.name}
**Tags:** ${scenario.tags.join(', ')}

**World Details:**
${worldDetails}

**Characters to Portray:**
${characterDescriptions}

**Custom Scenario Instructions:**
${customInstructionsWithAdvisory}${sessionInstructions}

--- STORY BEGINS ---
You will begin the story now. Provide an engaging opening paragraph that addresses the player character by name and draws them into the world. Do not greet the user or break character.
  `;
}

function formatHistoryForGemini(history: ChatMessage[]): Content[] {
    return history.map(msg => {
        if (msg.role === 'user') {
            return { role: msg.role, parts: [{ text: msg.text! }] };
        } else { // model
            const part = msg.parts![msg.currentPartIndex];
            // We only send the narrative part back to the model for context to keep history clean
            return { role: msg.role, parts: [{ text: part.narrative }] };
        }
    });
}


export const startChat = (
  scenario: Scenario, 
  userCharacter: UserCharacter, 
  history: ChatMessage[] = [],
  memoryBank: string[] = [],
  settings: { responseLength: 'Long' | 'Medium' | 'Short', customInstructions: string, model?: string }
): Chat => {
  const systemInstruction = buildSystemInstruction(scenario, userCharacter, memoryBank, settings);
  const geminiHistory = formatHistoryForGemini(history);

  const chat = ai.chats.create({
    model: settings.model || 'gemini-2.5-flash',
    history: geminiHistory,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
    }
  });
  return chat;
};

export const getInitialMessageStream = async (chat: Chat) => {
  // The system instruction already prompts the AI to begin.
  // We send a simple string message to trigger the initial response.
  // FIX: chat.sendMessageStream expects an object with a `message` property.
  return chat.sendMessageStream({ message: "Begin." });
};

export const getInitialMessage = async (chat: Chat): Promise<GenerateContentResponse> => {
  // FIX: chat.sendMessage expects an object with a `message` property.
  return chat.sendMessage({ message: "Begin." });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  // FIX: chat.sendMessageStream expects an object with a `message` property.
  return chat.sendMessageStream({ message });
};

export const sendMessage = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  // FIX: chat.sendMessage expects an object with a `message` property.
  return chat.sendMessage({ message });
};

export const generateCharacterPortrait = async (name: string, description: string): Promise<string> => {
    try {
        const prompt = `A detailed character portrait of ${name}, ${description}. Fantasy digital art style, vibrant colors, character concept art, full face, intricate details.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Failed to generate character portrait:", error);
        if (error instanceof Error) {
            if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
                 throw new Error("Image generation failed because the API quota has been exceeded. Please check your plan and billing details.");
            }
        }
        throw new Error("An unexpected error occurred during portrait generation. The service may be temporarily unavailable.");
    }
};
