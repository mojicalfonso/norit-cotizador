USE norit_db;

-- 1. Crear la tabla de usuarios con la estructura requerida si no existe
CREATE TABLE IF NOT EXISTS usuarios (
    id INT(11) NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    token_acceso VARCHAR(64) NULL,
    role VARCHAR(20) DEFAULT 'client',
    PRIMARY KEY (id),
    UNIQUE KEY unique_email (email),
    UNIQUE KEY unique_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. PARCHE DE ACTUALIZACIÓN SEGURA: Añadir la columna 'role' si tu tabla ya existía sin ella
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'client';

-- 3. Asegurar que tus usuarios existentes tengan los privilegios correctos en tu base local
-- Esto actualiza tu usuario "Soporte Norit" a rol administrativo de forma automática
UPDATE usuarios SET role = 'team' WHERE username = 'norit_admin';

-- 4. Registrar al usuario de Alfonso en la DB por si quieres usarlo también
--INSERT INTO usuarios (nombre, username, email, password, token_acceso, role) 
--VALUES ('Alfonso Mojica', 'amojica', 'alfonso@norit.com', 'tu_contrasenia_segura', '123456', 'team')
--ON DUPLICATE KEY UPDATE role='team', token_acceso='123456';