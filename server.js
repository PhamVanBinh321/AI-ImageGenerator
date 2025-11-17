import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// --- CORS Configuration ---
// Cho phép request từ mọi nguồn gốc. Trong môi trường production, bạn nên giới hạn lại.
app.use(cors()); 

// Sử dụng body-parser tích hợp của Express để xử lý JSON
app.use(express.json({ limit: '10mb' })); 

// --- Gemini AI Setup ---
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("LỖI NGHIÊM TRỌNG: API_KEY chưa được thiết lập trong biến môi trường. Vui lòng tạo file .env và thêm API_KEY=your_key.");
  process.exit(1); 
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- API Routes ---

app.get('/', (req, res) => {
  res.send('AI Image Generator Backend is running!');
});

app.post('/api/generate-title', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Tóm tắt prompt của người dùng sau thành một tiêu đề mô tả ngắn gọn không quá 5 từ. Chỉ trả lời bằng văn bản tiêu đề. Prompt: "${prompt}"`,
        });
        res.json({ title: response.text.trim().replace(/"/g, '') });
    } catch (error) {
        console.error("Error in /api/generate-title:", error);
        res.status(500).json({ error: 'Failed to generate title due to a server error.' });
    }
});

app.post('/api/optimize-prompt', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Messages array is required.' });
    }
    
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
                        optimized: { type: Type.STRING, description: "Prompt hoàn chỉnh, đã được tối ưu hóa bằng tiếng Việt, phản ánh toàn bộ cuộc trò chuyện." },
                        explanation: { type: Type.STRING, description: "Một lời giải thích ngắn gọn, thân thiện bằng tiếng Việt về cách yêu cầu mới nhất của người dùng đã được tích hợp." },
                        config: {
                            type: Type.OBJECT,
                            properties: {
                                aspectRatio: { type: Type.STRING, description: `Tỷ lệ khung hình của ảnh. Phải là một trong các giá trị: "1:1", "3:4", "4:3", "9:16", "16:9".` },
                                numberOfImages: { type: Type.INTEGER, description: "Số lượng ảnh cần tạo, từ 1 đến 4." }
                            }
                        }
                    },
                    required: ["optimized", "explanation", "config"]
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        
        if (!result.config) result.config = {};
        if (!result.config.aspectRatio) result.config.aspectRatio = '1:1';
        if (!result.config.numberOfImages) result.config.numberOfImages = 1;

        res.json(result);
    } catch (error) {
        console.error("Error in /api/optimize-prompt:", error);
        res.status(500).json({ error: 'Failed to optimize prompt due to a server error.' });
    }
});

const VALID_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

app.post('/api/generate-image', async (req, res) => {
    const { prompt, config } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        const finalAspectRatio = (config?.aspectRatio && VALID_ASPECT_RATIOS.includes(config.aspectRatio)) ? config.aspectRatio : '1:1';
        const finalNumberOfImages = (config?.numberOfImages && config.numberOfImages > 0 && config.numberOfImages <= 4) ? config.numberOfImages : 1;

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
            const imageUrls = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
            res.json({ imageUrls });
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error("Error in /api/generate-image:", error);
        res.status(500).json({ error: 'Failed to generate image due to a server error.' });
    }
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log('--- Hướng dẫn chạy Backend ---');
  console.log('1. Mở terminal, chạy "npm install" tại thư mục gốc của dự án.');
  console.log('2. Tạo một file tên là ".env" tại thư mục gốc.');
  console.log('3. Thêm API Key của bạn vào file .env: API_KEY=your_actual_api_key');
  console.log('4. Chạy "npm start" để khởi động server.');
});
