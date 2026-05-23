const CATEGORIAS_COTIZADOR_ITEM = ['Acceso', 'Agregación', 'Cableado Estructurado', 'Terminales', 'Core Backbone', 'Seguridad/Energía'];

export function Cotizador(STATE, showNotification) {
    const container = document.createElement('div');
    
    container.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: end;">
                <div>
                    <label>Filtrar por Categoría:</label>
                    <select id="cot-filter-cat" style="margin-bottom:0;">
                        <option value="">-- Todas las Categorías --</option>
                    </select>
                </div>
                <div>
                    <label>Filtrar por Marca Homologada:</label>
                    <select id="cot-filter-marca" style="margin-bottom:0;">
                        <option value="">-- Todas las Marcas --</option>
                    </select>
                </div>
                <div>
                    <label>Búsqueda de Modelo o Especificación:</label>
                    <input type="text" id="cot-search" placeholder="Escribe para buscar..." style="margin-bottom:0;">
                </div>
            </div>
        </div>

        <div class="grid-2">
            <div class="card" style="display: flex; flex-direction: column;">
                <h3 style="margin-bottom:15px; display:flex; justify-content:space-between;">
                    <span>Inventario Homologado</span>
                    <span style="font-size:0.8rem; color:var(--text-muted);" id="catalog-count">0 productos</span>
                </h3>
                <div id="catalog-list" class="scroll-list"></div>
            </div>

            <div class="card" style="display: flex; flex-direction: column;">
                <h3 style="margin-bottom:15px;">Estructura de la Solución Técnica</h3>
                <div id="cart-list" class="scroll-list"></div>
                <button class="btn-success" id="btnGenQuote" style="margin-top: 15px; font-size:1.1rem; padding:14px;">
                    💾 Generar Folio & Contrato Técnico
                </button>
            </div>
        </div>

        <div class="card hidden" id="contractCard" style="margin-top:24px; border-top:4px solid var(--success);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3>Documento Contractual Técnico: <span id="folioText" style="color:#81c784;"></span></h3>
                <button class="btn-danger" style="padding: 6px 12px; font-size: 0.8rem;" id="btnHideContract">Cancelar</button>
            </div>
            <textarea id="contractText" style="width:100%; height:200px; font-family:monospace; background:rgba(0,0,0,0.3); border-color:var(--srgb-accent); margin-bottom:15px;" readonly></textarea>
            
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; align-items: center;">
                <div>
                    <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;">
                        Al confirmar, el sistema asocia de manera irrevocable este contrato a tu firma digital.
                    </p>
                    <label style="display:flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" id="chkSignedCheck" style="width:auto; margin-right:10px; margin-bottom:0;">
                        He verificado el equipamiento listado.
                    </label>
                </div>
                <div class="signature-area" id="sigArea">
                    <span style="font-size:0.85rem;" id="sigInstructions">Haz clic aquí para Firmar Digitalmente como ${STATE.currentUser.nombre}</span>
                    <div class="signature-canvas-text hidden" id="sigDraw"></div>
                </div>
            </div>
            <button class="btn-success" style="margin-top:20px; width:100%;" id="btnFinalizeComplete">
                Aceptar y Almacenar en Norit_DB
            </button>
        </div>
    `;

    // Poblar selectores
    const filterCat = container.querySelector('#cot-filter-cat');
    const filterMarca = container.querySelector('#cot-filter-marca');
    
    ['Routers', 'Switches', 'Access Points (AP)', 'Cámaras', 'Cableado Estructurado', 'Terminales', 'Core Backbone'].forEach(c => {
        filterCat.innerHTML += `<option value="${c}">${c}</option>`;
    });
    ['Tp-Link', 'Ubiquiti', 'Dahua', 'Hikvision', 'Linksys', 'Mercusys', 'Mikrotik'].forEach(m => {
        filterMarca.innerHTML += `<option value="${m}">${m}</option>`;
    });

    const renderCatalog = async () => {
        const cat = filterCat.value;
        const marca = filterMarca.value;
        const search = container.querySelector('#cot-search').value;

        const q = new URLSearchParams();
        if (cat) q.append('categoria', cat);
        if (marca) q.append('marca', marca);
        if (search) q.append('search', search);

        const res = await fetch(`/api/productos?${q.toString()}`);
        const products = await res.json();

        const list = container.querySelector('#catalog-list');
        list.innerHTML = '';
        container.querySelector('#catalog-count').innerText = `${products.length} productos`;

        products.forEach(p => {
            const row = document.createElement('div');
            row.className = 'list-item';
            
            let featuresHTML = '';
            if (p.caracteristicas && Array.isArray(p.caracteristicas)) {
                featuresHTML = `<div style="margin-top: 6px; display: flex; flex-wrap: wrap;">` + 
                    p.caracteristicas.map(f => `<span class="feature-badge"># ${f}</span>`).join('') + 
                    `</div>`;
            }

            row.innerHTML = `
                <div class="item-details">
                    <span class="badge-tag">${p.categoria}</span>
                    <h4 style="font-size: 1.05rem;"><strong>${p.marca}</strong> - ${p.modelo}</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top:4px;">${p.descripcion_basica}</p>
                    ${featuresHTML}
                </div>
                <div class="item-actions">
                    <button class="btn-secondary btn-add" style="padding: 6px 12px;">+ Agregar</button>
                </div>
            `;

            row.querySelector('.btn-add').addEventListener('click', () => {
                STATE.cart.push({
                    id: p.id,
                    marca: p.marca,
                    modelo: p.modelo,
                    categoriaCot: 'Acceso',
                    caracteristicas: p.caracteristicas || []
                });
                showNotification(`Se agregó ${p.marca} al carrito`, "success");
                renderCart();
            });

            list.appendChild(row);
        });
    };

    const renderCart = () => {
        const list = container.querySelector('#cart-list');
        list.innerHTML = '';

        if (STATE.cart.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); padding:20px;">El carrito está vacío.</p>';
            return;
        }

        STATE.cart.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'list-item';
            row.style.borderLeftColor = 'var(--success)';
            
            let selectOptions = CATEGORIAS_COTIZADOR_ITEM.map(cat => 
                `<option value="${cat}" ${item.categoriaCot === cat ? 'selected' : ''}>${cat}</option>`
            ).join('');

            row.innerHTML = `
                <div class="item-details">
                    <h4 style="font-size:1rem;">${item.marca} - ${item.modelo}</h4>
                    <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">Ubicación:</span>
                        <select class="cart-cat-select" style="margin-bottom:0; padding:4px 8px; font-size:0.8rem; width:auto; background:var(--panel-dark);">
                            ${selectOptions}
                        </select>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-danger btn-remove" style="padding: 6px 10px; font-size: 0.8rem;">Quitar</button>
                </div>
            `;

            row.querySelector('.cart-cat-select').addEventListener('change', (e) => {
                STATE.cart[index].categoriaCot = e.target.value;
            });

            row.querySelector('.btn-remove').addEventListener('click', () => {
                STATE.cart.splice(index, 1);
                renderCart();
            });

            list.appendChild(row);
        });
    };

    // Listeners de búsqueda
    filterCat.addEventListener('change', renderCatalog);
    filterMarca.addEventListener('change', renderCatalog);
    container.querySelector('#cot-search').addEventListener('keyup', renderCatalog);

    // Contrato
    container.querySelector('#btnGenQuote').addEventListener('click', async () => {
        if (STATE.cart.length === 0) {
            showNotification("El carrito está vacío.", "warning");
            return;
        }

        const res = await fetch('/api/cotizaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente: STATE.currentUser.email, items: STATE.cart })
        });
        const data = await res.json();

        if (res.ok) {
            container.querySelector('#contractText').value = data.contrato;
            container.querySelector('#folioText').innerText = data.folio;
            container.querySelector('#contractCard').classList.remove('hidden');
            container.querySelector('#contractCard').scrollIntoView({ behavior: 'smooth' });
        }
    });

    const sigArea = container.querySelector('#sigArea');
    sigArea.addEventListener('click', () => {
        sigArea.className = 'signature-area signed';
        container.querySelector('#sigInstructions').classList.add('hidden');
        const sigDraw = container.querySelector('#sigDraw');
        sigDraw.innerText = `/ ${STATE.currentUser.nombre} /`;
        sigDraw.classList.remove('hidden');
        showNotification("Firma registrada.", "success");
    });

    container.querySelector('#btnHideContract').addEventListener('click', () => {
        container.querySelector('#contractCard').classList.add('hidden');
    });

    container.querySelector('#btnFinalizeComplete').addEventListener('click', () => {
        if (!container.querySelector('#chkSignedCheck').checked || !sigArea.classList.contains('signed')) {
            showNotification("Firma digital obligatoria para almacenar el contrato.", "warning");
            return;
        }
        showNotification("Cotización completada y registrada en MariaDB.", "success");
        STATE.cart = [];
        renderCart();
        container.querySelector('#contractCard').classList.add('hidden');
    });

    renderCatalog();
    renderCart();

    return container;
}
