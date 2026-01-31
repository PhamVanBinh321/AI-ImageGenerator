import { Type } from "@google/genai";
import ai from '../config/gemini.js';
import User from '../models/User.js';
import ChatSession from '../models/ChatSession.js';
import { handleGeminiError, isRefusalText } from '../utils/errorHandlers.js';

const VALID_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

export const generateTitle = async (req, res) => {
    const { prompt, sessionId } = req.body;
    if (!prompt || !sessionId) {
        return res.status(400).json({ error: 'Prompt and sessionId are required' });
    }
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Tóm tắt prompt của người dùng sau thành một tiêu đề mô tả ngắn gọn không quá 5 từ. Chỉ trả lời bằng văn bản tiêu đề. Prompt: "${prompt}"`,
        });
        const title = response.text.trim().replace(/"/g, '');

        await ChatSession.updateOne({ _id: sessionId, user: req.user.id }, { title });

        res.json({ title });
    } catch (error) {
        console.error("Error in /api/generate-title:", error);
        const errorInfo = handleGeminiError(error);
        res.status(errorInfo.status).json({ error: errorInfo.message });
    }
};

export const optimizePrompt = async (req, res) => {
    const { messages, sessionId } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0 || !sessionId) {
        return res.status(400).json({ error: 'Messages array and sessionId are required.' });
    }

    const conversationHistory = messages.map(m => `${m.sender}: ${m.text || m.originalPrompt}`).join('\n');
    const lastUserPrompt = messages[messages.length - 1].text;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Bạn là một chuyên gia tối ưu hóa prompt tạo ảnh chuyên nghiệp. Nhiệm vụ của bạn là biến mọi prompt, dù đơn giản hay phức tạp, thành một prompt CHI TIẾT, CẦU KỲ, và CHUYÊN NGHIỆP để tạo ra những bức ảnh chất lượng cao.

NGUYÊN TẮC TỐI ƯU HÓA:
1. LUÔN mở rộng prompt đơn giản thành prompt chi tiết và cầu kỳ
2. Bổ sung các yếu tố nghệ thuật và kỹ thuật một cách tự nhiên và hợp lý
3. Giữ nguyên ý tưởng cốt lõi của người dùng nhưng làm phong phú và chi tiết hơn

KHI PROMPT ĐƠN GIẢN (ví dụ: "con mèo", "ngôi nhà", "phong cảnh"):
- Mở rộng thành mô tả chi tiết với:
  * Style nghệ thuật: realistic, photorealistic, digital art, oil painting, watercolor, anime, cartoon, 3D render, cinematic, v.v.
  * Mood/Atmosphere: warm, cozy, dramatic, peaceful, mysterious, vibrant, serene, energetic, v.v.
  * Lighting: soft natural light, dramatic lighting, golden hour, sunset, studio lighting, rim light, v.v.
  * Composition: close-up, wide shot, rule of thirds, centered composition, dynamic angle, v.v.
  * Chi tiết vật thể: texture, color, size, position, expression, pose, v.v.
  * Background: detailed background, blurred background, environment, setting, v.v.
  * Quality: high quality, highly detailed, professional photography, 8K resolution, sharp focus, v.v.

VÍ DỤ CHUYỂN ĐỔI:
- Input: "con mèo" 
  Output: "Một chú mèo dễ thương, phong cách nhiếp ảnh chân thực, chất lượng cao, ánh sáng tự nhiên mềm mại, tư thế ngồi thanh lịch, đôi mắt to tròn long lanh, bộ lông mượt mà với các sọc vằn đen cam, nền phông cảnh mờ nhẹ tạo độ sâu, góc chụp cận cảnh, màu sắc ấm áp, độ phân giải cao, chi tiết sắc nét, phong cách chuyên nghiệp"

- Input: "ngôi nhà" 
  Output: "Một ngôi nhà đẹp, phong cách kiến trúc hiện đại, nhiếp ảnh chân thực, ánh sáng hoàng hôn vàng ấm, góc chụp rộng, nền trời xanh với mây trắng, cây cối xanh tươi xung quanh, đường dẫn vào nhà, chi tiết kiến trúc tinh tế, màu sắc hài hòa, chất lượng cao, độ phân giải 8K, phong cách cinematic"

KHI PROMPT ĐÃ CHI TIẾT:
- Giữ nguyên các yếu tố đã có
- Tối ưu cấu trúc và thứ tự mô tả
- Bổ sung thêm các yếu tố còn thiếu một cách hợp lý
- Đảm bảo prompt mạch lạc và dễ hiểu

XỬ LÝ LỊCH SỬ TRÒ CHUYỆN:
- Phân tích toàn bộ lịch sử để hiểu ý tưởng cốt lõi và các yêu cầu sửa đổi
- Tổng hợp tất cả yêu cầu thành một prompt duy nhất, gắn kết
- Tin nhắn cuối cùng là yêu cầu thay đổi gần đây nhất

THÔNG SỐ KỸ THUẬT:
- Tỷ lệ khung hình (Aspect Ratio): Xác định từ prompt hoặc giữ nguyên từ lần trước. Hợp lệ: "1:1", "3:4", "4:3", "9:16", "16:9". Mặc định: "1:1"
- Số lượng ảnh: Xác định từ prompt (ví dụ: "ba phiên bản" = 3). Mặc định: 1

QUAN TRỌNG:
- Prompt tối ưu PHẢI bằng TIẾNG VIỆT
- Prompt PHẢI chi tiết, cầu kỳ, chuyên nghiệp (ít nhất 50-100 từ cho prompt đơn giản)
- KHÔNG được giữ nguyên prompt đơn giản, PHẢI mở rộng và làm phong phú
- Phần explanation bằng TIẾNG VIỆT, giải thích cách bạn đã mở rộng và tối ưu prompt

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
                        optimized: { type: Type.STRING, description: "Prompt hoàn chỉnh, CHI TIẾT, CẦU KỲ, CHUYÊN NGHIỆP, đã được tối ưu hóa bằng tiếng Việt, phản ánh toàn bộ cuộc trò chuyện. Prompt PHẢI mở rộng và làm phong phú prompt gốc với các yếu tố nghệ thuật, kỹ thuật, chi tiết. Không được giữ nguyên prompt đơn giản, phải mở rộng thành ít nhất 50-100 từ với style, mood, lighting, composition, details, quality descriptors." },
                        explanation: { type: Type.STRING, description: "Một lời giải thích ngắn gọn, thân thiện bằng tiếng Việt về cách bạn đã mở rộng, làm phong phú và tối ưu hóa prompt. Giải thích các yếu tố nghệ thuật, kỹ thuật bạn đã thêm vào để làm prompt chi tiết và cầu kỳ hơn." },
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

        const refusalDetected = isRefusalText(result?.optimized) || isRefusalText(result?.explanation);
        if (refusalDetected) {
            const refusalMessage = 'Nội dung không phù hợp hoặc bị chặn bởi chính sách an toàn. Vui lòng nhập mô tả khác.';
            const aiErrorMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: '',
                isError: true,
                errorMessage: refusalMessage,
                isOptimizing: false,
                originalPrompt: lastUserPrompt,
            };

            await ChatSession.updateOne(
                { _id: sessionId, user: req.user.id },
                { $push: { messages: { $each: [messages[messages.length - 1], aiErrorMessage] } } }
            );

            return res.status(400).json({ error: refusalMessage });
        }

        if (!result.config) result.config = {};
        if (!result.config.aspectRatio) result.config.aspectRatio = '1:1';
        if (!result.config.numberOfImages) result.config.numberOfImages = 1;

        const aiMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: '',
            isOptimizing: true,
            originalPrompt: lastUserPrompt,
            optimizedPrompt: result.optimized,
            explanation: result.explanation,
            imageConfig: result.config,
        };
        await ChatSession.updateOne(
            { _id: sessionId, user: req.user.id },
            { $push: { messages: { $each: [messages[messages.length - 1], aiMessage] } } }
        );

        res.json({ ...result, messageId: aiMessage.id });
    } catch (error) {
        console.error("Error in /api/optimize-prompt:", error);
        const errorInfo = handleGeminiError(error);
        res.status(errorInfo.status).json({ error: errorInfo.message });
    }
};

export const generateImage = async (req, res) => {
    const { prompt, config, sessionId, messageId } = req.body;
    if (!prompt || !sessionId || !messageId) {
        return res.status(400).json({ error: 'Prompt, sessionId, and messageId are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ error: "User not found." });
    }

    try {
        const finalAspectRatio = (config?.aspectRatio && VALID_ASPECT_RATIOS.includes(config.aspectRatio)) ? config.aspectRatio : '1:1';
        const finalNumberOfImages = (config?.numberOfImages && config.numberOfImages > 0 && config.numberOfImages <= 4) ? config.numberOfImages : 1;

        console.log(`[Generate Image] Request: ${finalNumberOfImages} images, User credits: ${user.credits}`);

        if (user.credits < finalNumberOfImages) {
            return res.status(403).json({
                error: `Bạn không đủ credit. Cần ${finalNumberOfImages} credit để tạo ${finalNumberOfImages} ảnh, nhưng bạn chỉ còn ${user.credits} credit.`
            });
        }

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
            const actualNumberOfImages = imageUrls.length;

            console.log(`[Generate Image] Created: ${actualNumberOfImages} images (Requested: ${finalNumberOfImages})`);

            const creditsBefore = user.credits;
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { $inc: { credits: -actualNumberOfImages } },
                { new: true }
            );

            console.log(`Credit deduction: ${creditsBefore} - ${actualNumberOfImages} = ${updatedUser.credits} (Created ${actualNumberOfImages} images)`);

            console.log(`[Generate Image] Updating message ${messageId} in session ${sessionId}`);

            const updateResult = await ChatSession.updateOne(
                { _id: sessionId, "messages.id": messageId },
                {
                    $set: {
                        "messages.$.imageStatus": "success",
                        "messages.$.imageUrls": imageUrls,
                        "messages.$.imagePrompt": prompt,
                        "messages.$.imageConfig": {
                            aspectRatio: finalAspectRatio,
                            numberOfImages: finalNumberOfImages,
                        },
                        "messages.$.isOptimizing": false,
                    }
                }
            );

            if (updateResult.matchedCount === 0) {
                console.error(`[Generate Image] ERROR: No message found with id ${messageId} in session ${sessionId}`);
            }

            if (!updatedUser) {
                throw new Error("Failed to update user credits");
            }

            res.json({ imageUrls, credits: updatedUser.credits });
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error("Error in /api/generate-image:", error);

        const errorInfo = handleGeminiError(error);
        let detailedError = errorInfo.message;

        if (![400, 401, 403, 429].includes(errorInfo.status)) {
            detailedError = "Tạo ảnh thất bại. Nguyên nhân có thể do API key của bạn chưa được cấp quyền cho model Imagen hoặc dự án Google Cloud chưa bật thanh toán. Vui lòng kiểm tra lại cài đặt của bạn.";
        }

        await ChatSession.updateOne(
            { _id: sessionId, "messages.id": messageId },
            { $set: { "messages.$.imageStatus": "error", "messages.$.errorMessage": detailedError } }
        );

        res.status(errorInfo.status).json({ error: detailedError });
    }
};
