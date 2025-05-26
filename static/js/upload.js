// === DOM Элементы ===
const dropZone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const errorContainer = document.getElementById("uploadErrors");
const successContainer = document.getElementById("uploadSuccess");
const urlCopyDiv = document.querySelector(".url__copy");

// === Константы и состояние ===
const maxSizeMB = 5;
const allowedExtensions = ["jpg", "jpeg", "png", "gif"];
const hoverClassName = "hover";
const safeMode = true;

let dragCounter = 0;
let selectedFile = null;

setButtonsDisabled(true, "button");

// === Функции отображения ===
function showSuccessMessage(message) {
  successContainer.innerHTML = message;
  successContainer.style.display = "block";
  errorContainer.style.display = "none";
}

function showErrorMessage(message) {
  errorContainer.innerHTML = message;
  errorContainer.style.display = "block";
  successContainer.style.display = "none";
  setButtonsDisabled(true, "button");
}

// === Валидация файла ===
function validateFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (safeMode) {
    if (!allowedExtensions.includes(extension)) {
      return "Недопустимый формат файла";
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Размер файла превышает ${maxSizeMB} МБ`;
    }
  }
  return null;
}

// === Основной процесс валидации и подготовки к загрузке ===
function validateAndPrepare(file) {
  const error = validateFile(file);
  if (error) {
    showErrorMessage(error);
    return;
  }

  selectedFile = file;
  showSuccessMessage(`Файл ${file.name} готов к загрузке`);
  setButtonsDisabled(false, "button");
  setButtonsDisabled(true, "copy");
}

// === Кнопки ===
function setButtonsDisabled(state, className) {
  document.querySelectorAll(`.${className}`).forEach(btn => {
    btn.disabled = state;
  });
}

// === Обработка копирования URL ===
function setupCopyButton(copyText) {
  const container = document.querySelector(".url__copy");
  const span = container.querySelector("span");
  const copyButton = container.querySelector(".copy");

  // Обновляем текст в существующем span
  if (span) {
    span.textContent = copyText;
    span.style.opacity = 1;
  }

  // Активируем кнопку
  setButtonsDisabled(false, "copy");

  // Удаляем старые обработчики, чтобы избежать дублирования
  const newCopyButton = copyButton.cloneNode(true);
  copyButton.replaceWith(newCopyButton);

  newCopyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(copyText)
      .then(() => {
        newCopyButton.textContent = "COPIED";
        newCopyButton.classList.add("expanded");
        setTimeout(() => {
          newCopyButton.textContent = "COPY";
          newCopyButton.classList.remove("expanded");
        }, 2000);
      })
      .catch(err => console.error("Ошибка копирования:", err));
  });
}


// === Обработка ответа от сервера ===
function handleServerResponse(result) {
  if (result.status === "success") {
    showSuccessMessage(result.message);
    setButtonsDisabled(true, "button");
    setupCopyButton(result.url);
  } else {
    showErrorMessage(result.message || "Ошибка загрузки");
  }
}

// === Загрузка на сервер ===
async function uploadToServer(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    handleServerResponse(result);
  } catch (err) {
    showErrorMessage("Ошибка при отправке на сервер");
  }
}

// === Drag-and-Drop ===
dropZone.addEventListener("dragenter", e => {
  e.preventDefault();
  dragCounter++;
  dropZone.classList.add(hoverClassName);
});

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
});

dropZone.addEventListener("dragleave", e => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) dropZone.classList.remove(hoverClassName);
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dragCounter = 0;
  dropZone.classList.remove(hoverClassName);

  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) validateAndPrepare(files[0]);
});

// === Click по области выбора ===
dropZone.addEventListener("click", () => fileInput.click());

// === Выбор через input ===
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) validateAndPrepare(file);
});

// === Отправка файла ===
dropZone.addEventListener("submit", e => {
  e.preventDefault();
  if (!selectedFile) {
    showErrorMessage("Сначала выберите файл");
    return;
  }
  uploadToServer(selectedFile);
});
