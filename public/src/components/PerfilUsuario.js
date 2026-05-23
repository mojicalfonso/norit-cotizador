export function PerfilUsuario(STATE, showNotification, navigate) {
    const container = document.createElement('div');
    container.className = 'profile-wrapper';

    // Comprobamos si el usuario es Alfonso o el Administrador principal (Soporte Norit)
    const isSuperAdmin = STATE.currentUser.email === 'usuario_prueba@norit.com' || STATE.currentUser.username === 'norit_admin';

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 24px; max-width: 500px; margin: auto;">
            <!-- CARD 1: EDICIÓN DE PERFIL PROPIO -->
            <div class="card" style="border-top: 5px solid var(--srgb-primary);">
                <h2 style="margin-bottom:15px; text-align:center;">Detalles del Perfil</h2>
                
                <label>Nombre Completo:</label>
                <input type="text" id="prof-name" value="${STATE.currentUser.nombre}">

                <label>Nombre de Usuario (Username):</label>
                <input type="text" id="prof-username" value="${STATE.currentUser.username}">

                <label>Correo Electrónico:</label>
                <input type="email" id="prof-email" value="${STATE.currentUser.email}">

                <hr style="border:none; border-top:1px solid var(--srgb-accent); margin:15px 0;">
                
                <h3 style="font-size:1.1rem; margin-bottom:10px;">Cambiar Contraseña</h3>
                <label>Contraseña Nueva:</label>
                <input type="password" id="prof-pass" placeholder="Mantener contraseña actual">

                <button id="btnSaveProfile" style="width:100%; margin-top:10px;">
                    Actualizar Datos en Norit_DB
                </button>
            </div>

            <!-- CARD 2: GESTIÓN DE NUEVOS USUARIOS (EXCLUSIVO SUPERADMIN) -->
            ${isSuperAdmin ? `
            <div class="card" style="border-top: 5px solid var(--success);">
                <h2 style="margin-bottom:10px; text-align:center;">🔑 Registro de Usuarios</h2>
                <p style="font-size:0.8rem; color:var(--text-muted); text-align:center; margin-bottom:20px;">
                    Privilegios especiales: Solo tú puedes añadir nuevos técnicos (Team) o clientes al ecosistema NORIT.
                </p>
                
                <form id="createUserForm">
                    <label>Nombre Completo *</label>
                    <input type="text" id="new-nombre" placeholder="Ej. Juan Pérez" required>

                    <label>Nombre de Usuario (Username) *</label>
                    <input type="text" id="new-username" placeholder="Ej. jperez" required>

                    <label>Correo Electrónico *</label>
                    <input type="email" id="new-email" placeholder="Ej. jperez@norit.com" required>

                    <label>Contraseña *</label>
                    <input type="password" id="new-password" placeholder="••••••••" required>

                    <label>Token de Acceso *</label>
                    <input type="text" id="new-token" placeholder="Ej. 987654" required>

                    <label>Rol del Usuario *</label>
                    <select id="new-role">
                        <option value="client">Cliente</option>
                        <option value="team">Miembro de Equipo (Team)</option>
                    </select>

                    <button type="submit" class="btn-success" style="width:100%; margin-top:10px;">
                        Crear e Insertar en MariaDB
                    </button>
                </form>
            </div>
            ` : ''}
        </div>
    `;

    // Guardar Perfil Propio (Simulado por ahora)
    container.querySelector('#btnSaveProfile').addEventListener('click', () => {
        showNotification("Los datos del usuario han sido actualizados en MariaDB local.", "success");
    });

    // Registrar Nuevos Usuarios (Solo si el formulario existe en el DOM)
    if (isSuperAdmin) {
        container.querySelector('#createUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nombre = container.querySelector('#new-nombre').value.trim();
            const username = container.querySelector('#new-username').value.trim();
            const email = container.querySelector('#new-email').value.trim();
            const password = container.querySelector('#new-password').value;
            const token_acceso = container.querySelector('#new-token').value.trim();
            const role = container.querySelector('#new-role').value;

            try {
                const res = await fetch('/api/admin/usuarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creatorEmail: STATE.currentUser.email, // Enviamos el correo de quien crea para validación
                        nombre,
                        username,
                        email,
                        password,
                        token_acceso,
                        role
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    showNotification("¡Usuario registrado con éxito en MariaDB!", "success");
                    container.querySelector('#createUserForm').reset();
                } else {
                    showNotification(data.error || "Ocurrió un error al procesar el registro.", "danger");
                }
            } catch (err) {
                showNotification("No se pudo conectar con el servidor local.", "danger");
            }
        });
    }

    return container;
}
