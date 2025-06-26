import psycopg2
import os

postgres_config = {
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT")

}


class PostgresManager:
    def __init__(self, config, autocommit=False):
        self.config = config
        self.autocommit = autocommit
        self.conn = None
        self.cur = None

    def __enter__(self):
        # При входе в with — подключаемся к базе
        try:
            self.conn = psycopg2.connect(**self.config)
            print("Соединение с базой данных успешно")
        except Exception as e:
            print(f"Ошибка подключения: {e}")
        self.conn.autocommit = self.autocommit
        self.cur = self.conn.cursor()
        return self  # возвращаем объект для работы

    def __exit__(self, exc_type, exc_val, exc_tb):
        # При выходе из with — закрываем курсор и соединение
        if self.cur:
            self.cur.close()
        if self.conn:
            self.conn.close()

    def execute(self, query, params=None):
        self.cur.execute(query, params)
        if query.strip().lower().startswith("select"):
            return self.cur.fetchall()

    def commit(self):
        if self.conn and not self.autocommit:
            self.conn.commit()


    def create_table(self):
        query = """
            CREATE TABLE IF NOT EXISTS images (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            size INTEGER NOT NULL,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            file_type TEXT NOT NULL
        );
        """
        self.execute(query)
        self.commit()


    def save_file(self, unique_filename, original_name, size, file_type):
        query = """
            INSERT INTO images (filename, original_name, size, file_type)
            VALUES (%s, %s, %s, %s)
        """
        params = (
            unique_filename,
            original_name,
            size,
            file_type
        )
        self.execute(query, params)
        self.commit()
