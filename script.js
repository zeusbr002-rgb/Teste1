// SIMULAÇÃO DE BANCO DE DADOS (LOCALSTORAGE)
const DB = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    set: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    init: () => {
        if (!localStorage.getItem('os_data')) DB.set('os_data', []);
        if (!localStorage.getItem('avisos_data')) DB.set('avisos_data', []);
        if (!localStorage.getItem('cronograma_file')) localStorage.setItem('cronograma_file', '');
    }
};

let currentUser = null;

// INICIALIZAÇÃO
window.onload = () => {
    DB.init();
    checkSession();
};

function checkSession() {
    // Se estivesse usando sessão real, verificaria aqui.
}

// LÓGICA DE LOGIN
function login() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    // Login Simples Hardcoded
    if (userIn === 'admin' && passIn === 'admin') {
        startSession({ name: 'Administrador', role: 'admin' });
    } else if (userIn === 'user' && passIn === '1234') {
        startSession({ name: 'Encarregado', role: 'user' });
    } else {
        errorMsg.textContent = "Usuário ou senha incorretos.";
    }
}

function startSession(user) {
    currentUser = user;
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    
    // Atualiza info do usuário
    document.getElementById('display-user').textContent = user.name;
    document.getElementById('display-role').textContent = user.role === 'admin' ? 'Administrador' : 'Colaborador';

    // Controle de Permissões Visuais
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.display = user.role === 'admin' ? 'inline-block' : 'none';
    });

    loadDashboard();
}

function logout() {
    location.reload(); // Recarrega a página para "sair"
}

// NAVEGAÇÃO
function showSection(sectionId) {
    // Esconde todas
    document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    
    // Mostra a selecionada
    document.getElementById(`sec-${sectionId}`).classList.remove('hidden');
    
    // Atualiza menu
    // (Lógica simples para destacar o item clicado, pode ser melhorada pegando o event.target)
    
    if (sectionId === 'os') renderOSTable();
    if (sectionId === 'avisos') renderAvisos();
    if (sectionId === 'cronograma') renderCronograma();
    if (sectionId === 'home') loadDashboard();
}

// DASHBOARD
function loadDashboard() {
    const osList = DB.get('os_data');
    const avisosList = DB.get('avisos_data');

    const pending = osList.filter(os => os.status === 'Pendente').length;
    const done = osList.filter(os => os.status === 'Concluído').length;

    document.getElementById('count-pending').textContent = pending;
    document.getElementById('count-done').textContent = done;
    document.getElementById('count-notices').textContent = avisosList.length;
}

// MÓDULO DE OS
function renderOSTable() {
    const tbody = document.getElementById('table-os-body');
    tbody.innerHTML = '';
    const list = DB.get('os_data');

    list.forEach((os, index) => {
        const tr = document.createElement('tr');
        
        // Ação depende do nível de acesso
        let actionBtn = '';
        if (currentUser.role === 'admin') {
            actionBtn = `<button class="btn-primary" style="background:red; padding: 5px 10px;" onclick="deleteOS(${index})">X</button>`;
        } else if (os.status === 'Pendente') {
            actionBtn = `<button class="btn-primary" style="padding: 5px 10px;" onclick="triggerPhotoUpload(${index})">Finalizar (Foto)</button>`;
        } else {
            actionBtn = `<small>Concluído</small>`;
        }

        const statusClass = os.status === 'Pendente' ? 'status-pendente' : 'status-concluido';

        tr.innerHTML = `
            <td>#${index + 1}</td>
            <td>${os.title}</td>
            <td>${os.desc}</td>
            <td class="${statusClass}">${os.status}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Admin cria OS
function saveOS() {
    const title = document.getElementById('os-title').value;
    const desc = document.getElementById('os-desc').value;
    
    if (title && desc) {
        const list = DB.get('os_data');
        list.push({ title, desc, status: 'Pendente', photo: null });
        DB.set('os_data', list);
        closeModal('modal-os');
        renderOSTable();
        // Limpar campos
        document.getElementById('os-title').value = '';
        document.getElementById('os-desc').value = '';
    }
}

function deleteOS(index) {
    if(confirm('Tem certeza que deseja excluir esta OS?')) {
        const list = DB.get('os_data');
        list.splice(index, 1);
        DB.set('os_data', list);
        renderOSTable();
    }
}

// User finaliza OS com "Foto"
function triggerPhotoUpload(index) {
    // Simula o input de arquivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            completeOS(index, file.name);
        }
    };
    input.click();
}

function completeOS(index, fileName) {
    const list = DB.get('os_data');
    list[index].status = 'Concluído';
    list[index].photo = fileName; // Em sistema real, faria upload pro servidor
    DB.set('os_data', list);
    renderOSTable();
    alert(`OS Finalizada! Foto "${fileName}" anexada.`);
}

// MÓDULO DE CRONOGRAMA
function uploadCronograma() {
    const fileInput = document.getElementById('cronograma-upload');
    if (fileInput.files.length > 0) {
        const fileName = fileInput.files[0].name;
        localStorage.setItem('cronograma_file', fileName);
        renderCronograma();
        alert('Cronograma atualizado!');
    } else {
        alert('Selecione um arquivo PDF.');
    }
}

function renderCronograma() {
    const fileName = localStorage.getItem('cronograma_file');
    const view = document.getElementById('cronograma-view');
    
    if (fileName) {
        view.innerHTML = `
            <div style="text-align:center">
                <i class="material-icons" style="font-size: 50px; color: red;">picture_as_pdf</i>
                <p>Arquivo Atual: <strong>${fileName}</strong></p>
                <small>(Em um servidor real, o PDF seria exibido aqui)</small>
            </div>
        `;
    } else {
        view.innerHTML = `<p>Nenhum cronograma disponível.</p>`;
    }
}

// MÓDULO DE AVISOS
function renderAvisos() {
    const list = DB.get('avisos_data');
    const container = document.getElementById('avisos-list');
    container.innerHTML = '';
    
    list.forEach(aviso => {
        const div = document.createElement('div');
        div.className = 'aviso-card';
        div.innerHTML = `
            <h4>${aviso.title}</h4>
            <p>${aviso.msg}</p>
            <span class="aviso-date">${aviso.date}</span>
        `;
        container.appendChild(div);
    });
}

function saveAviso() {
    const title = document.getElementById('aviso-title').value;
    const msg = document.getElementById('aviso-desc').value;
    
    if (title && msg) {
        const list = DB.get('avisos_data');
        const today = new Date().toLocaleDateString('pt-BR');
        list.push({ title, msg, date: today });
        DB.set('avisos_data', list);
        closeModal('modal-aviso');
        renderAvisos();
        
        document.getElementById('aviso-title').value = '';
        document.getElementById('aviso-desc').value = '';
    }
}