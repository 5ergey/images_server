from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
import mimetypes
import cgi
import uuid
import json

ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif']
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 Мбайт


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
        elif os.path.exists(full_path) and os.path.isfile(full_path):
            self.send_static_file(full_path, status_code, content_type)
        else:
            self.send_static_file('static/404.html', 404, 'text/html')

    def set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def send_json_message(self, code, status, message):
        self.set_headers(code)
        response = {'status': status, 'message': message}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_GET(self):
        """Обрабатывает GET-запрос и отправляет соответствующий файл."""
        allowed_paths = ('/upload', '/css', '/js', '/img', '/icon',  '/favicon.ico')
        if self.path == '/' or self.path.startswith(allowed_paths):
            if self.path == '/':
                self.path = 'index.html'
            elif self.path == '/upload':
                self.path = 'upload.html'
            self.handle_file_request(self.path)
        else:
            self.send_static_file('static/403.html', 403, 'text/html')

    def do_POST(self):
        allowed_paths = '/upload'
        if self.path != allowed_paths:
            self.send_static_file('static/403.html', 403, 'text/html')
            return
        content_type = self.headers.get('Content-Type')
        if not content_type.startswith('multipart/form-data'):
            self.send_json_message(400, 'error', 'Вы должны загрузить файл')
            return
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={'REQUEST_METHOD': 'POST'}
        )

        file_field = form['file']
        if not file_field.file or not file_field.filename:
            self.send_json_message(400, 'error', 'Вы должны загрузить файл')
            return

        # Проверка расширения
        _, ext = os.path.splitext(file_field.filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            self.send_json_message(415, 'error', 'Вы пытались загрузить файл с запрещенным расширением')
            return

        # Чтение содержимого файла
        file_data = file_field.file.read()
        if len(file_data) > MAX_FILE_SIZE:
            self.send_json_message(413, 'error', 'Вы пытались загрузить файл размером более 5 Мбайт')
            return

        # Генерация уникального имени
        unique_filename = f"{uuid.uuid4().hex}{ext}"

        #Сохранение файла
        with open(f'images/{unique_filename}', 'wb') as f:
            f.write(file_data)

        self.send_json_message(200, 'success', 'Файл успешно загружен')

if __name__ == '__main__':
    PORT = 8000
    server = ThreadingHTTPServer(('localhost', PORT), BackendHandler)
    print(f'Сервер запущен на http://localhost:{PORT}')
    server.serve_forever()
