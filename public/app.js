let currentUser = null;
let cart = [];

// Categorías de arquitectura solicitadas y extendidas
const categoriasCotizacion = [
    "Acceso", "Agregación", "Cableado Estructurado", "Terminales", "Core Backbone", "Energía Respaldada"
];

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const token = document.getElementById('token').value;

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, token })
    });

    const data = await res.json();
    if (res.ok) {
        currentUser = data.user;
        document.getElementById('authModule').classList.add('hidden');
        document.getElementById('appModule').classList.remove('hidden');
        document.getElementById('userBadge').innerText = currentUser.email;
        searchProducts();
    } else {
        document.getElementById('authError').innerText = data.error;
    }
}

async function searchProducts() {
    const search = document.getElementById('search').value;
    const categoria = document.getElementById('filterCategoria').value;
    const marca = document.getElementById('filterMarca').value;

    // Construimos los query params de forma dinámica y segura
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (categoria) queryParams.append('categoria', categoria);
    if (marca) queryParams.append('marca', marca);

    const res = await fetch(`/api/productos?${queryParams.toString()}`);
    const productos = await res.json();

    const container = document.getElementById('productList');
    container.innerHTML = '';

    if (productos.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 15px;">No se encontraron elementos con los filtros seleccionados.</p>';
        return;
    }

    productos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-item';
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 12px; margin-bottom: 8px; border-radius: 4px; border-left: 3px solid var(--accent-blue);";
        div.innerHTML = `
            <div>
                <span class="badge" style="background:#42425a; margin-right:5px;">${p.categoria || 'N/A'}</span>
                <strong>${p.marca}</strong> - ${p.modelo}
                <br><small style="color: var(--text-muted); display:inline-block; margin-top:4px;">${p.descripcion_basica || 'Sin descripción técnica.'}</small>
            </div>
            <button onclick="addToCart('${p.modelo}', '${p.marca}')" style="width:auto; margin:0; padding: 5px 15px;">+</button>
        `;
        container.appendChild(div);
    });
}

function addToCart(modelo, marca) {
    // Añadimos por defecto la primera categoría configurable de la lista
    cart.push({ modelo, marca, categoria: categoriasCotizacion[0] });
    renderCart();
}

function updateItemCategory(index, category) {
    cart[index].categoria = category;
}

function renderCart() {
    const container = document.getElementById('cartList');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted)">No hay elementos agregados.</p>';
        return;
    }

    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        
        let selectOptions = categoriasCotizacion.map(cat => 
            `<option value="${cat}" ${item.categoria === cat ? 'selected' : ''}>${cat}</option>`
        ).join('');

        div.innerHTML = `
            <div>
                <strong>${item.modelo}</strong><br>
                <small>${item.marca}</small>
            </div>
            <div style="width: 50%;">
                <select onchange="updateItemCategory(${index}, this.value)" style="margin:0;">
                    ${selectOptions}
                </select>
            </div>
        `;
        container.appendChild(div);
    });
}

async function generarCotizacion() {
    if (cart.length === 0) return alert("El carrito está vacío.");

    const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: currentUser.email, items: cart })
    });

    const data = await res.json();
    if (res.ok) {
        document.getElementById('contractCard').classList.remove('hidden');
        document.getElementById('folioText').innerText = data.folio;
        document.getElementById('contractText').value = data.contrato;
    } else {
        alert(data.error);
    }
}

function firmarContrato() {
    const signed = document.getElementById('signature').checked;
    if (!signed) return alert("Debe marcar la casilla para firmar el documento.");
    
    alert("Operación completada con éxito en entorno local. Listo para replicar a producción.");
    cart = [];
    renderCart();
    document.getElementById('contractCard').classList.add('hidden');
}