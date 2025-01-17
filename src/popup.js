import settingsService from './settings-service.js';
import aiService from './ai-service.js';

// Function to update popup with email details
function updatePopup(details) {
    console.log('Updating popup with details:', details);
    document.getElementById('from').textContent = details.from || 'Not found';
    document.getElementById('subject').textContent = details.subject || 'Not found';
    document.getElementById('body').value = details.body || 'Not found';
}

// Function to show error message
function showError(message) {
    console.error('Showing error:', message);
    const elements = ['from', 'subject'];
    elements.forEach(id => {
        document.getElementById(id).textContent = message;
    });
    document.getElementById('body').value = message;
}

// Function to handle copy button
function setupCopyButton() {
    const copyBtn = document.getElementById('copy-btn');
    const replyText = document.getElementById('reply-text');

    // Initial state
    copyBtn.disabled = !replyText.value.trim();
    updateCopyButtonState(copyBtn, false);

    // Watch for changes in reply text
    replyText.addEventListener('input', () => {
        copyBtn.disabled = !replyText.value.trim();
        updateCopyButtonState(copyBtn, false);
    });

    copyBtn.addEventListener('click', async () => {
        if (!replyText.value.trim()) return;

        try {
            await navigator.clipboard.writeText(replyText.value);
            updateCopyButtonState(copyBtn, true);
            
            setTimeout(() => {
                updateCopyButtonState(copyBtn, false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    });
}

// Helper function to update copy button state
function updateCopyButtonState(button, copied) {
    button.classList.toggle('copied', copied);
    button.innerHTML = copied ? `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
        Copied!
    ` : `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
        Copy
    `;
}

// Function to generate reply
function generateReply(emailDetails) {
    const replyTextArea = document.getElementById('reply-text');
    const generateBtn = document.getElementById('generate-btn');
    const nameInput = document.getElementById('my-name');
    const copyBtn = document.getElementById('copy-btn');
    const bodyTextArea = document.getElementById('body');
    
    generateBtn.addEventListener('click', async () => {
        // Check if name is empty
        if (!nameInput.value.trim()) {
            nameInput.style.borderColor = '#d32f2f';
            replyTextArea.value = 'Please enter your name before generating a reply.';
            nameInput.focus();
            copyBtn.disabled = true;
            updateCopyButtonState(copyBtn, false);
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        replyTextArea.value = 'Generating AI reply...';
        copyBtn.disabled = true;
        updateCopyButtonState(copyBtn, false);
        
        try {
            // Use the current body text instead of original
            const updatedEmailDetails = {
                ...emailDetails,
                body: bodyTextArea.value.trim()
            };

            const reply = await aiService.generateReply(updatedEmailDetails);
            replyTextArea.value = reply;
            copyBtn.disabled = !reply.trim();
            updateCopyButtonState(copyBtn, false);
        } catch (error) {
            console.error('Error generating reply:', error);
            replyTextArea.value = 'Error generating reply. Please try again.';
            copyBtn.disabled = true;
            updateCopyButtonState(copyBtn, false);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Reply';
        }
    });
}

// Add this function
async function setupNameInput() {
    const nameInput = document.getElementById('my-name');
    const generateBtn = document.getElementById('generate-btn');
    
    // Load saved name
    const savedName = await settingsService.getMyName();
    nameInput.value = savedName;
    
    // Add input event listener to remove error state
    nameInput.addEventListener('input', () => {
        nameInput.style.borderColor = nameInput.value.trim() ? '#e0e0e0' : '#d32f2f';
    });
    
    // Save name when changed
    nameInput.addEventListener('change', async () => {
        const name = nameInput.value.trim();
        if (name) {
            await settingsService.setMyName(name);
            nameInput.style.borderColor = '#e0e0e0';
        } else {
            nameInput.style.borderColor = '#d32f2f';
        }
    });

    // Initial validation
    if (!savedName) {
        nameInput.style.borderColor = '#d32f2f';
        nameInput.placeholder = 'Please enter your name';
        nameInput.focus();
    }
}

// Add this function
async function setupSettings() {
    const addReCheckbox = document.getElementById('add-re');
    const sentimentSelect = document.getElementById('sentiment');
    
    // Load saved settings
    const [addRe, sentiment] = await Promise.all([
        settingsService.getAddRe(),
        settingsService.getSentiment()
    ]);
    
    addReCheckbox.checked = addRe;
    sentimentSelect.value = sentiment;
    
    // Save settings when changed
    addReCheckbox.addEventListener('change', async () => {
        await settingsService.setAddRe(addReCheckbox.checked);
    });
    
    sentimentSelect.addEventListener('change', async () => {
        await settingsService.setSentiment(sentimentSelect.value);
    });
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup initialized');
    await setupNameInput();
    await setupSettings();
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log('Current tab:', tabs[0]);
        
        // Check if we're on Gmail
        if (!tabs[0].url.includes('mail.google.com')) {
            showError('Please open Gmail to use this extension');
            return;
        }

        // Try to send message to content script
        chrome.tabs.sendMessage(
            tabs[0].id,
            {action: 'getEmailDetails'},
            function(response) {
                console.log('Received response:', response);
                
                if (chrome.runtime.lastError) {
                    console.error('Runtime error:', chrome.runtime.lastError);
                    showError('Please open an email in Gmail');
                    return;
                }
                if (response) {
                    updatePopup(response);
                    generateReply(response);
                    setupCopyButton(); // Initialize copy button
                } else {
                    showError('No email data found');
                }
            }
        );
    });
}); 