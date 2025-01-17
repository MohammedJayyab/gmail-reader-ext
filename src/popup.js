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
    const nameError = document.querySelector('.name-error');
    
    // Load saved name
    const savedName = await settingsService.getMyName();
    nameInput.value = savedName;
    
    // Add input event listener to remove error state
    nameInput.addEventListener('input', () => {
        nameInput.style.borderColor = nameInput.value.trim() ? '#e0e0e0' : '#d32f2f';
        nameError.classList.toggle('visible', !nameInput.value.trim());
    });
    
    // Save name when changed
    nameInput.addEventListener('change', async () => {
        const name = nameInput.value.trim();
        if (name) {
            await settingsService.setMyName(name);
            nameInput.style.borderColor = '#e0e0e0';
            nameError.classList.remove('visible');
        } else {
            nameInput.style.borderColor = '#d32f2f';
            nameError.classList.add('visible');
        }
    });

    // Initial validation
    if (!savedName) {
        nameInput.style.borderColor = '#d32f2f';
        nameError.classList.add('visible');
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

// Add at the beginning of your popup.js
async function checkStorageConsent() {
    try {
        const { storageConsent } = await chrome.storage.local.get('storageConsent');
        return storageConsent === true;
    } catch (error) {
        console.error('Error checking storage consent:', error);
        return false;
    }
}

async function handleConsent() {
    const consentOverlay = document.getElementById('consent-overlay');
    const mainContent = document.querySelector('.settings-bar');
    
    // Check if consent was already given
    const hasConsent = await checkStorageConsent();
    if (hasConsent) {
        if (consentOverlay) consentOverlay.style.display = 'none';
        if (mainContent) {
            mainContent.style.display = 'flex';
            return true;
        }
    }

    return new Promise((resolve) => {
        const acceptButton = document.getElementById('accept-consent');
        const rejectButton = document.getElementById('reject-consent');

        if (!acceptButton || !rejectButton || !consentOverlay || !mainContent) {
            console.error('Required elements not found');
            resolve(false);
            return;
        }

        acceptButton.addEventListener('click', async () => {
            try {
                await chrome.storage.local.set({ storageConsent: true });
                consentOverlay.style.display = 'none';
                mainContent.style.display = 'flex';
                resolve(true);
            } catch (error) {
                console.error('Error saving consent:', error);
                resolve(false);
            }
        });

        rejectButton.addEventListener('click', () => {
            window.close();
            resolve(false);
        });
    });
}

// Update the message sending part
function tryConnectToContentScript(tabId, retryCount = 0) {
    return new Promise(async (resolve, reject) => {
        // First try to inject the content script
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            console.log('Content script injected');
        } catch (err) {
            console.log('Script already injected or injection failed:', err);
        }

        // Then try to send message
        chrome.tabs.sendMessage(tabId, { action: 'getEmailDetails' }, function(response) {
            if (chrome.runtime.lastError) {
                console.error('Connection error:', chrome.runtime.lastError.message);
                
                if (retryCount < 3) {
                    console.log(`Retrying connection (${retryCount + 1}/3)...`);
                    setTimeout(() => {
                        resolve(tryConnectToContentScript(tabId, retryCount + 1));
                    }, 1000);
                } else {
                    reject(new Error('Could not connect to Gmail page. Please refresh the page.'));
                }
            } else {
                resolve(response);
            }
        });
    });
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup initialized');
    
    try {
        // Check consent first
        const hasConsent = await handleConsent();
        if (!hasConsent) {
            console.log('Consent not given');
            return;
        }

        // Rest of your initialization code
        await setupNameInput();
        await setupSettings();
        
        chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
            if (!tabs[0].url.includes('mail.google.com')) {
                showError('Please open Gmail to use this extension');
                return;
            }

            try {
                const response = await tryConnectToContentScript(tabs[0].id);
                if (response) {
                    updatePopup(response);
                    generateReply(response);
                    setupCopyButton();
                } else {
                    showError('No email data found');
                }
            } catch (error) {
                showError(error.message);
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize extension');
    }
}); 