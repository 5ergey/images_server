fetch('/images?data=true') // Запрос к серверу, чтобы получить список имён файлов
  .then(res => res.json()) // Парсим ответ как JSON — ожидаем массив имён файлов
  .then(filenames => {
    // Находим контейнер с классом .items__wrapper, куда будем добавлять элементы
    const wrapper = document.querySelector('.items__wrapper');

    // Проверяем, найден ли контейнер
    if (!wrapper) {
      console.error('Контейнер .items__wrapper не найден!');
      return; // Если контейнер не найден, прекращаем выполнение
    }

    // Проходим по каждому имени файла из массива filenames
    filenames.forEach(filename => {
      // Создаём корневой элемент блока с классом .items
      const itemDiv = document.createElement('div');
      itemDiv.className = 'items';

      // Создаём иконку файла — статическое фото-изображение
      const iconImg = document.createElement('img');
      iconImg.src = '../icon/photo_icon.svg'; // путь к иконке
      iconImg.alt = 'photo_icon';
      iconImg.className = 'icon';

      // Создаём блок с названием файла
      const filenameDiv = document.createElement('div');
      filenameDiv.className = 'filename';
      filenameDiv.textContent = filename; // показываем имя файла

      // Создаём блок с URL-адресом файла (полный путь)
      const urlDiv = document.createElement('div');
      urlDiv.className = 'url';
      urlDiv.textContent = `http://localhost/images/${filename}`;

      // Создаём ссылку для удаления файла
      const deleteLink = document.createElement('a');
      deleteLink.href = '#'; // ссылка-заглушка

      // Внутри ссылки создаём иконку удаления
      const deleteImg = document.createElement('img');
      deleteImg.src = '../icon/delete.png'; // путь к иконке удаления
      deleteImg.alt = 'Удалить';
      deleteImg.className = 'delete';

      // Вставляем иконку удаления внутрь ссылки
      deleteLink.appendChild(deleteImg);

      // Добавляем обработчик клика по ссылке удаления
      deleteLink.addEventListener('click', (e) => {
        e.preventDefault(); // отменяем переход по ссылке

        // Отправляем запрос DELETE на сервер для удаления файла
        fetch(`/images/${filename}`, {
          method: 'DELETE'
        })
        .then(res => {
          if (res.ok) {
            // Если сервер подтвердил удаление, убираем элемент из DOM
            itemDiv.remove();
          } else {
            // Если ошибка с сервером, выводим ошибку и предупреждение
            console.error('Не удалось удалить файл на сервере');
            alert('Ошибка при удалении файла');
          }
        })
        .catch(err => {
          // Обрабатываем ошибки сети
          console.error('Ошибка удаления файла:', err);
          alert('Ошибка соединения при удалении');
        });
      });

      // Собираем блок: добавляем все элементы внутрь корневого .items
      itemDiv.appendChild(iconImg);
      itemDiv.appendChild(filenameDiv);
      itemDiv.appendChild(urlDiv);
      itemDiv.appendChild(deleteLink);

      // Вставляем готовый блок внутрь контейнера .items__wrapper
      wrapper.appendChild(itemDiv);
    });
  })
  // Ловим ошибки, которые могут возникнуть при fetch
  .catch(e => console.error('Ошибка:', e));
