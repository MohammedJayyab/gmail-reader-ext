// Function to update popup with email details
function updatePopup(details) {
    document.getElementById('from').textContent = details.from || 'Not found';
    document.getElementById('subject').textContent = details.subject || 'Not found';
    document.getElementById('body').textContent = details.body || 'Not found';
}

// Function to show error message
function showError(message) {
    const elements = ['from', 'subject', 'body'];
    elements.forEach(id => {
        document.getElementById(id).textContent = message;
    });
}

// Function to generate reply
function generateReply(emailDetails) {
    const replyTextArea = document.getElementById('reply-text');
    const generateBtn = document.getElementById('generate-btn');
    
    generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        replyTextArea.value = 'Generating reply...';
        
        try {
            // Here you can implement your reply generation logic
            // For now, we'll just create a simple response
            const reply = `Dear ${emailDetails.from},\n\nThank you for your email regarding "${emailDetails.subject}".\n\nI will review your message and get back to you soon.\n\nBest regards`;
            
            replyTextArea.value = reply;
        } catch (error) {
            replyTextArea.value = 'Error generating reply. Please try again.';
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Generate Reply';
        }
    });
}

// When popup opens, request email details from content script
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
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
            if (chrome.runtime.lastError) {
                showError('Please open an email in Gmail');
                return;
            }
            if (response) {
                updatePopup(response);
                generateReply(response);
            } else {
                showError('No email data found');
            }
        }
    );
}); 