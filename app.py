from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
import mimetypes
import cgi
import uuid
import json
import logging

ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']
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
        unsafe_chars = ("'", '"', '-', '<', '>', '%', '(', ')')
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
        allowed_paths = ('/upload', '/css', '/js', '/images', '/index.html')
        if self.path == '/' or self.path.startswith(allowed_paths):
            if self.path == '/' or self.path == '/index.html':
                self.path = 'index.html'
            elif self.path == '/upload':
                self.path = 'upload.html'
            elif self.path == '/images':
                self.path = 'images.html'
            elif self.path == '/images?data=true':
                os.makedirs(IMAGES_DIR, exist_ok=True)
                files = [f for f in os.listdir(IMAGES_DIR) if allowed_file(f)]
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(files).encode())
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
        if ext not in ALLOWED_EXTENSIONS:
            self.send_json_message(400, 'error', 'Вы пытались загрузить файл с запрещенным расширением')
            logging.error(f'Ошибка: Пытались загрузить файл {name}{ext} с запрещенным расширением')
            return

        # Чтение содержимого файла
        file_data = file_field.file.read()
        if len(file_data) > MAX_FILE_SIZE:
            self.send_json_message(400, 'error', 'Вы пытались загрузить файл размером более 5 Мбайт')
            logging.error(f'Ошибка: Пытались загрузить файл размером {round(len(file_data) / 1024 / 1024, 2)} Мбайт')
            return

        # Генерация уникального имени
        unique_filename = f"{uuid.uuid4().hex[:16]}{ext}"

        #Сохранение файла
        with open(f'images/{unique_filename}', 'wb') as f:
            f.write(file_data)

        #Отправка сведений об успешной загрузке
        self.send_json_message(200, 'success', 'Файл успешно загружен',
                               f'http://localhost/images/{unique_filename}')
        #Логгируем успешную загрузку
        logging.info(f'Успех: Файл ({unique_filename}) сохранен')

    def do_DELETE(self):
        if self.path.startswith('/images/'):
            filename = self.path[len('/images/'):]
            filepath = os.path.join(IMAGES_DIR, filename)

            #Защита от удаления вне images
            if '..' in filename or '/' in filename or '\\' in filename:
                self.send_error(400, 'Неверное имя файла')
                return
            if os.path.isfile(filepath):
                try:
                    os.remove(filepath)
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'File deleted')
                    logging.info(f'Успех: Файл ({filename}) удален')
                except Exception as e:
                    self.send_error(500, f'Ошибка удаления: {e}')
                    logging.error(f'Ошибка: Файл {filename} не был удален')
            else:
                self.send_error(404, 'Файл не найден')
        else:
            self.send_error(404, 'Not found')
if __name__ == '__main__':
    PORT = 8000
    server = ThreadingHTTPServer(('0.0.0.0', PORT), BackendHandler)
    server.serve_forever()