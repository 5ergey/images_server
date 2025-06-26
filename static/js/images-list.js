fetch('/images-list?data=true') // Запрос к серверу, чтобы получить список объектов файлов
  .then(res => res.json()) // Парсим ответ как JSON — ожидаем массив объектов
  .then(data => {
    const wrapper = document.querySelector('.items__wrapper');
    if (!wrapper) {
      console.error('Контейнер .items__wrapper не найден!');
      return;
    }

    data.forEach(file => {
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

      const sizeDiv = document.createElement('div');
      sizeDiv.className = 'size';
      sizeDiv.textContent = `${Math.round(file.size / 1024)} KB`;

      const dateDiv = document.createElement('div');
      dateDiv.className = 'date';
      dateDiv.textContent = file.upload_time.slice(0, 16);

      const urlDiv = document.createElement('div');
      urlDiv.className = 'url';
      urlDiv.textContent = `http://localhost/images/${file.filename}`;

      urlLink.appendChild(urlDiv);

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
