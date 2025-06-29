const wrapper = document.querySelector('.items__wrapper');
const tableHeader = document.querySelector('.table__title');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('pageIndicator');

let currentPage = 1;
let totalFiles = 0;
const limit = 1; // Кол-во файлов на странице

function loadPage(page) {
  fetch(`/images-list?page=${page}`)
    .then(res => res.json())
    .then(data => {
      totalFiles = data.total;
      const files = data.list;

      wrapper.innerHTML = '';

      if (files.length === 0) {
        if (tableHeader) tableHeader.style.display = 'none';

        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'no-files';
        emptyMsg.textContent = 'Файлы не найдены.';
        wrapper.appendChild(emptyMsg);

        updateButtons();
        updatePageIndicator();
        return;
      }

      if (tableHeader) tableHeader.style.display = 'flex';

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
  if (totalFiles === 0) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  prevBtn.disabled = (currentPage <= 1);
  const maxPage = Math.ceil(totalFiles / limit);
  nextBtn.disabled = (currentPage >= maxPage);
}

function updatePageIndicator() {
  const maxPage = Math.max(1, Math.ceil(totalFiles / limit));
  pageIndicator.textContent = `Страница ${currentPage} из ${maxPage}`;
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

loadPage(currentPage);
