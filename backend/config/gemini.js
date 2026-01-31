import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.error("LỖI NGHIÊM TRỌNG: API_KEY chưa được thiết lập trong biến môi trường.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export default ai;
