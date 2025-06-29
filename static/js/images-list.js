fetch('/images-list?data=true')
  .then(res => res.json())
  .then(data => {
    const wrapper = document.querySelector('.items__wrapper');
    const tableHeader = document.querySelector('.table__title');

    if (!wrapper) {
      console.error('Контейнер .items__wrapper не найден!');
      return;
    }

    // Здесь data теперь объект с двумя ключами: list и total
    if (!data.list || data.list.length === 0) {
      if (tableHeader) tableHeader.style.display = 'none';

      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'no-files';
      emptyMsg.textContent = 'Файлы не найдены.';
      wrapper.appendChild(emptyMsg);
      return;
    }

    if (tableHeader) tableHeader.style.display = 'flex';

    // Проходим по data.list, а не просто по data
    data.list.forEach(file => {
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
            itemDiv.remove();
            if (wrapper.children.length === 0 && tableHeader) {
              tableHeader.style.display = 'none';
              const emptyMsg = document.createElement('div');
              emptyMsg.className = 'no-files';
              emptyMsg.textContent = 'Файлы не найдены.';
              wrapper.appendChild(emptyMsg);
            }
          } else {
            console.error('Не удалось удалить файл на сервере');
            alert('Ошибка при удалении файла');
          }
        })
        .catch(err => {
          console.error('Ошибка удаления файла:', err);
          alert('Ошибка соединения при удалении');
        });
      });

      itemDiv.appendChild(iconImg);
      itemDiv.appendChild(filenameDiv);
      itemDiv.appendChild(urlLink);
      itemDiv.appendChild(sizeDiv);
      itemDiv.appendChild(dateDiv);
      itemDiv.appendChild(deleteLink);
      wrapper.appendChild(itemDiv);
    });
  })
  .catch(e => console.error('Ошибка:', e));
