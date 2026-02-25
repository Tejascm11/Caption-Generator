/**
 * Caption AI — main.js
 */

/* ── Elements ── */
const modalBackdrop = document.getElementById("modalBackdrop");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const modalError = document.getElementById("modalError");
const changeKeyBtn = document.getElementById("changeKeyBtn");

const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const toneGrid = document.getElementById("toneGrid");
const countRow = document.getElementById("countRow");
const generateBtn = document.getElementById("generateBtn");
const resultsWrap = document.getElementById("resultsWrap");
const loadingPanel = document.getElementById("loadingPanel");
const errorBox = document.getElementById("errorBox");
const captionsGrid = document.getElementById("captionsGrid");
const hashPanel = document.getElementById("hashPanel");
const hashChips = document.getElementById("hashChips");

let selectedFile = null;
let selectedTone = "Witty";
let selectedCount = "3";

/* ============================================================
   API Key Modal
   ============================================================ */

/** Check if a key is already saved in the session */
async function checkKey() {
  const res = await fetch("/has-key");
  const data = await res.json();
  if (data.has_key) {
    modalBackdrop.classList.add("hidden");
  }
  // else: modal stays visible
}
checkKey();

saveKeyBtn.addEventListener("click", saveKey);
apiKeyInput.addEventListener("keydown", (e) => { if (e.key === "Enter") saveKey(); });

async function saveKey() {
  const key = apiKeyInput.value.trim();
  modalError.textContent = "";

  if (!key) { modalError.textContent = "Please paste your API key."; return; }
  if (!key.startsWith("gsk_")) { modalError.textContent = 'Key must start with "gsk_". Check you copied it fully.'; return; }

  saveKeyBtn.textContent = "Saving…";
  saveKeyBtn.disabled = true;

  try {
    const res = await fetch("/save-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key }),
    });
    const data = await res.json();
    if (data.error) { modalError.textContent = data.error; }
    else { modalBackdrop.classList.add("hidden"); }
  } catch {
    modalError.textContent = "Could not save key. Is the server running?";
  } finally {
    saveKeyBtn.textContent = "Save & Continue →";
    saveKeyBtn.disabled = false;
  }
}

changeKeyBtn.addEventListener("click", () => {
  apiKeyInput.value = "";
  modalError.textContent = "";
  modalBackdrop.classList.remove("hidden");
  setTimeout(() => apiKeyInput.focus(), 100);
});

/* ============================================================
   Image Upload
   ============================================================ */
function showPreview(file) {
  const oldImg = uploadZone.querySelector(".preview-img");
  const oldBtn = uploadZone.querySelector(".change-btn");
  if (oldImg) oldImg.remove();
  if (oldBtn) oldBtn.remove();

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.createElement("img");
    img.src = e.target.result;
    img.className = "preview-img";
    img.alt = "Preview";

    const btn = document.createElement("button");
    btn.className = "change-btn";
    btn.textContent = "↺ Change";
    btn.addEventListener("click", (ev) => { ev.stopPropagation(); fileInput.click(); });

    uploadZone.appendChild(img);
    uploadZone.appendChild(btn);
    uploadZone.classList.add("has-image");
  };
  reader.readAsDataURL(file);
}

function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) { showError("Please upload a valid image (JPG, PNG, WEBP, GIF)."); return; }
  selectedFile = file;
  showPreview(file);
  generateBtn.disabled = false;
  clearResults();
}

fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
uploadZone.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
uploadZone.addEventListener("drop", (e) => { e.preventDefault(); uploadZone.classList.remove("drag-over"); handleFile(e.dataTransfer.files[0]); });

/* ============================================================
   Tone & Count
   ============================================================ */
toneGrid.querySelectorAll(".tone-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    toneGrid.querySelectorAll(".tone-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    selectedTone = btn.dataset.tone;
  });
});

countRow.querySelectorAll(".count-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    countRow.querySelectorAll(".count-btn").forEach(b => b.classList.remove("on"));
    btn.classList.add("on");
    selectedCount = btn.dataset.count;
  });
});

/* ============================================================
   Generate
   ============================================================ */
generateBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  setLoading(true);
  clearResults();

  const formData = new FormData();
  formData.append("image", selectedFile);
  formData.append("tone", selectedTone);
  formData.append("count", selectedCount);

  try {
    const response = await fetch("/generate", { method: "POST", body: formData });
    const data = await response.json();

    if (response.status === 401) {
      // Bad key — reopen modal
      modalBackdrop.classList.remove("hidden");
      modalError.textContent = "❌ Invalid key. Please re-enter your Groq API key.";
      apiKeyInput.focus();
      return;
    }
    if (!response.ok || data.error) throw new Error(data.error || "Server error");
    renderResults(data.captions, data.hashtags);
  } catch (err) {
    showError("⚠️ " + (err.message || "Something went wrong. Please try again."));
  } finally {
    setLoading(false);
  }
});

/* ============================================================
   UI Helpers
   ============================================================ */
function setLoading(on) {
  resultsWrap.style.display = "block";
  loadingPanel.style.display = on ? "block" : "none";
  generateBtn.disabled = on;
  generateBtn.textContent = on ? "✨ Crafting captions…" : "✨ Generate Captions";
  if (on) generateBtn.classList.add("loading");
  else generateBtn.classList.remove("loading");
}

function clearResults() {
  errorBox.style.display = "none";
  captionsGrid.innerHTML = "";
  hashPanel.style.display = "none";
  hashChips.innerHTML = "";
}

function showError(msg) {
  resultsWrap.style.display = "block";
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function renderResults(captions, hashtags) {
  captions.forEach((text, i) => {
    const card = document.createElement("div");
    card.className = "cap-card";
    card.innerHTML = `
      <div class="cap-num">Caption ${i + 1}</div>
      <div class="cap-text">${escapeHtml(text)}</div>
      <div class="copy-cue">📋 Click to copy</div>`;
    card.addEventListener("click", () => copyCaption(card, text, hashtags));
    captionsGrid.appendChild(card);
  });

  if (hashtags.length > 0) {
    hashPanel.style.display = "block";
    hashtags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = `#${tag}`;
      chip.addEventListener("click", () => copyTag(chip, tag));
      hashChips.appendChild(chip);
    });
  }

  resultsWrap.scrollIntoView({ behavior: "smooth", block: "start" });
}

function copyCaption(card, text, hashtags) {
  const full = `${text}\n\n${hashtags.map(h => `#${h}`).join(" ")}`;
  navigator.clipboard.writeText(full).then(() => {
    const cue = card.querySelector(".copy-cue");
    card.classList.add("copied");
    cue.textContent = "✓ Copied with hashtags!";
    setTimeout(() => { card.classList.remove("copied"); cue.textContent = "📋 Click to copy"; }, 2200);
  });
}

function copyTag(chip, tag) {
  navigator.clipboard.writeText(`#${tag}`).then(() => {
    chip.classList.add("copied");
    const orig = chip.textContent;
    chip.textContent = `✓ ${tag}`;
    setTimeout(() => { chip.classList.remove("copied"); chip.textContent = orig; }, 1300);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
