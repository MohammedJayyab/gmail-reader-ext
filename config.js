const config = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
};

// Validate required environment variables
if (!config.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is required but not set in environment variables');
}

export default config; 