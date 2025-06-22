document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab and content
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // File upload functionality
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('fileInput');
    const selectBtn = document.getElementById('selectBtn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileName = document.getElementById('file-name');
    const fileInfo = document.getElementById('file-info');
    const uploadResult = document.getElementById('upload-result');
    const fileCode = document.getElementById('file-code');
    const copyCodeBtn = document.getElementById('copy-code');
    const uploadAnotherBtn = document.getElementById('upload-another');
    
    // Select file button
    selectBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Display file name when selected
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
            fileInfo.classList.remove('hidden');
        }
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('highlight');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('highlight');
        });
    });
    
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            fileName.textContent = files[0].name;
            fileInfo.classList.remove('hidden');
        }
    });
    
    // Upload file
    uploadBtn.addEventListener('click', async () => {
        if (!fileInput.files.length) return;
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.fileCode) {
                fileCode.textContent = data.fileCode;
                fileInfo.classList.add('hidden');
                uploadResult.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while uploading the file.');
        }
    });
    
    // Copy code button
    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(fileCode.textContent);
        copyCodeBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyCodeBtn.textContent = 'Copy';
        }, 2000);
    });
    
    // Upload another file button
    uploadAnotherBtn.addEventListener('click', () => {
        fileInput.value = '';
        uploadResult.classList.add('hidden');
        fileInfo.classList.add('hidden');
    });
    
    // Download functionality
    const downloadForm = document.getElementById('download-form');
    const downloadError = document.getElementById('download-error');
    
    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const codeInput = document.getElementById('code-input');
        const code = codeInput.value.trim();
        
        if (!code || code.length !== 6) {
            downloadError.textContent = 'Please enter a valid 6-digit code.';
            downloadError.classList.remove('hidden');
            return;
        }
        
        try {
            // Check if file exists first
            const checkResponse = await fetch(`/download/${code}`, {
                method: 'HEAD'
            });
            
            if (checkResponse.ok) {
                // File exists, download it
                window.location.href = `/download/${code}`;
                downloadError.classList.add('hidden');
            } else {
                downloadError.textContent = 'File not found or has expired.';
                downloadError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            downloadError.textContent = 'An error occurred. Please try again.';
            downloadError.classList.remove('hidden');
        }
    });
});
