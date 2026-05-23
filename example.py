import json
import sqlite3
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

# CONSTANTES DE ENTORNO LOCAL (Configuración fija)
API_HOST = "192.168.1.150"
API_PORT = 8080


class SecureAPIHandler(BaseHTTPRequestHandler):

    # 1. CABECERAS DE SEGURIDAD (Mitigación de ataques web)
    def send_security_headers(self):
        self.send_header("Content-Type", "application/json")
        # CORS: Solo permite peticiones desde tu origen local seguro
        self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        # Protección contra XSS y Clickjacking
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")

    def do_OPTIONS(self):
        """Maneja las peticiones preflight de los navegadores de forma segura."""
        self.send_response(204)
        self.send_security_headers()
        self.end_headers()

    # 2. ENDPOINT POST: Recibir datos de forma segura
    def do_POST(self):
        parsed_url = urlparse(self.path)

        if parsed_url.path == "/api/usuarios":
            # Evitar Denial of Service (DoS) limitando el tamaño del contenido leídos
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length > 1024 * 1024:  # Límite estricto: 1 Megabyte
                self.return_error(413, "Carga útil demasiado grande")
                return

            # Leer el cuerpo de la petición
            raw_data = self.rfile.read(content_length)

            try:
                data = json.loads(raw_data.decode("utf-8"))
                username = data.get("username")
                email = data.get("email")

                # VALIDACIÓN ESTRICTA (Sanitización básica contra Prompt Injection e inyecciones de código)
                if not username or not isinstance(username, str):
                    return self.return_error(400, "Nombre de usuario inválido")

                # Sanitizar: Permitir solo caracteres alfanuméricos en el username
                # Esto destruye cualquier intento de meter código HTML, JS o scripts de Prompt Injection
                clean_username = "".join(
                    c for c in username if c.isalnum() or c in "._-"
                )

                # Guardar en Base de Datos usando Consultas Parametrizadas
                self.save_to_database(clean_username, email)

                # Respuesta exitosa
                self.send_response(201)
                self.send_security_headers()
                self.end_headers()
                response = {
                    "status": "success",
                    "message": "Usuario registrado de forma segura",
                }
                self.wfile.write(json.dumps(response).encode("utf-8"))

            except json.JSONDecodeError:
                self.return_error(400, "JSON malformado")
            except Exception as e:
                # No le devuelvas el error interno al cliente (revelaría IPs o rutas del sistema)
                self.return_error(500, "Internal Server Error")

        else:
            self.return_error(404, "Recurso no encontrado")

    # 3. PREVENCIÓN DE INYECCIÓN SQL (Parámetros fijos)
    def save_to_database(self, username, email):
        # En código vanilla, NUNCA concatenes strings como: f"SELECT * FROM... WHERE user='{username}'"
        # Usar placeholders (?) obliga al motor de la BD a tratar el input como texto, no como comandos exec
        conn = sqlite3.connect("local_dev.db")
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO usuarios (username, email) VALUES (?, ?)",
            (username, email),
        )

        conn.commit()
        conn.close()

    def return_error(self, status_code, message):
        self.send_response(status_code)
        self.send_security_headers()
        self.end_headers()
        self.wfile.write(
            json.dumps({"status": "error", "message": message}).encode("utf-8")
        )


# Ejecución del servidor seguro
if __name__ == "__main__":
    server = HTTPServer((API_HOST, API_PORT), SecureAPIHandler)
    print(f" Servidor Vanilla Seguro corriendo en http://{API_HOST}:{API_PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()