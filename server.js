import express from 'express';
import { createPool } from 'mariadb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Control de tamaño de payload (Seguridad contra ataques DoS)
app.use(express.json({ limit: '10kb' })); 
app.use(express.static(path.join(__dirname, 'public')));

// Pool de conexiones a MariaDB utilizando tus credenciales fijos
const pool = createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

const MARCAS_PERMITIDAS = ['Tp-Link', 'Ubiquiti', 'Dahua', 'Hikvision', 'Linksys', 'Mercusys', 'Mikrotik'];

// Helper de validación temprana (Whitelisting alfanumérico)
const validateAlphanumeric = (str) => /^[a-zA-Z0-9\s-_.]+$/.test(str);
const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

// 1. Endpoint de Autenticación Rápida (Mejorado para depuración local)
app.post('/api/auth/login', async (req, res) => {
  let conn;
  try {
    const { email, password, token } = req.body;

    // === DEPURACIÓN LOCAL (TEMPORAL) ===
    console.log("=========================================");
    console.log("📩 PETICIÓN DE INICIO DE SESIÓN RECIBIDA:");
    console.log("Email enviado :", `"${email}"`);
    console.log("Clave enviada :", `"${password}"`);
    console.log("Token enviado :", `"${token}"`);
    console.log("=========================================");

    if (!email || !password || !token || !validateEmail(email)) {
      console.log("⚠️ Validación de formato fallida.");
      return res.status(400).json({ error: "Credenciales malformadas." });
    }

    conn = await pool.getConnection();
    
    // === DEPURACIÓN DE CONEXIÓN A DB (TEMPORAL) ===
    console.log("🔌 Conexión con MariaDB establecida con éxito.");

    const query = `
      SELECT id, nombre, email, username, role 
      FROM usuarios 
      WHERE email = ? AND password = ? AND token_acceso = ? 
      LIMIT 1
    `;
    
    console.log("🔎 Ejecutando consulta SQL parametrizada...");
    const rows = await conn.query(query, [email, password, token]);

    // === DEPURACIÓN DE RESULTADOS DE DB (TEMPORAL) ===
    console.log(`📊 Coincidencias encontradas en la base de datos: ${rows.length}`);
    if (rows.length > 0) {
      console.log("✅ Usuario encontrado:", JSON.stringify(rows[0]));
    } else {
      console.log("❌ No se encontró ningún registro que coincida con esos tres parámetros simultáneamente.");
      
      // Consultas diagnósticas internas para guiar al usuario en consola
      const testEmail = await conn.query("SELECT email, password, token_acceso, role FROM usuarios WHERE email = ?", [email]);
      if (testEmail.length > 0) {
        console.log("💡 El correo SÍ existe. Registro almacenado en base de datos:");
        console.log(`   Esperado -> Clave: "${testEmail[0].password}" | Token: "${testEmail[0].token_acceso}" | Rol: "${testEmail[0].role}"`);
      } else {
        console.log("💡 El correo ingresado NO existe en la tabla 'usuarios'.");
        const allUsers = await conn.query("SELECT email FROM usuarios");
        console.log("   Correos que sí están registrados:", allUsers.map(u => u.email));
      }
    }
    console.log("=========================================");

    if (rows.length === 0) {
      return res.status(401).json({ error: "Acceso denegado. Credenciales incorrectas." });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("❌ ERROR CRÍTICO EN LOGIN LOCAL:", err);
    res.status(500).json({ error: "Error de autenticación interno en el servidor." });
  } finally {
    if (conn) conn.end();
  }
});

// 2. Endpoint de Productos con Filtros Cruzados (Filtros dinámicos seguros)
app.get('/api/productos', async (req, res) => {
  let conn;
  try {
    const { search, categoria, marca, onlyMissing } = req.query;

    const inputs = [search, categoria, marca];
    for (let input of inputs) {
      if (input && !validateAlphanumeric(input)) {
        return res.status(400).json({ error: "Parámetros de búsqueda inválidos." });
      }
    }

    conn = await pool.getConnection();
    let query = "SELECT id, modelo, marca, categoria, descripcion_basica, technical_specs, caracteristicas FROM productos_tecnicos WHERE 1=1";
    const params = [];

    if (onlyMissing === 'true') {
      query += " AND (modelo IS NULL OR TRIM(modelo) = '' OR modelo LIKE '%INDETERMINADO%')";
    } else if (search) {
      query += " AND (modelo LIKE ? OR descripcion_basica LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (categoria) {
      query += " AND categoria = ?";
      params.push(categoria);
    }

    if (marca) {
      query += " AND marca = ?";
      params.push(marca);
    }

    query += " LIMIT 100";
    const rows = await conn.query(query, params);

    // Mapeamos las características para deserializar el JSON si corresponde
    const parsedRows = rows.map(r => ({
      ...r,
      caracteristicas: typeof r.caracteristicas === 'string' ? JSON.parse(r.caracteristicas) : (r.caracteristicas || [])
    }));

    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: "Error al procesar el catálogo." });
  } finally {
    if (conn) conn.end();
  }
});

