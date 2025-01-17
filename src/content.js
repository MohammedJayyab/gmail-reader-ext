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

// Initialize message listener
let isInitialized = false;

function initializeMessageListener() {
    if (isInitialized) return;
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request);
        if (request.action === 'getEmailDetails') {
            const details = extractEmailDetails();
            console.log('Sending response:', details);
            sendResponse(details);
        }
        return true; // Keep the message channel open for async response
    });
    
    isInitialized = true;
}

// Initialize as soon as possible
initializeMessageListener();

// Also initialize when the page content changes
const observer = new MutationObserver(() => {
    initializeMessageListener();
});

// Start observing the document body for changes
observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('Email Reader content script loaded'); 