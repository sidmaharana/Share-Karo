document.getElementById("selectFilesBtn").addEventListener("click", () =>
  document.getElementById("fileInput").click()
);

document.getElementById("fileInput").addEventListener("change", async function () {
  const files = this.files;
  const statusText = document.getElementById("uploadStatus");
  const uploadedFilesList = document.getElementById("uploadedFilesList");
  const fileCodesList = document.getElementById("fileCodesList");
  const downloadLinksList = document.getElementById("downloadLinksList");
  const qrCodeContainer = document.getElementById("qrCodeContainer");
  const progressBar = document.getElementById("progress");

  if (!files.length) return;

  statusText.innerText = "Status: Uploading...";
  uploadedFilesList.innerHTML = "";
  fileCodesList.innerHTML = "";
  downloadLinksList.innerHTML = ""; // Clear previous links
  qrCodeContainer.innerHTML = ""; // Clear previous QR codes
  uploadedFilesContainer.classList.remove("hidden");
  fileCodesContainer.classList.remove("hidden");

  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    progressBar.style.width = `${progress}%`;
    if (progress >= 100) clearInterval(interval);
  }, 300);

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("file", files[i]);
  }

  try {
    const response = await fetch("/upload", { method: "POST", body: formData });
    const result = await response.json();
    const item = document.createElement("li");
    if (response.ok) {
      if (files.length === 1) {
        item.innerHTML = `✓ ${files[0].name} uploaded!`;
      } else {
        item.innerHTML = `✓ Files zipped and uploaded!`;
      }
      const codeDiv = document.createElement("div");
      codeDiv.textContent = result.fileCode;
      codeDiv.classList.add("code-display");
      codeDiv.onclick = () => copyToClipboard(result.fileCode);
      fileCodesList.appendChild(codeDiv);

      // Display direct download link
      const linkDiv = document.createElement("div");
      linkDiv.innerHTML = `<a href="${window.location.origin}${result.directDownloadLink}" target="_blank" class="text-blue-400 hover:underline">${window.location.origin}${result.directDownloadLink}</a>`;
      downloadLinksList.appendChild(linkDiv);

      // Generate and display QR code
      qrCodeContainer.innerHTML = ''; // Clear previous QR code
      new QRCode(qrCodeContainer, {
        text: `${window.location.origin}${result.directDownloadLink}`,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });

      startTimer(300); // Start 5-minute timer (300 seconds)

    } else {
      item.innerHTML = `✗ Upload failed - ${result.error}`;
    }
    uploadedFilesList.appendChild(item);
  } catch (error) {
    const item = document.createElement("li");
    item.innerHTML = `✗ Upload failed: ${error.message}`;
    uploadedFilesList.appendChild(item);
  }

  statusText.innerText = "Status: Upload complete";
});

let timerInterval;

function startTimer(duration) {
  let timer = duration;
  let minutes, seconds;
  const timerDisplay = document.getElementById("timerDisplay");

  clearInterval(timerInterval); // Clear any existing timer

  timerDisplay.classList.remove("hidden");
  timerDisplay.classList.add("blinking-timer");

  timerInterval = setInterval(() => {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    timerDisplay.textContent = `Expires in: ${minutes}:${seconds}`;

    if (--timer < 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = "Expired!";
      timerDisplay.classList.remove("blinking-timer");
    }
  }, 1000);
}

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
