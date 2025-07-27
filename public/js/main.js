document.getElementById("selectFilesBtn").addEventListener("click", () =>
  document.getElementById("fileInput").click()
);

document.getElementById("fileInput").addEventListener("change", async function () {
  const files = this.files;
  const statusText = document.getElementById("uploadStatus");
  const uploadedFilesList = document.getElementById("uploadedFilesList");
  const fileCodesList = document.getElementById("fileCodesList");
  const downloadLinksList = document.getElementById("downloadLinksList");
  const progressBar = document.getElementById("progress");

  if (!files.length) return;

  statusText.innerText = "Status: Uploading...";
  uploadedFilesList.innerHTML = "";
  fileCodesList.innerHTML = "";
  downloadLinksList.innerHTML = ""; // Clear previous links
  uploadedFilesContainer.classList.remove("hidden");
  fileCodesContainer.classList.remove("hidden");

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressBar.style.width = `${progress}%`;
    if (progress >= 100) clearInterval(interval);
  }, 300);

  for (let file of files) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/upload", { method: "POST", body: formData });
      const result = await response.json();
      const item = document.createElement("li");
      if (response.ok) {
        item.innerHTML = `✓ ${file.name} <span class="text-gray-500 text-xs">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>`;
        const codeDiv = document.createElement("div");
        codeDiv.textContent = result.fileCode;
        codeDiv.classList.add("code-display");
        codeDiv.onclick = () => copyToClipboard(result.fileCode);
        fileCodesList.appendChild(codeDiv);

        // Display direct download link
        const linkDiv = document.createElement("div");
        linkDiv.innerHTML = `<a href="${window.location.origin}${result.directDownloadLink}" target="_blank" class="text-blue-400 hover:underline">${window.location.origin}${result.directDownloadLink}</a>`;
        downloadLinksList.appendChild(linkDiv);

      } else {
        item.innerHTML = `✗ ${file.name} - ${result.error}`;
      }
      uploadedFilesList.appendChild(item);
    } catch {
      const item = document.createElement("li");
      item.innerHTML = `✗ ${file.name} - Upload failed`;
      uploadedFilesList.appendChild(item);
    }
  }
  statusText.innerText = "Status: Upload complete";
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const code = document.getElementById("fileCodeInput").value.trim();
  if (!code) return alert("Enter a file access code");
  window.location.href = `/download/${code}`;
});

document.getElementById("fileCodeInput").addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("downloadBtn").click();
  }
});

function copyToClipboard(code) {
  navigator.clipboard.writeText(code);
  alert(`Code ${code} copied to clipboard`);
}

// Text Sharing Logic
document.getElementById("shareTextBtn").addEventListener("click", async () => {
  const text = document.getElementById("textInput").value.trim();
  if (!text) return alert("Please enter some text");
  const textCodesList = document.getElementById("textCodesList");
  const textCodesContainer = document.getElementById("textCodesContainer");

  textCodesList.innerHTML = ""; // Clear previous codes

  try {
    const res = await fetch("/share-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (res.ok) {
      const codeDiv = document.createElement("div");
      codeDiv.textContent = data.code;
      codeDiv.classList.add("code-display");
      codeDiv.onclick = () => copyToClipboard(data.code);
      textCodesList.appendChild(codeDiv);
      textCodesContainer.classList.remove("hidden");
    } else {
      alert(data.error || "Failed to share text");
    }
  } catch (error) {
    alert("Network error or server not reachable. Please try again later.");
    console.error("Error sharing text:", error);
  }
});

document.getElementById("retrieveTextBtn").addEventListener("click", async () => {
  const code = document.getElementById("textCodeInput").value.trim();
  if (!code) return alert("Enter a text access code");
  const res = await fetch(`/get-text/${code}`);
  const data = await res.json();
  if (res.ok) {
    document.getElementById("retrievedText").textContent = data.text;
  } else {
    document.getElementById("retrievedText").textContent = "Text not found or expired.";
  }
});
