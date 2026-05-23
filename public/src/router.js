import { Navbar } from './components/Navbar.js';
import { Login } from './components/Login.js';
import { Cotizador } from './components/Cotizador.js';
import { AdminInventario } from './components/AdminInventario.js';
import { PerfilUsuario } from './components/PerfilUsuario.js';

export const STATE = {
    view: 'login', // 'login', 'cotizador', 'admin', 'perfil'
    currentUser: null,
    cart: []
};

// Sistema Toast de Notificaciones
export function showNotification(message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    if (!toast) return;
    toast.innerText = message;
    toast.className = 'notification show';
    
    if (type === 'success') toast.style.backgroundColor = 'var(--success)';
    else if (type === 'warning') toast.style.backgroundColor = 'var(--warning)';
    else if (type === 'danger') toast.style.backgroundColor = 'var(--danger)';
    else toast.style.backgroundColor = 'var(--srgb-primary)';

    setTimeout(() => {
        toast.className = 'notification';
    }, 3000);
}

export function navigate(targetView, userData = null) {
    STATE.view = targetView;
    if (userData) STATE.currentUser = userData;
    renderNavbar();
    renderApp();
}

export function logout() {
    STATE.currentUser = null;
    STATE.cart = [];
    showNotification("Sesión finalizada de manera segura.", "info");
    navigate('login');
}

function renderNavbar() {
    const navRoot = document.getElementById('navigation-root');
    if (!navRoot) return;

    if (STATE.view === 'login' || !STATE.currentUser) {
        navRoot.innerHTML = '';
        return;
    }

    navRoot.innerHTML = '';
    navRoot.appendChild(Navbar(STATE.view, STATE.currentUser, navigate, logout));
}

export function renderApp() {
    const appRoot = document.getElementById('app-root');
    if (!appRoot) return;

    appRoot.innerHTML = '';

    if (!STATE.currentUser) {
        appRoot.appendChild(Login(navigate, showNotification));
        return;
    }

    switch (STATE.view) {
        case 'cotizador':
            appRoot.appendChild(Cotizador(STATE, showNotification));
            break;
        case 'admin':
            if (STATE.currentUser.role !== 'team') {
                navigate('cotizador');
                return;
            }
            appRoot.appendChild(AdminInventario(STATE, showNotification));
            break;
        case 'perfil':
            appRoot.appendChild(PerfilUsuario(STATE, showNotification, navigate));
            break;
        default:
            appRoot.appendChild(Cotizador(STATE, showNotification));
    }
}
