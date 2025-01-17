import config from './config.js';
import settingsService from './settings-service.js';

class AIService {
    constructor() {
        this.API_KEY = config.api.key;
        this.API_URL = config.api.url;
        this.API_TIMEOUT = config.api.timeout;
    }

    async generateReply(emailDetails) {
        const myName = await settingsService.getMyName();
        const prompt = await this.createPrompt(emailDetails);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({
                    model: config.api.model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a professional email assistant. 
                                        Keep responses clear and well-structured.
                                        Always end emails with:
                                        Best regards,
                                        ${myName}

                                        Never change this signature or use any other name.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    ...config.api.settings
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            let reply = data.choices[0].message.content;

            const signatureRegex = /Best regards,\s*\n.*$/;
            if (!signatureRegex.test(reply)) {
                reply = reply.trim() + `\n\nBest regards,\n${myName}`;
            } else {
                reply = reply.replace(signatureRegex, `Best regards,\n${myName}`);
            }

            return reply;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`API request timed out after ${this.API_TIMEOUT}ms`);
            }
            console.error('Error generating AI reply:', error);
            throw error;
        }
    }

    async createPrompt(emailDetails) {
        const [myName, addRe, sentiment] = await Promise.all([
            settingsService.getMyName(),
            settingsService.getAddRe(),
            settingsService.getSentiment()
        ]);
        
        if (!myName.trim()) {
            throw new Error('Please enter your name before generating a reply');
        }

        // Base prompt without subject
        let prompt = `
Generate a professional email reply.

Original Email:
${addRe ? `Subject: Re: ${emailDetails.subject}\n` : ''}Content: ${emailDetails.body}
Tone: ${sentiment}

FORMAT REQUIREMENTS:
1. Greeting:
• Extract the sender's name from the email content or signature
• If no name found, use a professional generic greeting
• Use proper salutation based on the detected name (Dear [Name], Hello [Name], etc.)

2. Structure:
• Start with the appropriate greeting using sender's name
• Main content in clear paragraphs
• End with EXACT signature:
    Best regards,
    ${myName}

3. Spacing:
• Double line break between paragraphs
• Single line break after greeting
• Double line break before signature

4. Content:
• Use ${sentiment} tone
• Address key points
• Be clear and concise
• Match original language style
${addRe ? '• Include the subject line as shown above' : '• DO NOT include any subject line in the reply'}

IMPORTANT:
• Analyze the email content to find sender's name (often in signature)
• Use the found name in the greeting
• If no clear name found, use "Hello" or appropriate greeting
• DO NOT CHANGE THE SIGNATURE NAME UNDER ANY CIRCUMSTANCES.`;

        return prompt;
    }
}

export default new AIService(); 