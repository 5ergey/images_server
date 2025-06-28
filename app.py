from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
import mimetypes
import cgi
import uuid
import json
import logging


from db_manager import PostgresManager, postgres_config


ALLOWED_EXTENSIONS = ['jpg', 'png', 'gif']
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 Мбайт
LOGS_DIR = 'logs'
IMAGES_DIR = 'images'


#Конфигурируем логгирование
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    filename=f'{LOGS_DIR}/app.log',
    filemode='a'
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class BackendHandler(BaseHTTPRequestHandler):
    def send_static_file(self, filepath, status_code, content_type):
        """Читает файл с диска и отправляет его клиенту."""
        try:
            with open(filepath, 'rb') as file:
                content = file.read()
            self.send_response(status_code)
            self.send_header('Content-type', content_type)
            self.send_header('Content-length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f'Не удалось открыть файл: {e}')
            logging.error(f"Ошибка: Не удалось открыть файл {filepath} с HDD")

    def is_path_malicious(self):
        """Проверяет путь на наличие потенциально опасных символов."""
        unsafe_chars = ("'", '"', '<', '>', '%', '(', ')')
        return any(char in self.path for char in unsafe_chars)

    def handle_file_request(self, relative_path, status_code=200):
        """Определяет, что именно отдать клиенту"""
        full_path = f'static/{relative_path}'
        content_type, _ = mimetypes.guess_type(full_path)
        if content_type == None:
            content_type = 'application/stream'
        if self.is_path_malicious():
            self.send_static_file('static/403.html', 403, 'text/html')
            logging.error(f"Ошибка: Пытались открыть url http://localhost/{relative_path}")
        elif os.path.exists(full_path) and os.path.isfile(full_path):
            self.send_static_file(full_path, status_code, content_type)
        else:
            self.send_static_file('static/404.html', 404, 'text/html')
            logging.error(f"Ошибка: Пытались открыть url http://localhost/{relative_path}")

    def set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def send_json_message(self, code, status, message, url=''):
        self.set_headers(code)
        response = {'status': status, 'message': message, 'url': url}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_GET(self):
        """Обрабатывает GET-запрос и отправляет соответствующий файл."""
        allowed_paths = ('/upload', '/css', '/js', '/images', '/index.html', '/images-list')
        if self.path == '/' or self.path.startswith(allowed_paths):
            if self.path == '/' or self.path == '/index.html':
                self.path = 'index.html'
            elif self.path == '/upload':
                self.path = 'upload.html'
            elif self.path == '/images':
                self.path = 'images.html'
            elif self.path == '/images-list':
                self.path = 'images-list.html'
            elif self.path == '/images?data=true':
                os.makedirs(IMAGES_DIR, exist_ok=True)
                files = [f for f in os.listdir(IMAGES_DIR) if allowed_file(f)]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(files).encode())
                return
            elif self.path.startswith('/images-list?page='):
                with PostgresManager(postgres_config) as db:
                    page_offset = (int(self.path.split('=')[1]) if self.path.split('=')[1].isdigit() else 1)
                    count_result = db.execute('SELECT COUNT(*) FROM images;')
                    total_count = count_result[0][0]
                    rows = db.execute(f'SELECT * FROM images LIMIT=1 OFFSET={page_offset};')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()

                    # Преобразуем к списку словарей (читаемый JSON)
                    columns = ['id', 'filename', 'original_name', 'size', 'upload_time', 'file_type']
                    json_data = {'list':[dict(zip(columns, row)) for row in rows], 'total':total_count}
                    self.wfile.write(json.dumps(json_data, default=str).encode('utf-8'))
                    return
            self.handle_file_request(self.path)
        else:
            self.send_static_file('static/403.html', 403, 'text/html')
            logging.error(f"Ошибка: Пытались открыть url http://localhost{self.path}")

    def do_POST(self):
        """Обрабатывает POST-запрос (загрузка изображений)"""
        allowed_paths = '/upload'
        if self.path != allowed_paths:
            self.send_static_file('static/403.html', 403, 'text/html')
            logging.error(f"Ошибка: Пытались открыть url http://localhost{self.path}")
            return
        content_type = self.headers.get('Content-Type')
        if not content_type.startswith('multipart/form-data'):
            self.send_json_message(400, 'error', 'Вы должны загрузить файл')
            logging.error(f"Ошибка: Пытались загрузить объект с content type: {content_type}")
            return
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST'}
        )

        file_field = form['file']
        if not file_field.file or not file_field.filename:
            self.send_json_message(400, 'error', 'Вы должны загрузить файл')
            logging.error(f'Ошибка: Файл не был передан через форму')
            return

        # Проверка расширения
        name, ext = os.path.splitext(file_field.filename.lower())
        if ext[1:] not in ALLOWED_EXTENSIONS:
            self.send_json_message(400, 'error', 'Вы пытались загрузить файл с запрещенным расширением')
            logging.error(f'Ошибка: Пытались загрузить файл {name}{ext} с запрещенным расширением {ext}')
            return

        # Чтение содержимого файла
        file_data = file_field.file.read()
        if len(file_data) > MAX_FILE_SIZE:
            self.send_json_message(400, 'error', 'Вы пытались загрузить файл размером более 5 Мбайт')
            logging.error(f'Ошибка: Пытались загрузить файл размером {round(len(file_data) / 1024 / 1024, 2)} Мбайт')
            return

        # Генерация уникального имени
        unique_filename = f"{uuid.uuid4().hex[:16]}{ext}"
        filepath = os.path.join(IMAGES_DIR, unique_filename)

        #Сохранение файла
        try:
            with open(f'images/{unique_filename}', 'wb') as f:
                f.write(file_data)
        except Exception as e:
            self.send_json_message(500, 'error', 'Не удалось сохранить файл на диск')
            logging.error(f'Ошибка: Не удалось сохранить файл {unique_filename} — {e}')
            return
        try:
            with PostgresManager(postgres_config) as db:
                db.save_file(unique_filename, file_field.filename, len(file_data), ext[1:])
            logging.info(f'Файл {file_field.filename}{ext} добавлен в базу данных под уникальным именем {unique_filename}')
        except Exception as e:
            # Если ошибка в БД — удаляем файл с диска
            os.remove(filepath)
            logging.error(f'Ошибка при добавлении файла в БД. Файл {unique_filename} удалён. Ошибка: {e}')
            return

        #Отправка сведений об успешной загрузке
        self.send_json_message(200, 'success', 'Файл успешно загружен',
                               f'http://localhost/images/{unique_filename}')
        #Логгируем успешную загрузку
        logging.info(f'Успех: Файл ({unique_filename}) сохранен')

    def do_DELETE(self):
        if not self.path.startswith('/delete/'):
            self.send_error(404, 'Not found')
            return
        try:
            # 1. Извлекаем ID из пути
            file_id_str = self.path[len('/delete/'):]
            file_id = int(file_id_str)
        except ValueError:
            self.send_error(400, 'Некорректный ID')
            return

        try:
            with PostgresManager(postgres_config) as db:
                # 2. Получаем запись по ID
                result = db.execute(f"SELECT filename FROM images WHERE id={file_id};")

                if not result:
                    self.send_error(404, 'Файл с таким ID не найден')
                    return
                logging.info(result)
                filename = result[0][0]
                filepath = os.path.abspath(os.path.join(IMAGES_DIR, filename))

                # 4. Удаляем файл с диска
                if os.path.isfile(filepath):
                    os.remove(filepath)
                else:
                    logging.warning(f'Файл отсутствует на диске: {filename}')

                # 5. Удаляем запись из БД
                db.execute(f"DELETE FROM images WHERE id={file_id};")
                db.commit()
                # 6. Ответ клиенту
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain; charset=utf-8')
                self.end_headers()
                self.wfile.write(b'File deleted')
                logging.info(f'Файл с ID {file_id} удален')

        except Exception as e:
            logging.error(f'Ошибка при удалении файла с ID {file_id}')
            self.send_error(500, f'Ошибка сервера: {e}')

if __name__ == '__main__':
    try:
        with PostgresManager(postgres_config) as db:
            db.create_table()
    except Exception as e:
        logging.exception("Ошибка при создании таблицы")
    PORT = 8000
    server = ThreadingHTTPServer(('0.0.0.0', PORT), BackendHandler)
    server.serve_forever()