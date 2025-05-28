fetch('/images?data=true')
  .then(res => res.json())
  .then(filenames => {
    const wrapper = document.querySelector('.items__wrapper');
    if (!wrapper) {
      console.error('Контейнер .items__wrapper не найден!');
      return;
    }

    filenames.forEach(filename => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'items';

      const iconImg = document.createElement('img');
      iconImg.src = '../icon/photo_icon.svg';
      iconImg.alt = 'photo_icon';
      iconImg.className = 'icon';

      const filenameDiv = document.createElement('div');
      filenameDiv.className = 'filename';
      filenameDiv.textContent = filename;

      const urlDiv = document.createElement('div');
      urlDiv.className = 'url';
      urlDiv.textContent = `http://localhost/images/${filename}`;

      // Ссылка удаления
      const deleteLink = document.createElement('a');
      deleteLink.href = '#';

      const deleteImg = document.createElement('img');
      deleteImg.src = '../icon/delete.png';
      deleteImg.alt = 'Удалить';
      deleteImg.className = 'delete';

      deleteLink.appendChild(deleteImg);

      // Обработчик удаления
      deleteLink.addEventListener('click', (e) => {
        e.preventDefault();

        // Удаляем с сервера
        fetch(`/images/${filename}`, {
          method: 'DELETE'
        })
        .then(res => {
          if (res.ok) {
            itemDiv.remove(); // Удаляем из DOM
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

      // Собираем блок
      itemDiv.appendChild(iconImg);
      itemDiv.appendChild(filenameDiv);
      itemDiv.appendChild(urlDiv);
      itemDiv.appendChild(deleteLink);

      wrapper.appendChild(itemDiv);
    });
  })
  .catch(e => console.error('Ошибка:', e));
