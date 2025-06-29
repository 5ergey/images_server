const wrapper = document.querySelector('.items__wrapper');
const tableHeader = document.querySelector('.table__title');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('pageIndicator');

let currentPage = 1;
let totalFiles = 0;
let limit = 1; // теперь динамический

function loadPage(page) {
  fetch(`/images-list?page=${page}`)
    .then(res => res.json())
    .then(data => {
      totalFiles = data.total;
      currentPage = data.page;
      limit = data.limit;  // получаем с сервера
      const files = data.list;

      wrapper.innerHTML = '';

      if (files.length === 0) {
        if (tableHeader) tableHeader.style.display = 'none';

        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'no-files';
        emptyMsg.textContent = 'Нет загруженных изображений';
        wrapper.appendChild(emptyMsg);

        if (pageIndicator) pageIndicator.style.display = 'none';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';

        return; // не вызываем updateButtons и updatePageIndicator
      }

      if (tableHeader) tableHeader.style.display = 'flex';
      if (pageIndicator) pageIndicator.style.display = 'block';
      if (prevBtn) prevBtn.style.display = 'inline-block';
      if (nextBtn) nextBtn.style.display = 'inline-block';

      files.forEach(file => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'items';

        const iconImg = document.createElement('img');
        iconImg.src = '../icon/photo_icon.svg';
        iconImg.alt = 'photo_icon';
        iconImg.className = 'icon';

        const filenameDiv = document.createElement('div');
        filenameDiv.className = 'filename';
        filenameDiv.textContent = file.original_name;

        const urlLink = document.createElement('a');
        urlLink.className = 'link';
        urlLink.href = `http://localhost/images/${file.filename}`;
        urlLink.target = '_blank';

        const urlDiv = document.createElement('div');
        urlDiv.className = 'url';
        urlDiv.textContent = urlLink.href;
        urlLink.appendChild(urlDiv);

        const sizeDiv = document.createElement('div');
        sizeDiv.className = 'size';
        sizeDiv.textContent = `${Math.round(file.size / 1024)} KB`;

        const dateDiv = document.createElement('div');
        dateDiv.className = 'date';
        dateDiv.textContent = file.upload_time.slice(0, 16);

        const extDiv = document.createElement('div');
        extDiv.className = 'ext';
        extDiv.textContent = file.file_type;

        const deleteLink = document.createElement('a');
        deleteLink.href = '#';

        const deleteImg = document.createElement('img');
        deleteImg.src = '../icon/delete.png';
        deleteImg.alt = 'Удалить';
        deleteImg.className = 'delete';

        deleteLink.appendChild(deleteImg);

        deleteLink.addEventListener('click', (e) => {
          e.preventDefault();

          fetch(`/delete/${file.id}`, {
            method: 'DELETE'
          })
          .then(res => {
            if (res.ok) {
              loadPage(currentPage);
            } else {
              alert('Ошибка при удалении файла');
            }
          })
          .catch(() => alert('Ошибка соединения при удалении'));
        });

        itemDiv.appendChild(iconImg);
        itemDiv.appendChild(filenameDiv);
        itemDiv.appendChild(urlLink);
        itemDiv.appendChild(sizeDiv);
        itemDiv.appendChild(dateDiv);
        itemDiv.appendChild(extDiv);
        itemDiv.appendChild(deleteLink);
        wrapper.appendChild(itemDiv);
      });

      updateButtons();
      updatePageIndicator();
    })
    .catch(e => {
      console.error('Ошибка:', e);
    });
}

function updateButtons() {
  const maxPage = Math.ceil(totalFiles / limit);
  const shouldHide = totalFiles === 0;

  if (prevBtn) {
    prevBtn.disabled = (currentPage <= 1 || shouldHide);
    prevBtn.style.display = shouldHide ? 'none' : 'inline-block';
  }

  if (nextBtn) {
    nextBtn.disabled = (currentPage >= maxPage || shouldHide);
    nextBtn.style.display = shouldHide ? 'none' : 'inline-block';
  }
}

function updatePageIndicator() {
  if (!pageIndicator) return;

  if (totalFiles === 0) {
    pageIndicator.style.display = 'none';
    return;
  }

  const maxPage = Math.max(1, Math.ceil(totalFiles / limit));
  pageIndicator.textContent = `Страница ${currentPage} из ${maxPage}`;
  pageIndicator.style.display = 'block';
}

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadPage(currentPage);
  }
});

nextBtn.addEventListener('click', () => {
  const maxPage = Math.ceil(totalFiles / limit);
  if (currentPage < maxPage) {
    currentPage++;
    loadPage(currentPage);
  }
});

// Инициализация загрузки первой страницы
loadPage(currentPage);