// 3. Crear Producto (Mantenimiento Técnico)
app.post('/api/admin/productos', async (req, res) => {
  let conn;
  try {
    const { modelo, marca, categoria, descripcion_basica, technical_specs, caracteristicas } = req.body;

    if (!marca || !categoria || !MARCAS_PERMITIDAS.includes(marca)) {
      return res.status(400).json({ error: "La marca o categoría no está homologada." });
    }

    conn = await pool.getConnection();
    const query = `
      INSERT INTO productos_tecnicos (modelo, marca, categoria, descripcion_basica, technical_specs, caracteristicas) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const featuresJSON = JSON.stringify(caracteristicas || []);
    await conn.query(query, [modelo || 'INDETERMINADO', marca, categoria, descripcion_basica || '', technical_specs || '', featuresJSON]);

    res.status(201).json({ success: true, message: "Elemento creado en el inventario local." });
  } catch (err) {
    res.status(500).json({ error: "Error al guardar el elemento." });
  } finally {
    if (conn) conn.end();
  }
});

// 4. Modificar Producto
app.put('/api/admin/productos/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { modelo, marca, categoria, descripcion_basica, technical_specs, caracteristicas } = req.body;

    const idInt = parseInt(id);
    if (isNaN(idInt)) return res.status(400).json({ error: "ID inválido." });

    if (!MARCAS_PERMITIDAS.includes(marca)) {
      return res.status(400).json({ error: "Esa marca viola las políticas de homologación." });
    }

    conn = await pool.getConnection();
    const query = `
      UPDATE productos_tecnicos 
      SET modelo = ?, marca = ?, categoria = ?, descripcion_basica = ?, technical_specs = ?, caracteristicas = ? 
      WHERE id = ?
    `;
    const featuresJSON = JSON.stringify(caracteristicas || []);
    await conn.query(query, [modelo || 'INDETERMINADO', marca, categoria, descripcion_basica || '', technical_specs || '', featuresJSON, idInt]);

    res.json({ success: true, message: "Registro técnico actualizado con éxito." });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la fila." });
  } finally {
    if (conn) conn.end();
  }
});

// 5. Eliminar Producto
app.delete('/api/admin/productos/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const idInt = parseInt(id);
    if (isNaN(idInt)) return res.status(400).json({ error: "ID inválido." });

    conn = await pool.getConnection();
    await conn.query("DELETE FROM productos_tecnicos WHERE id = ?", [idInt]);

    res.json({ success: true, message: "Registro eliminado." });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar el elemento." });
  } finally {
    if (conn) conn.end();
  }
});

// 6. Generar Cotización y Contrato Técnico
app.post('/api/cotizaciones', async (req, res) => {
  try {
    const { cliente, items } = req.body;

    if (!cliente || !validateEmail(cliente) || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Datos de cotización inválidos." });
    }

    const folio = 'COT-' + Math.floor(100000 + Math.random() * 900000);
    let itemsText = items.map((it, idx) => {
      let featureLines = (it.caracteristicas && it.caracteristicas.length > 0) ? 
          `\n      └─ Características: ${it.caracteristicas.join(' | ')}` : '';
      return `[ÍTEM ${idx + 1}] MARCA: ${it.marca} | MODELO: ${it.modelo} | FUNCIÓN: ${it.categoriaCot}${featureLines}`;
    }).join('\n\n');

    const contrato = `========================================================================\n` +
                     `        CONTRATO DE ARQUITECTURA TECNOLÓGICA NORIT - FOLIO: ${folio}\n` +
                     `========================================================================\n\n` +
                     `CLIENTE FIRMANTE: ${cliente.toUpperCase()}\n` +
                     `FECHA DE EMISIÓN: ${new Date().toLocaleDateString()}\n\n` +
                     `Equipamiento Homologado provisto por NORIT:\n\n${itemsText}\n\n` +
                     `FIRMA DIGITAL VINCULADA DE FORMA REGISTRADA BAJO NORIT_DB:`;

    res.status(201).json({ success: true, folio, contrato });
  } catch (err) {
    res.status(500).json({ error: "Error al generar cotización." });
  }
});

// 7. Registro de Nuevos Usuarios (RESTRICCIÓN EXCLUSIVA para usuario_prueba@norit.com)
app.post('/api/admin/usuarios', async (req, res) => {
  let conn;
  try {
    const { creatorEmail, nombre, username, email, password, token_acceso, role } = req.body;

    // Validación estricta en Backend: Solo se le permite al administrador principal
    if (creatorEmail !== 'usuario_prueba@norit.com') {
      return res.status(403).json({ error: "No autorizado. Solo Soporte Norit posee privilegios para registrar usuarios." });
    }

    if (!nombre || !username || !email || !password || !token_acceso || !role) {
      return res.status(400).json({ error: "Todos los campos con asterisco (*) son requeridos." });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Formato de correo electrónico inválido." });
    }

    conn = await pool.getConnection();
    const query = `
      INSERT INTO usuarios (nombre, username, email, password, token_acceso, role) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await conn.query(query, [nombre, username, email, password, token_acceso, role]);

    res.status(201).json({ success: true, message: "Nuevo usuario registrado correctamente en la base de datos." });
  } catch (err) {
    console.error("❌ ERROR AL CREAR USUARIO EN MARIA_DB:", err);
    res.status(500).json({ error: "Error al registrar el usuario en MariaDB (posible correo o username duplicado)." });
  } finally {
    if (conn) conn.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Ecosistema NORIT corriendo localmente en http://127.0.0.1:${PORT}`));
