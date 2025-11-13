import { GoogleGenAI, Type } from "@google/genai";
import type { ImageGenerationConfig, Message } from '../types';

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
            contents: `Tóm tắt prompt của người dùng sau thành một tiêu đề mô tả ngắn gọn không quá 5 từ. Chỉ trả lời bằng văn bản tiêu đề. Prompt: "${prompt}"`,
        });
        return response.text.trim().replace(/"/g, ''); // Clean up potential quotes
    } catch (error) {
        console.error("Error generating title:", error);
        return "Untitled Chat"; // Fallback title
    }
}

export const optimizePrompt = async (messages: Message[]): Promise<OptimizedPromptResponse> => {
  const conversationHistory = messages.map(m => `${m.sender}: ${m.text || m.originalPrompt}`).join('\n');
  const lastUserPrompt = messages[messages.length - 1].text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Bạn là một trợ lý AI chuyên tối ưu hóa prompt tạo ảnh dựa trên một cuộc trò chuyện.
Phân tích toàn bộ lịch sử trò chuyện để hiểu ý tưởng cốt lõi của người dùng và tất cả các yêu cầu sửa đổi sau đó.
Tổng hợp tất cả các yêu cầu thành một prompt duy nhất, gắn kết, và đã được tối ưu hóa BẰNG TIẾNG VIỆT.
Tin nhắn cuối cùng của người dùng là yêu cầu thay đổi gần đây nhất của họ. Phần giải thích của bạn (explanation) cũng phải BẰNG TIẾNG VIỆT và tập trung vào việc bạn đã tích hợp thay đổi mới nhất này như thế nào.

Từ tin nhắn mới nhất của người dùng, hãy xác định các thông số kỹ thuật:
- Tỷ lệ khung hình (Aspect Ratio): Nếu được đề cập (ví dụ: '16:9', 'ảnh dọc'), hãy xác định nó. Tỷ lệ hợp lệ: "1:1", "3:4", "4:3", "9:16", "16:9". Mặc định là tỷ lệ được sử dụng lần cuối, hoặc "1:1".
- Số lượng ảnh (Number of Images): Nếu được đề cập (ví dụ: 'ba phiên bản'), hãy xác định số lượng (1-4). Mặc định là số lượng được sử dụng lần cuối, hoặc 1.

Chỉ trả lời bằng một đối tượng JSON.

Conversation History:
---
${conversationHistory}
---

Latest User Prompt: "${lastUserPrompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimized: {
              type: Type.STRING,
              description: "Prompt hoàn chỉnh, đã được tối ưu hóa bằng tiếng Việt, phản ánh toàn bộ cuộc trò chuyện."
            },
            explanation: {
              type: Type.STRING,
              description: "Một lời giải thích ngắn gọn, thân thiện bằng tiếng Việt về cách yêu cầu mới nhất của người dùng đã được tích hợp."
            },
            config: {
              type: Type.OBJECT,
              properties: {
                aspectRatio: {
                  type: Type.STRING,
                  description: `Tỷ lệ khung hình của ảnh. Phải là một trong các giá trị: "1:1", "3:4", "4:3", "9:16", "16:9".`
                },
                numberOfImages: {
                    type: Type.INTEGER,
                    description: "Số lượng ảnh cần tạo, từ 1 đến 4."
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