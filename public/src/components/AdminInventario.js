const MARCAS_NORIT = ['Tp-Link', 'Ubiquiti', 'Dahua', 'Hikvision', 'Linksys', 'Mercusys', 'Mikrotik'];
const CATEGORIAS_NORIT = ['Routers', 'Switches', 'Access Points (AP)', 'Cámaras', 'Cableado Estructurado', 'Terminales', 'Core Backbone'];

export function AdminInventario(STATE, showNotification) {
    const container = document.createElement('div');

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
            <div class="card" style="border-top: 4px solid var(--srgb-primary);">
                <h3 id="adminFormTitle" style="margin-bottom:15px;">Agregar Nuevo Registro a la Base de Datos</h3>
                <input type="hidden" id="prod-id">
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <label>Marca Homologada *</label>
                        <select id="prod-marca">
                            <option value="">-- Todas las Marcas --</option>
                            ${MARCAS_NORIT.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label>Modelo * (Dejar vacío si es indeterminado)</label>
                        <input type="text" id="prod-modelo" placeholder="Ej. EdgeRouter X">
                    </div>
                    <div>
                        <label>Tipo / Categoría de Red</label>
                        <select id="prod-categoria">
                            <option value="">-- Todas las Categorías --</option>
                            ${CATEGORIAS_NORIT.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div>
                    <label>Descripción Comercial</label>
                    <input type="text" id="prod-desc" placeholder="Especificación comercial simple...">
                </div>

                <div style="margin-top: 10px; margin-bottom: 10px;">
                    <label style="font-weight: 600; color: var(--text-light); margin-bottom: 10px;">
                        🏷️ Características Clave Destacadas (Máximo 4)
                    </label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                        <div>
                            <input type="text" class="prod-feature-input" id="feat-1" placeholder="Ej. 8 puertos downstream" style="margin-bottom:0;">
                        </div>
                        <div>
                            <input type="text" class="prod-feature-input" id="feat-2" placeholder="Ej. 1096Mb/s Capacidad" style="margin-bottom:0;">
                        </div>
                        <div>
                            <input type="text" class="prod-feature-input" id="feat-3" placeholder="Ej. Es muy bonito" style="margin-bottom:0;">
                        </div>
                        <div>
                            <input type="text" class="prod-feature-input" id="feat-4" placeholder="Ej. Soporte PoE Pasivo" style="margin-bottom:0;">
                        </div>
                    </div>

                    <div class="hashtag-stack-container hidden" id="hashtagStackBox">
                        <span style="font-size:0.8rem; font-weight:600; color:var(--text-light); display:block; margin-bottom:6px;">
                            💡 Recomendaciones de Hashtags para la Categoría seleccionada:
                        </span>
                        <div id="hashtagList"></div>
                    </div>
                </div>

                <div>
                    <label>Especificaciones Técnicas Detalladas (Hoja Técnica)</label>
                    <textarea id="prod-specs" style="height:100px; font-family:monospace;"></textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
                    <button class="btn-secondary" id="btnCancelAdminForm">Limpiar / Cancelar</button>
                    <button class="btn-success" id="btnSaveAdminForm">Guardar Registro en Norit_DB</button>
                </div>
            </div>

            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3>Auditoría Fina de Base de Datos (NORIT Lab)</h3>
                    <label style="display:flex; align-items:center; cursor:pointer; margin-bottom:0; color:var(--text-light); font-weight:600;">
                        <input type="checkbox" id="chkOnlyIncompletes" style="width:auto; margin-right:8px; margin-bottom:0;">
                        ⚠️ Mostrar únicamente registros sin modelo asignado
                    </label>
                </div>
                <div id="admin-list-container" class="scroll-list"></div>
            </div>
        </div>
    `;

    const updateHashtagStack = async () => {
        const selectedCat = container.querySelector('#prod-categoria').value;
        const stackBox = container.querySelector('#hashtagStackBox');
        const hashtagList = container.querySelector('#hashtagList');

        if (!selectedCat) {
            stackBox.classList.add('hidden');
            return;
        }

        const res = await fetch(`/api/productos?categoria=${selectedCat}`);
        const products = await res.json();

        const uniqueFeatures = new Set();
        products.forEach(p => {
            if (p.caracteristicas && Array.isArray(p.caracteristicas)) {
                p.caracteristicas.forEach(f => {
                    if (f && f.trim() !== '') uniqueFeatures.add(f.trim());
                });
            }
        });

        if (uniqueFeatures.size === 0) {
            stackBox.classList.add('hidden');
            return;
        }

        stackBox.classList.remove('hidden');
        hashtagList.innerHTML = '';

        uniqueFeatures.forEach(feature => {
            const pill = document.createElement('span');
            pill.className = 'hashtag-pill';
            pill.innerText = `# ${feature}`;
            
            pill.addEventListener('click', () => {
                const inputs = [
                    container.querySelector('#feat-1'),
                    container.querySelector('#feat-2'),
                    container.querySelector('#feat-3'),
                    container.querySelector('#feat-4')
                ];
                const emptyInput = inputs.find(inp => inp.value.trim() === '');
                if (emptyInput) {
                    emptyInput.value = feature;
                } else {
                    showNotification("Se alcanzó el límite de 4 características.", "warning");
                }
            });
            hashtagList.appendChild(pill);
        });
    };

    const renderAdminList = async () => {
        const onlyIncompletes = container.querySelector('#chkOnlyIncompletes').checked;
        const filterMarca = container.querySelector('#prod-marca').value;
        const filterCategoria = container.querySelector('#prod-categoria').value;
        
        const q = new URLSearchParams();
        if (onlyIncompletes) q.append('onlyMissing', 'true');
        if (filterMarca) q.append('marca', filterMarca);
        if (filterCategoria) q.append('categoria', filterCategoria);

        const res = await fetch(`/api/productos?${q.toString()}`);
        const products = await res.json();

        const list = container.querySelector('#admin-list-container');
        list.innerHTML = '';

        products.forEach(p => {
            const row = document.createElement('div');
            row.className = 'list-item';
            const tieneModeloValido = p.modelo && !p.modelo.toLowerCase().includes('indeterminado');

            row.innerHTML = `
                <div class="item-details">
                    <span class="badge-tag" style="background:var(--srgb-accent);">${p.categoria}</span>
                    <h4><strong>${p.marca}</strong> - <span style="${!tieneModeloValido ? 'color:var(--danger); font-style:italic;' : ''}">${p.modelo || 'FALTA ASIGNAR MODELO'}</span></h4>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:3px;">${p.descripcion_basica}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-warning btn-edit" style="padding: 5px 12px; font-size:0.85rem;">Editar</button>
                    <button class="btn-danger btn-del" style="padding: 5px 12px; font-size:0.85rem;">Borrar</button>
                </div>
            `;

            row.querySelector('.btn-edit').addEventListener('click', () => {
                container.querySelector('#prod-id').value = p.id;
                container.querySelector('#prod-marca').value = p.marca;
                container.querySelector('#prod-modelo').value = tieneModeloValido ? p.modelo : '';
                container.querySelector('#prod-categoria').value = p.categoria;
                container.querySelector('#prod-desc').value = p.descripcion_basica || '';
                container.querySelector('#prod-specs').value = p.technical_specs || '';
                
                const currentFeats = p.caracteristicas || [];
                container.querySelector('#feat-1').value = currentFeats[0] || '';
                container.querySelector('#feat-2').value = currentFeats[1] || '';
                container.querySelector('#feat-3').value = currentFeats[2] || '';
                container.querySelector('#feat-4').value = currentFeats[3] || '';

                updateHashtagStack();
                container.querySelector('#adminFormTitle').scrollIntoView({ behavior: 'smooth' });
            });

            row.querySelector('.btn-del').addEventListener('click', async () => {
                if (confirm("¿Eliminar de la base de datos?")) {
                    const deleteRes = await fetch(`/api/admin/productos/${p.id}`, { method: 'DELETE' });
                    if (deleteRes.ok) {
                        showNotification("Registro removido.", "success");
                        renderAdminList();
                    }
                }
            });

            list.appendChild(row);
        });
    };

    container.querySelector('#prod-marca').addEventListener('change', renderAdminList);
    container.querySelector('#prod-categoria').addEventListener('change', () => {
        updateHashtagStack();
        renderAdminList();
    });

    container.querySelector('#btnSaveAdminForm').addEventListener('click', async () => {
        const id = container.querySelector('#prod-id').value;
        const marca = container.querySelector('#prod-marca').value;
        const modelo = container.querySelector('#prod-modelo').value;
        const categoria = container.querySelector('#prod-categoria').value;
        const descripcion = container.querySelector('#prod-desc').value;
        const specs = container.querySelector('#prod-specs').value;

        const f1 = container.querySelector('#feat-1').value.trim();
        const f2 = container.querySelector('#feat-2').value.trim();
        const f3 = container.querySelector('#feat-3').value.trim();
        const f4 = container.querySelector('#feat-4').value.trim();
        const caracteristicas = [f1, f2, f3, f4].filter(f => f);

        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/productos/${id}` : '/api/admin/productos';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ marca, modelo, categoria, descripcion_basica: descripcion, technical_specs: specs, caracteristicas })
        });

        if (res.ok) {
            showNotification("Registro modificado.", "success");
            limpiarFormulario();
        }
    });

    const limpiarFormulario = () => {
        container.querySelector('#prod-id').value = '';
        container.querySelector('#prod-marca').value = '';
        container.querySelector('#prod-categoria').value = '';
        container.querySelector('#prod-modelo').value = '';
        container.querySelector('#prod-desc').value = '';
        container.querySelector('#prod-specs').value = '';
        container.querySelector('#feat-1').value = '';
        container.querySelector('#feat-2').value = '';
        container.querySelector('#feat-3').value = '';
        container.querySelector('#feat-4').value = '';
        renderAdminList();
    };

    container.querySelector('#btnCancelAdminForm').addEventListener('click', limpiarFormulario);
    container.querySelector('#chkOnlyIncompletes').addEventListener('change', renderAdminList);

    renderAdminList();
    return container;
}
