const dropZone = document.getElementById("dropzone");
const fileInput = document.getElementById('fileInput');
const errorContainer = document.getElementById('uploadErrors');
const successContainer = document.getElementById('uploadSuccess');
const urlCopyDiv = document.querySelector('.url__copy');

let dragCounter = 0;
const maxSize = 5; // 5 MB
let selectedFile = null;
const hoverClassName = "hover";
const safeMode = false; 

setButtonsDisabled(true, 'button');

function uploadSuccess(file) {
  successContainer.innerHTML = `Файл ${file.name} готов к загрузке`;
  successContainer.style.display = 'block';
  errorContainer.style.display = 'none'; // скрываем ошибку
}

function uploadFailed(result) {
  errorContainer.innerHTML = `${result}`;
  errorContainer.style.display = 'block';
  successContainer.style.display = 'none'; // скрываем успех
  setButtonsDisabled(true, 'button');
}

function validateAndUpload(file) {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (safeMode) {
    if (!allowedExtensions.includes(fileExtension)) {
      uploadFailed('Недопустимый формат файла');
      return;
    } else if (file.size > maxSize * 1024 * 1024) {
      uploadFailed(`Размер файла превышает ${maxSize} МБ`);
      return;
    } else {
      uploadSuccess(file);
      selectedFile = file;
      setButtonsDisabled(false, 'button');
      setButtonsDisabled(true, 'copy');
      return;
    }
  } else {
    // Тут safeMode всегда true, эта ветка не будет работать, но оставил на всякий
    uploadSuccess(file);
    selectedFile = file;
    setButtonsDisabled(false, 'button');
    setButtonsDisabled(true, 'copy');
  }
}

function setButtonsDisabled(state, buttonClass) {
  const buttons = document.querySelectorAll(`.${buttonClass}`);
  buttons.forEach(button => button.disabled = state);
}


dropZone.addEventListener("dragenter", function (e) {
  e.preventDefault();
  dragCounter++;
  dropZone.classList.add(hoverClassName);
});

dropZone.addEventListener("dragover", function (e) {
  e.preventDefault();
  dropZone.classList.add(hoverClassName);
});

dropZone.addEventListener("dragleave", function (e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropZone.classList.remove(hoverClassName);
  }
});

dropZone.addEventListener("drop", function (e) {
  e.preventDefault();
  dropZone.classList.remove(hoverClassName);
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    const file = files[0];
    validateAndUpload(file);
  }
});

dropZone.addEventListener("click", function (e) {
  fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    validateAndUpload(file);
  }
});

dropZone.addEventListener('submit', function (e) {
  e.preventDefault();

  if (!selectedFile) {
    uploadFailed('Сначала выберите файл');
    return;
  }

  uploadToServer(selectedFile);
});

async function uploadToServer(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.status === 'success') {
      successContainer.innerHTML = result.message;
      successContainer.style.display = 'block';
      errorContainer.style.display = 'none';
      setButtonsDisabled(true, 'button');
      const container = document.querySelector('.url__copy');
      const span = document.createElement('span');
      span.textContent = result.url;
      const button = container.querySelector('button');
      container.insertBefore(span, button);
      container.style.justifyContent = 'space-between'
      setButtonsDisabled(false, 'copy');
      const copyButton = container.querySelector('.copy');
      copyButton.addEventListener('click', () => {
        // Копируем текст из span
        navigator.clipboard.writeText(span.textContent)
          .then(() => {
            copyButton.textContent = "COPIED";
            copyButton.classList.add("expanded");
            setTimeout(() => {
              copyButton.textContent = "COPY";
              copyButton.classList.remove("expanded")
            }, 2000);
          })
          .catch(err => {
            console.error("Ошибка копирования:", err);
          });
      });
    } else {
      uploadFailed(result.message);
    }
  } catch (err) {
    uploadFailed('Ошибка при отправке на сервер');
  }
}
