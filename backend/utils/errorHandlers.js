export const handleGeminiError = (error) => {
    const safeStringify = (value) => {
        try {
            if (typeof value === 'string') return value;
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    };

    const errorText = `${error?.message || ''} ${error?.toString?.() || ''} ${safeStringify(error)}`;
    if (/(safety|blocked|prohibited|policy|harm|sex|sexual|nudity|porn|explicit|violence|self-harm|suicide|csam)/i.test(errorText)) {
        return {
            status: 400,
            message: 'Nội dung không phù hợp hoặc bị chặn bởi chính sách an toàn. Vui lòng nhập mô tả khác.'
        };
    }

    if (error.status === 429) {
        return {
            status: 429,
            message: 'API quota đã hết hoặc đã vượt quá giới hạn rate limit. Vui lòng thử lại sau hoặc kiểm tra quota của Google Gemini API.'
        };
    }
    if (error.status === 401 || error.status === 403) {
        return {
            status: error.status,
            message: 'API key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại API key.'
        };
    }
    return {
        status: error.status || 500,
        message: error.message || 'Đã có lỗi xảy ra khi gọi API.'
    };
};

export const isRefusalText = (text) => {
    if (!text || typeof text !== 'string') return false;
    return /(t[oô]i\s*xin\s*l[oỗ]i|kh[oô]ng\s*th[eể]|kh[oô]ng\s*th[eể]\s*t[ạa]o|kh[oô]ng\s*[đd][uư][oợ]c|n[ộo]i\s*dung\s*(kh[iê]u\s*d[âa]m|t[iì]nh\s*d[ụu]c|b[ạa]o\s*l[ựu]c)|vi\s*ph[ạa]m|ch[ií]nh\s*s[aá]ch|policy|prohibited|blocked|safety)/i.test(text);
};
