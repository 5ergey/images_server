const dropZone = document.getElementById("dropzone");
const fileInput = document.getElementById('fileInput');
const errorContainer = document.getElementById('uploadErrors');
const successContainer = document.getElementById('uploadSuccess');
let dragCounter = 0;
setButtonsDisabled(true, 'button');

const hoverClassName = "hover";

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
  const maxSize = 5 * 1024 * 1024; // 5 MB
  const fileExtension = file.name.split('.').pop().toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    uploadFailed('Недопустимый формат файла');
    return;
  } else if (file.size > maxSize) {
    uploadFailed('Размер файла превышает 5 МБ');
    return;
  } else {
    uploadSuccess(file);
    setButtonsDisabled(false, 'button');
    setButtonsDisabled(true, 'copy');
    return;
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
  if(files.length > 0) {
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

