// Add at the top of content.js
console.log('Content script loading...');

// Notify background script that content script is loaded
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' })
    .catch(err => console.error('Failed to notify background script:', err));

// Initialize message listener
function initializeMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log('Message received in content script:', request);
            
            if (request.action === 'getEmailDetails') {
                try {
                    const details = extractEmailDetails();
                    console.log('Extracted details:', details);
                    sendResponse(details);
                } catch (error) {
                    console.error('Error in content script:', error);
                    sendResponse(null);
                }
                return true; // Keep the message channel open
            }
        });
        console.log('Message listener initialized');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeMessageListener();
        setupObserver();
    });
} else {
    initializeMessageListener();
    setupObserver();
}

function setupObserver() {
    // Create observer instance
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                initializeMessageListener();
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Function to extract email details
function extractEmailDetails() {
    const emailDetails = {
        from: '',
        subject: '',
        body: ''
    };

    try {
        // Get sender information with multiple selectors
        const fromElement = document.querySelector('[email]') || 
                          document.querySelector('.gD') ||
                          document.querySelector('.g2');
        if (fromElement) {
            emailDetails.from = fromElement.getAttribute('email') || fromElement.textContent.trim();
        }

        // Get subject with multiple selectors
        const subjectElement = 
            document.querySelector('h2[data-thread-perm-id]') || 
            document.querySelector('.hP') ||
            document.querySelector('[data-subject]') ||
            document.querySelector('.ha');
        if (subjectElement) {
            emailDetails.subject = subjectElement.textContent.trim();
        }

        // Get email body with multiple selectors
        const bodyElement = 
            document.querySelector('.a3s.aiL') || 
            document.querySelector('.message-content') ||
            document.querySelector('.email-content') ||
            document.querySelector('.gs');
        if (bodyElement) {
            // Clone the body element to work with
            const bodyClone = bodyElement.cloneNode(true);
            
            // Replace <br> tags with newline characters
            bodyClone.innerHTML = bodyClone.innerHTML.replace(/<br\s*\/?>/gi, '\n');
            
            // Replace </p> tags with double newline to preserve paragraphs
            bodyClone.innerHTML = bodyClone.innerHTML.replace(/<\/p>/gi, '\n\n');
            
            // Replace other block elements with newlines
            bodyClone.innerHTML = bodyClone.innerHTML.replace(/<\/(div|tr|table|h[1-6])>/gi, '\n');
            
            // Get the text content and clean up extra whitespace
            emailDetails.body = bodyClone.textContent
                .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
                .trim();
        }

        console.log('Extracted email details:', emailDetails);
        return emailDetails;

    } catch (error) {
        console.error('Error extracting email details:', error);
        return emailDetails;
    }
}

console.log('Email Reader content script loaded'); 