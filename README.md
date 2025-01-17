# Email Reader Extension with AI Reply

A Chrome extension that helps you generate AI-powered email replies directly in Gmail. The extension uses the Deepseek AI API to create contextually appropriate responses while maintaining professional formatting and tone.

## Features

- 🤖 AI-powered email reply generation
- 📧 Automatic email content extraction from Gmail
- 🎯 Customizable response tone (Positive, Neutral, Negative)
- ✍️ Editable email content before generation
- 📝 Smart name detection from email signatures
- 🔄 "Re:" subject line option
- 📋 One-click copy to clipboard
- 💾 Persistent settings storage
- 📝 Editable email body before generating reply
- 🎨 Clean, responsive UI
- 🔒 Secure local storage for settings
- 🌐 Works with any Gmail email

## Installation Steps

1. **Prerequisites:**
   - Node.js (v14 or higher) - [Download](https://nodejs.org/)
   - npm (comes with Node.js)
   - Chrome browser
   - Deepseek API account and key

2. **Initial Project Setup:**
   ```bash
   # Create project directory
   mkdir email-reader-extension
   cd email-reader-extension

   # Initialize npm project
   npm init -y

   # Install required dependencies
   npm install dotenv@^16.0.3 --save
   npm install esbuild@^0.19.0 rimraf@^5.0.0 --save-dev

   # Create project structure
   mkdir -p src public/icons dist
   ```

3. **Configuration Setup:**
   ```bash
   # Create configuration files
   cp .env.example .env

   # Add your Deepseek API key to .env
   echo "DEEPSEEK_API_KEY=your_api_key_here" >> .env
   ```

4. **API Configuration:**
   - Sign up at [Deepseek API](https://deepseek.com)
   - Create new API key
   - Add to .env file:
     ```env
     DEEPSEEK_API_KEY=your_api_key_here
     DEBUG_MODE=false
     API_TIMEOUT=30000
     ```

5. **Build and Load:**
   ```bash
   # Install dependencies
   npm install

   # Build the extension
   npm run build

   # Load in Chrome:
   # 1. Open chrome://extensions
   # 2. Enable Developer mode
   # 3. Click "Load unpacked"
   # 4. Select the dist directory
   ```

## Usage

1. **Initial Setup:**
   - Click the extension icon in Chrome
   - Enter your name (used for email signatures)
   - Choose your preferred tone (Positive/Neutral/Negative)
   - Optional: Enable "Add Re:" for subject lines

2. **Generating Replies:**
   ```
   a. Open an email in Gmail
   b. Click the extension icon
   c. Review and edit if needed:
      - Email body content
      - Tone selection
      - Re: prefix option
   d. Click "Generate Reply"
   e. Review the AI-generated response
   f. Click "Copy" to copy to clipboard
   g. Paste into Gmail's reply box
   ```

## Components

### 1. Popup Interface (`popup.html`, `popup.css`)
- Clean, modern interface
- Responsive design
- Sections:
  - Name input
  - Settings (Re: prefix, Tone)
  - Email details (From, Subject)
  - Editable body content
  - Reply generation area
  - Action buttons

### 2. Core Services

#### AI Service (`ai-service.js`)
```javascript
// Handles AI interactions and prompt formatting
class AIService {
    - Generates contextual replies
    - Maintains formatting rules
    - Handles tone adjustments
    - Smart name detection
    - Signature management
}
```

#### Settings Service (`settings-service.js`)
```javascript
// Manages user preferences
class SettingsService {
    - Name storage
    - Re: prefix preference
    - Tone settings
    - Chrome storage integration
}
```

## Development

### VS Code Configuration (Recommended)
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.exclude": {
    "dist": false,
    "node_modules": true
  }
}
```

### Development Commands
```bash
# Watch mode for development
npm run dev

# Production build
npm run build

# Clean build directory
npm run clean
```

## Project Structure

```
├── src/
│   ├── ai-service.js      # AI integration and prompt handling
│   ├── content.js         # Gmail content extraction
│   ├── popup.js          # Extension popup logic
│   └── settings-service.js # Settings management
├── public/
│   ├── popup.html        # Extension popup UI
│   ├── popup.css         # Styles for popup
│   ├── manifest.json     # Extension manifest
│   └── icons/            # Extension icons
├── build.js              # Build configuration
├── setup.js             # Project setup script
└── .env                 # Environment variables
```

## Configuration

### Environment Variables (.env)
```env
DEEPSEEK_API_KEY=your_api_key_here
```

### Manifest (manifest.json)
```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "tabs",
    "clipboardWrite",
    "storage"
  ],
  "host_permissions": [
    "https://mail.google.com/*",
    "https://api.deepseek.com/*"
  ]
}
```

## Troubleshooting

1. **Extension not working:**
   - Ensure you're on Gmail (`mail.google.com`)
   - Check if an email is open
   - Verify your API key in `.env`

2. **Build issues:**
   ```bash
   # Check Node.js version
   node --version  # Should be v14+

   # Clear npm cache
   npm cache clean --force

   # Reinstall dependencies
   rm -rf node_modules
   npm install
   ```

3. **API errors:**
   - Verify your Deepseek API key
   - Check your internet connection
   - Ensure you're within API rate limits

4. **UI issues:**
   - Clear Chrome extension cache
   - Reload the extension
   - Check console for errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Notice

This extension requires:
1. Deepseek API key (stored in `.env`)
2. Gmail access permissions
3. Local storage for settings

⚠️ Never commit your `.env` file or API keys
⚠️ Always use HTTPS for API communications
⚠️ Review permissions before deployment