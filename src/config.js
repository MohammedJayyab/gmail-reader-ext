// Environment variables are injected during build
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = process.env.API_URL || 'https://api.deepseek.com/v1/chat/completions';
const API_TIMEOUT = process.env.API_TIMEOUT || 30000;
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

if (!API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is required but not set in environment variables');
}

export default {
    api: {
        key: API_KEY,
        url: API_URL,
        timeout: parseInt(API_TIMEOUT),
        model: 'deepseek-chat',
        settings: {
            temperature: 0.85,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.3,
            max_tokens: 750,
        }
    },
    debug: DEBUG_MODE
}; 