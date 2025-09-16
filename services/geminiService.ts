import { GoogleGenAI, Chat, GenerateContentResponse, Content, Type } from "@google/genai";
import { Scenario, ChatMessage, UserCharacter, ModelResponsePart } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: 'The story continuation, including environment descriptions and character actions. Narrate in the third person.' },
    dialogue: { type: Type.STRING, description: "A single, complete, direct quote of speech from an NPC in the narrative. This text must be an exact substring of the narrative. If there is no dialogue, return an empty string." },
    actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 2 to 3 distinct, concise, and compelling actions the player could take next. Phrase them from the player's perspective (e.g., 'Check the drawers', 'Ask her about the noise')."
    }
  }
};

function buildSystemInstruction(scenario: Scenario, userCharacter: UserCharacter): string {
  const characterDescriptions = scenario.characters
    .map(c => `- ${c.name} (${c.role}): ${c.personality}. Backstory: ${c.backstory}`)
    .join('\n');

  const customInstructionsWithAdvisory = scenario.customInstructions + 
    (scenario.sensitiveContent 
      ? "\n\n**Content Advisory:** This scenario is marked for sensitive content (18+). Handle mature themes with narrative weight and discretion." 
      : "");

  return `
You are an expert storyteller and game master for an interactive text-based adventure.
Your goal is to create an immersive, engaging, and coherent narrative based on the user's choices.
Adhere strictly to the following rules:
1.  **Acknowledge the Protagonist:** The user is playing as their own character, who is the protagonist of this story. Their details are below. Address them by name and weave their backstory into the narrative.
2.  **Stay in Character:** Portray all non-player characters (NPCs) according to their defined personalities and roles.
3.  **Describe the World:** Richly describe the environment, sounds, and atmosphere based on the World Details to bring the setting to life.
4.  **Drive the Narrative:** Respond to the user's actions and advance the plot. Introduce challenges, mysteries, or conflicts.
5.  **Acknowledge User's Actions:** Your response must directly follow and react to the user's last message.
6.  **Follow Instructions:** Strictly adhere to the Custom Scenario Instructions provided.
7.  **JSON Output:** YOU MUST ALWAYS respond with a JSON object that conforms to the provided schema. Provide a narrative, any spoken dialogue as a separate string, and a list of suggested actions for the player.

--- PLAYER CHARACTER ---
Name: ${userCharacter.name}
Description: ${userCharacter.description}

--- SCENARIO BRIEFING ---

**Title:** ${scenario.name}
**Tags:** ${scenario.tags.join(', ')}

**World Details:**
${scenario.worldDetails}

**Characters to Portray:**
${characterDescriptions}

**Custom Scenario Instructions:**
${customInstructionsWithAdvisory}

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


export const startChat = (scenario: Scenario, userCharacter: UserCharacter, history: ChatMessage[] = []): Chat => {
  const systemInstruction = buildSystemInstruction(scenario, userCharacter);
  const geminiHistory = formatHistoryForGemini(history);

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
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
  // We send an empty message to trigger the initial response.
  return chat.sendMessageStream({ message: "Begin." });
};

export const sendMessageStream = async (chat: Chat, message: string) => {
  return chat.sendMessageStream({ message });
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