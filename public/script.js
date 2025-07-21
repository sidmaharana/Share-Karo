document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // === File Upload ===
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

    selectBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileName.textContent = fileInput.files[0].name;
            fileInfo.classList.remove('hidden');
        }
    });

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

    copyCodeBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(fileCode.textContent);
        copyCodeBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyCodeBtn.textContent = 'Copy';
        }, 2000);
    });

    uploadAnotherBtn.addEventListener('click', () => {
        fileInput.value = '';
        uploadResult.classList.add('hidden');
        fileInfo.classList.add('hidden');
    });

    // === Download File ===
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
            const checkResponse = await fetch(`/download/${code}`, {
                method: 'HEAD'
            });

            if (checkResponse.ok) {
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

    // === Text Message Sharing ===
    const sendTextBtn = document.getElementById('send-text-btn');
    const receiveTextBtn = document.getElementById('receive-text-btn');

    if (sendTextBtn) {
        sendTextBtn.addEventListener('click', async () => {
            const text = document.getElementById('send-textarea').value.trim();
            if (!text) return;

            const res = await fetch('/share-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await res.json();
            document.getElementById('generated-text-code').innerText = `Your Code: ${data.code}`;
        });
    }

    if (receiveTextBtn) {
        receiveTextBtn.addEventListener('click', async () => {
            const code = document.getElementById('receive-text-code').value.trim();
            if (!code) return;

            const res = await fetch(`/get-message/${code}`);
            const data = await res.json();

            if (data.message) {
                document.getElementById('received-text').innerText = `Received: ${data.message}`;
            } else {
                document.getElementById('received-text').innerText = 'Invalid or expired code.';
            }
        });
    }
});
