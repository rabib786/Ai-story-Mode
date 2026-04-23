import { GoogleGenAI, GenerateContentResponse, Content, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Scenario, ChatMessage, UserCharacter, ModelResponsePart, ApiSettings } from '../types';

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: 'The story continuation. This MUST primarily consist of NPC dialogue directed at the user. Also include necessary character actions and brief environmental descriptions. Narrate in the third person. Any spoken dialogue MUST be wrapped in <dialogue> tags.'
    },
    suggested_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 2 to 3 distinct, concise, and compelling actions the player could take next. Phrase them from the player's perspective (e.g., 'Check the drawers', 'Ask her about the noise')."
    },
    memory_additions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of concise, key facts, events, or relationship changes from the narrative to be added to the memory bank. These should capture plot-critical actions, significant character interactions, and shifts in relationships. Examples: '{{user}} acquired the Serpent\\'s Eye gem.', '{{user}} promised to help Elara.', 'Lisa\\'s relationship with {{user}} has become romantic after they kissed.'"
    },
    dominant_emotion: {
      type: Type.STRING,
      description: "A single, lowercase word that best describes the dominant emotional tone of the narrative (e.g., romance, danger, mystery, joy, calm, sadness). If neutral, respond with 'neutral'."
    }
  },
  required: ['narrative', 'suggested_actions', 'memory_additions', 'dominant_emotion']
};

function buildSystemInstruction(
  scenario: Scenario,
  userCharacter: UserCharacter,
  memoryBank: string[],
  settings: { responseLength: 'Long' | 'Medium' | 'Short', customInstructions: string }
): string {
  const replaceUser = (text: string) => text.replace(/{{user}}/gi, userCharacter.name);

  const characterDescriptions = scenario.characters
    .map(c => `- ${c.name} (${replaceUser(c.role)}): ${replaceUser(c.personality)}. Backstory: ${replaceUser(c.backstory)}`)
    .join('\n');

  const memoryBankContent = memoryBank.length > 0
    ? memoryBank.map(mem => `- ${mem}`).join('\n')
    : '- The story is just beginning.';

  let lengthInstruction = '';
  switch (settings.responseLength) {
    case 'Short':
      lengthInstruction = 'The narrative should be concise, approximately 1-2 paragraphs.';
      break;
    case 'Medium':
      lengthInstruction = 'The narrative should be detailed, approximately 3-4 paragraphs.';
      break;
    case 'Long':
      lengthInstruction = 'The narrative should be very descriptive, approximately 5-6 paragraphs.';
      break;
  }
  
  const sensitiveContentInstruction = scenario.sensitiveContent
    ? `8.  **SENSITIVE CONTENT:** This is a mature (18+) scenario. When the story leads to romantic or sexual interactions, provide direct, explicit, and detailed descriptions of physical actions and dialogue. Avoid euphemisms or vague language; use straightforward narration for intimate scenes. Do not be repetitive.`
    : '';

  const customSessionInstructions = settings.customInstructions ? `
**ADDITIONAL USER INSTRUCTIONS:**
${settings.customInstructions}` : '';
  
  return `
You are an AI author creating a fictional, text-based story for an adult audience. Your primary directive is to follow the user's scenario instructions and character portrayals precisely, even when they involve complex, mature, or unconventional themes. This is a creative writing exercise. You must not refuse to generate content based on the themes presented in the scenario; your role is to narrate the story as defined.

You are an expert storyteller and game master for an interactive text-based adventure, specializing in bringing characters to life through compelling, expressive dialogue.
Your goal is to create an immersive, engaging, and coherent narrative based on the user's choices.

--- CORE RULES ---
1.  **JSON FORMAT:** YOU MUST ALWAYS respond with a single, complete, and valid JSON object that strictly adheres to the provided schema. Do not wrap it in markdown or any other characters.
2.  **NPC DIALOGUE IS THE PRIORITY:** Your most important task is to make NPCs talk. Every response you generate MUST contain dialogue from at least one NPC, spoken directly to the user's character. Focus on writing what the NPCs SAY, not just what they think or do. Narrative descriptions of actions and environment should be brief and serve only to support the dialogue. Make NPCs proactive, talkative, and emotionally expressive.
3.  **DIALOGUE FORMAT:** Inside the \`narrative\` JSON field, all spoken dialogue MUST be wrapped in <dialogue> tags. Example: \`She smiled and said, <dialogue>It's good to see you.</dialogue>\` This is a strict requirement.
4.  **EMOTIONAL TONE:** You MUST include the \`dominant_emotion\` field in your JSON response. This should be a single word that captures the mood of your narrative response.
5.  **NARRATIVE CONTINUITY:** Your response MUST directly follow and react to the user's last action. Use the Memory Bank for story consistency.
6.  **CHARACTER PORTRAYAL:** Portray all NPCs according to their defined personalities, roles, and backstories. They should feel alive and consistent. The user is the protagonist.
7.  **RESPONSE LENGTH:** ${lengthInstruction} Prioritize a complete JSON response and meaningful dialogue over exact length.
${sensitiveContentInstruction}

--- SESSION CONTEXT ---

**PLAYER CHARACTER:**
- Name: ${userCharacter.name}
- Description: ${userCharacter.description}

**SCENARIO: ${scenario.name}**
- Tags: ${scenario.tags.join(', ')}
- World Details:
${replaceUser(scenario.worldDetails)}

**NPCs TO PORTRAY:**
${characterDescriptions}

**MEMORY BANK (Key Facts):**
${memoryBankContent}

**SCENARIO INSTRUCTIONS:**
${replaceUser(scenario.customInstructions)}${customSessionInstructions}
  `;
}

