export function Navbar(currentView, currentUser, navigate, logout) {
    const nav = document.createElement('nav');
    const isTeam = currentUser.role === 'team';

    nav.innerHTML = `
        <div class="nav-logo">
            <img src="https://norit.mx/assets/norit.png" alt="NORIT" style="height: 45px; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
            <span style="display: none;">NORIT<span>//</span>Ecosistema</span>
        </div>
        <div class="nav-links">
            <button class="nav-btn" id="btn-nav-cot">
                <img src="cotizador.png" style="height: 20px; width: 20px; vertical-align: middle; display: inline-block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                <span style="display: none;">📊 </span>Cotizador
            </button>
            ${isTeam ? `
            <button class="nav-btn" id="btn-nav-adm">
                <img src="inventario.png" style="height: 20px; width: 20px; vertical-align: middle; display: inline-block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                <span style="display: none;">🛠️ </span>Inventario Técnico
            </button>
            ` : ''}
            <button class="nav-btn" id="btn-nav-prf">
                <img src="perfil.png" style="height: 20px; width: 20px; vertical-align: middle; display: inline-block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                <span style="display: none;">👤 </span>Mi Perfil
            </button>
        </div>
        <div class="user-profile-badge">
            <span style="font-weight: 600; font-size: 0.9rem;">${currentUser.nombre}</span>
            <span class="role-pill ${isTeam ? 'role-team' : 'role-client'}">
                ${isTeam ? 'NORIT TEAM' : 'CLIENTE'}
            </span>
            <button id="btn-logout" class="nav-btn" style="padding: 4px 10px; font-size: 0.8rem; border: 1px solid var(--danger); color: var(--danger); border-radius: 4px;">
                Salir
            </button>
        </div>
    `;

    // Resaltar Vista Activa
    const btnCot = nav.querySelector('#btn-nav-cot');
    const btnAdm = nav.querySelector('#btn-nav-adm');
    const btnPrf = nav.querySelector('#btn-nav-prf');

    if (currentView === 'cotizador' && btnCot) btnCot.classList.add('active');
    if (currentView === 'admin' && btnAdm) btnAdm.classList.add('active');
    if (currentView === 'perfil' && btnPrf) btnPrf.classList.add('active');

    // Event Listeners
    if (btnCot) btnCot.addEventListener('click', () => navigate('cotizador'));
    if (btnAdm) btnAdm.addEventListener('click', () => navigate('admin'));
    if (btnPrf) btnPrf.addEventListener('click', () => navigate('perfil'));
    nav.querySelector('#btn-logout').addEventListener('click', logout);

    return nav;
}
