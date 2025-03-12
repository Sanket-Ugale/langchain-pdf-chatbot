document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.getElementById("fileInput");
    const uploadStatus = document.getElementById("uploadStatus");
    const chatForm = document.getElementById("chatForm");
    const chatBox = document.getElementById("chatBox");
    const messageInput = document.getElementById("prompt");
    const sendButton = document.getElementById("sendButton");
    
    // Auto-focus the input field when page loads
    messageInput.focus();
    
    // Enable/disable send button based on input
    messageInput.addEventListener("input", function() {
        sendButton.disabled = messageInput.value.trim() === "";
    });
    
    // Initialize send button state
    sendButton.disabled = messageInput.value.trim() === "";
    
    // Handle file selection for automatic upload
    fileInput.addEventListener("change", function() {
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("pdf", fileInput.files[0]);
            
            showUploadStatus("Uploading PDF...", "");
            
            fetch("/upload", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showUploadStatus(data.message, "success");
                    
                    // Add system message to chat
                    appendMessage("System", `PDF "${fileInput.files[0].name}" uploaded successfully.`, "assistant");
                } else {
                    showUploadStatus(data.error || "Error uploading PDF.", "error");
                }
            })
            .catch(err => {
                showUploadStatus("Error uploading PDF.", "error");
            });
        }
    });

    // Handle chat submission and streaming response
    chatForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const prompt = messageInput.value.trim();
        if (!prompt) return;
        
        // Disable send button during processing
        sendButton.disabled = true;
        
        // Append user message to chat box
        appendMessage("You", prompt, "user");
        
        // Create assistant message container
        const assistantMessageContainer = document.createElement("div");
        assistantMessageContainer.classList.add("message", "assistant");
        
        const assistantHeader = document.createElement("div");
        assistantHeader.classList.add("message-header");
        assistantHeader.textContent = "Assistant";
        
        const assistantContent = document.createElement("div");
        assistantContent.classList.add("message-content");
        assistantContent.innerHTML = '<span class="typing-indicator">Typing</span>';
        
        assistantMessageContainer.appendChild(assistantHeader);
        assistantMessageContainer.appendChild(assistantContent);
        chatBox.appendChild(assistantMessageContainer);
        
        // Scroll to bottom
        scrollToBottom();
        
        // Send prompt to the backend and stream response
        fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: prompt })
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            
            // Clear "Typing" text
            assistantContent.textContent = "";
            
            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        // Re-enable send button when done
                        sendButton.disabled = messageInput.value.trim() === "";
                        return;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent.textContent += chunk;
                    scrollToBottom();
                    read();
                });
            }
            read();
        }).catch(err => {
            assistantContent.textContent = "Error: Could not get response.";
            console.error("Error:", err);
            sendButton.disabled = messageInput.value.trim() === "";
        });

        // Clear input field
        messageInput.value = "";
        // Focus back on input
        messageInput.focus();
    });
    
    // Helper function to show upload status with auto-hide
    function showUploadStatus(message, type) {
        uploadStatus.textContent = message;
        uploadStatus.className = type + " visible";
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            uploadStatus.classList.remove("visible");
        }, 3000);
    }
    
    // Helper function to append messages
    function appendMessage(sender, content, messageType) {
        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message", messageType);
        
        const messageHeader = document.createElement("div");
        messageHeader.classList.add("message-header");
        messageHeader.textContent = sender;
        
        const messageContent = document.createElement("div");
        messageContent.classList.add("message-content");
        messageContent.textContent = content;
        
        messageContainer.appendChild(messageHeader);
        messageContainer.appendChild(messageContent);
        chatBox.appendChild(messageContainer);
        
        scrollToBottom();
    }
    
    // Add a subtle typing indicator animation style
    const style = document.createElement('style');
    style.textContent = `
        .typing-indicator::after {
            content: '...';
            animation: ellipsis 1.5s infinite;
            width: 20px;
            display: inline-block;
        }
        
        @keyframes ellipsis {
            0% { content: '.'; }
            33% { content: '..'; }
            66% { content: '...'; }
            100% { content: '.'; }
        }
    `;
    document.head.appendChild(style);
    
    // Helper function to scroll to bottom of chat
    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    // Listen for Enter key in input field
    messageInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) {
                chatForm.dispatchEvent(new Event("submit"));
            }
        }
    });
});