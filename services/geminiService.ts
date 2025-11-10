import { GoogleGenAI, Type } from "@google/genai";
import type { ImageGenerationConfig } from '../types';

// Assume process.env.API_KEY is available
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder for a more robust error handling in a real app
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

type OptimizedPromptResponse = {
    optimized: string;
    explanation: string;
    config: ImageGenerationConfig;
};

export const generateTitle = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Summarize the following user prompt into a short, descriptive title of no more than 5 words. Respond with only the title text. Prompt: "${prompt}"`,
        });
        return response.text.trim().replace(/"/g, ''); // Clean up potential quotes
    } catch (error) {
        console.error("Error generating title:", error);
        return "Untitled Chat"; // Fallback title
    }
}

export const optimizePrompt = async (userPrompt: string): Promise<OptimizedPromptResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Enhance the following user prompt for an AI image generator. Add vivid details about lighting, style, composition, and mood. Also, identify technical parameters from the prompt.
- If the user mentions an aspect ratio (e.g., '16:9', 'portrait', 'square'), identify it. Valid aspect ratios are "1:1", "3:4", "4:3", "9:16", "16:9". Default to "1:1".
- If the user asks for multiple images (e.g., 'three versions', '2 images'), identify the number. It should be between 1 and 4. Default to 1.
Respond ONLY with a JSON object. The user prompt is: "${userPrompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimized: {
              type: Type.STRING,
              description: "The enhanced and optimized prompt for the image generator."
            },
            explanation: {
              type: Type.STRING,
              description: "A brief, friendly explanation of the improvements made to the prompt."
            },
            config: {
              type: Type.OBJECT,
              properties: {
                aspectRatio: {
                  type: Type.STRING,
                  description: `The aspect ratio for the image. Must be one of: "1:1", "3:4", "4:3", "9:16", "16:9". Defaults to "1:1".`
                },
                numberOfImages: {
                    type: Type.INTEGER,
                    description: "The number of images to generate, from 1 to 4. Defaults to 1."
                }
              }
            }
          },
          required: ["optimized", "explanation", "config"]
        }
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    // Ensure defaults are set if model omits them
    if (!result.config.aspectRatio) result.config.aspectRatio = '1:1';
    if (!result.config.numberOfImages) result.config.numberOfImages = 1;

    return result;
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    throw new Error("Failed to optimize prompt. The model might be unable to process the request.");
  }
};

const VALID_ASPECT_RATIOS: Array<ImageGenerationConfig['aspectRatio']> = ["1:1", "3:4", "4:3", "9:16", "16:9"];

export const generateImage = async (prompt: string, config?: ImageGenerationConfig): Promise<string[]> => {
  try {
    const finalAspectRatio = (config?.aspectRatio && VALID_ASPECT_RATIOS.includes(config.aspectRatio))
        ? config.aspectRatio
        : '1:1';
    
    const finalNumberOfImages = (config?.numberOfImages && config.numberOfImages > 0 && config.numberOfImages <= 4)
        ? config.numberOfImages
        : 1;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: finalNumberOfImages,
          outputMimeType: 'image/png',
          aspectRatio: finalAspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. Please check the prompt or try again later.");
  }
};