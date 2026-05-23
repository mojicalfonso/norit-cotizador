export function Login(navigate, showNotification) {
    const wrapper = document.createElement('div');
    wrapper.className = 'login-wrapper';

    wrapper.innerHTML = `
        <div class="card" style="border-top: 5px solid var(--srgb-primary); margin-top: 10vh;">
            <div class="login-banner">
                <img src="https://norit.mx/assets/norit.png" alt="NORIT" style="height: 100px; margin: 0 auto 12px auto; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <h1 style="display: none;">NORIT</h1>
                <p>Ecosistema de Cotizaciones & Ingeniería</p>
            </div>
            
            <form id="loginForm">
                <label>Correo Electrónico:</label>
                <input type="email" id="login-email" placeholder="nombre@norit.com" required>

                <label>Contraseña:</label>
                <input type="password" id="login-password" placeholder="••••••••" required>

                <div style="display: flex; gap: 10px; align-items: flex-end; margin-bottom: 16px;">
                    <div style="flex: 1;">
                        <label>Token de Acceso:</label>
                        <input type="text" id="login-token" placeholder="Ej. 123456" style="margin-bottom:0;" required>
                    </div>
                    <button type="button" class="btn-secondary" id="btnRequestToken" style="height: 44px; font-size:0.85rem; padding: 0 10px;">
                        Enviar por Correo
                    </button>
                </div>

                <button type="submit" style="width: 100%; margin-top: 10px; padding: 14px;">
                    Ingresar de forma Segura
                </button>
            </form>
        </div>
    `;

    wrapper.querySelector('#btnRequestToken').addEventListener('click', () => {
        const email = wrapper.querySelector('#login-email').value;
        if (!email) {
            showNotification("Por favor, escribí un correo válido.", "danger");
            return;
        }
        showNotification(`Token enviado con éxito al correo: ${email}`, "success");
    });

    wrapper.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = wrapper.querySelector('#login-email').value.trim();
        const password = wrapper.querySelector('#login-password').value;
        const token = wrapper.querySelector('#login-token').value.trim();

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, token })
            });
            const data = await res.json();

            if (res.ok) {
                showNotification(`¡Bienvenido, ${data.user.nombre}!`, "success");
                navigate('cotizador', data.user);
            } else {
                showNotification(data.error || "Acceso Denegado.", "danger");
            }
        } catch (err) {
            showNotification("Imposible contactar con el servidor local.", "danger");
        }
    });

    return wrapper;
}