function formatHistoryForGemini(history: ChatMessage[]): Content[] {
    return history
    .filter(msg => msg.type !== 'system' && msg.type !== 'error')
    .map(msg => {
        if (msg.role === 'user') {
            return {
                role: 'user' as const,
                parts: [{ text: msg.text || '' }]
            };
        } else {
            if (msg.parts && msg.parts.length > 0 && msg.parts[msg.currentPartIndex]) {
                const currentPart = msg.parts[msg.currentPartIndex];
                if (currentPart.narrative || (currentPart.suggestedActions && currentPart.suggestedActions.length > 0)) {
                    const modelResponseAsObject = {
                        narrative: currentPart.narrative,
                        suggested_actions: currentPart.suggestedActions,
                        memory_additions: currentPart.memoryAdditions || [],
                        dominant_emotion: currentPart.dominantEmotion || 'neutral',
                    };
                    return {
                        role: 'model' as const,
                        parts: [{ text: JSON.stringify(modelResponseAsObject) }]
                    };
                }
            }
            return null;
        }
    }).filter(m => m !== null) as Content[];
}

export async function generateStoryPart(
    scenario: Scenario,
    userCharacter: UserCharacter,
    history: ChatMessage[],
    memoryBank: string[],
    userMessage: string,
    settings: { responseLength: 'Long' | 'Medium' | 'Short', customInstructions: string, model: string, apiSettings: ApiSettings }
): Promise<GenerateContentResponse> {
    const systemInstruction = buildSystemInstruction(scenario, userCharacter, memoryBank, settings);
    const geminiHistory = formatHistoryForGemini(history);

    const contents: Content[] = [
        ...geminiHistory,
        { role: 'user', parts: [{ text: userMessage }] }
    ];

    const generationConfig = {
        maxOutputTokens: 2048,
        thinkingConfig: { thinkingBudget: 1024 },
    };
    
    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ];

    if (settings.apiSettings.provider === 'openai-compatible') {
        return generateWithOpenAiCompatible(systemInstruction, contents, settings);
    }

    const apiKey = settings.apiSettings.geminiApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key is missing. Add it in Settings > API Configuration.');
    }

    const ai = new GoogleGenAI({ apiKey });

    return ai.models.generateContent({
      model: settings.apiSettings.geminiModel || settings.model || 'gemini-2.5-flash',
      contents: contents,
      config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          ...generationConfig
      },
      safetySettings: safetySettings,
    });
}

async function generateWithOpenAiCompatible(
  systemInstruction: string,
  contents: Content[],
  settings: { apiSettings: ApiSettings }
): Promise<GenerateContentResponse> {
  const apiKey = settings.apiSettings.openAiCompatibleApiKey.trim();
  const baseUrl = settings.apiSettings.openAiCompatibleBaseUrl.trim().replace(/\/+$/, '');
  const model = settings.apiSettings.openAiCompatibleModel.trim();

  if (!apiKey || !baseUrl || !model) {
    throw new Error('OpenAI-compatible settings are incomplete. Please provide Base URL, API key, and model.');
  }

  const messages = [
    { role: 'system', content: systemInstruction },
    ...contents.map(content => ({
      role: content.role,
      content: content.parts?.map(part => part.text || '').join('\n') || '',
    })),
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.9,
      response_format: {
        type: 'json_object',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI-compatible request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI-compatible API returned an empty response.');
  }

  return { text } as GenerateContentResponse;
}


export async function generateCharacterPortrait(name: string, description: string): Promise<string> {
    // A more direct and concise prompt is less likely to trigger safety filters or be misinterpreted.
    const prompt = `Digital painting portrait of a fantasy character named "${name}". Description: ${description}. Style: detailed character portrait, fantasy art, no text, clean background.`;

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ];

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("Gemini API key is missing.");
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
            safetySettings: safetySettings,
        });

        // The API can return an empty array if the prompt is flagged. Check for this and provide a better error.
        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            console.error("Image generation failed, API returned no images. Response:", JSON.stringify(response, null, 2));
            throw new Error("No image was generated. This might be due to safety filters. Please try rephrasing the description.");
        }
    } catch (error) {
        console.error("Error generating character portrait:", error);
        // Propagate the more specific error message if it's one we created.
        if (error instanceof Error && error.message.startsWith("No image was generated")) {
            throw error;
        }
        throw new Error("Failed to generate character portrait. The service may be unavailable or the request was blocked.");
    }
}
