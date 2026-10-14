document.addEventListener('DOMContentLoaded', () => {
    // Tab switching logic
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            menuItems.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked
            item.classList.add('active');
            const targetTab = item.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');

            // Load data when tab is opened
            if (targetTab === 'employees') loadEmployees();
            if (targetTab === 'formatted-data') loadFormattedData();
            if (targetTab === 'locations') loadLocations();
        });
    });
});

// Toast notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.querySelector('.toast-icon');
    
    toastMessage.textContent = message;
    
    if (isError) {
        toastIcon.className = 'fa-solid fa-circle-exclamation toast-icon';
        toastIcon.style.color = 'var(--danger)';
    } else {
        toastIcon.className = 'fa-solid fa-check-circle toast-icon';
        toastIcon.style.color = 'var(--success)';
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Sync Functions
async function syncData(type) {
    const statusDiv = document.getElementById('sync-status');
    statusDiv.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Syncing ${type} data... Please wait.`;
    
    try {
        const response = await fetch(`api/sync/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            statusDiv.innerHTML = `<span style="color: var(--success)"><i class="fa-solid fa-check"></i> ${data.message} (${data.count} records)</span>`;
            showToast(`${type} data synced successfully!`);
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        statusDiv.innerHTML = `<span style="color: var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${error.message}</span>`;
        showToast(`Failed to sync ${type} data`, true);
    }
}

// Pagination State
const paginationState = {
    employees: { data: [], page: 1, limit: 100 },
    formatted: { data: [], page: 1, limit: 100 },
    locations: { data: [], page: 1, limit: 100 }
};

function renderPagination(type, containerId) {
    const state = paginationState[type];
    const totalPages = Math.ceil(state.data.length / state.limit) || 1;
    const container = document.getElementById(containerId);
    
    if (state.data.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div style="font-size: 0.9rem; color: #aaa;">Showing ${(state.page - 1) * state.limit + 1} to ${Math.min(state.page * state.limit, state.data.length)} of ${state.data.length} entries</div>
        <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn btn-outline" ${state.page === 1 ? 'disabled' : ''} onclick="changePage('${type}', -1)" style="padding: 5px 15px; min-width: 80px;">Previous</button>
            <span style="font-size: 0.9rem; margin: 0 10px;">Page ${state.page} of ${totalPages}</span>
            <button class="btn btn-outline" ${state.page === totalPages ? 'disabled' : ''} onclick="changePage('${type}', 1)" style="padding: 5px 15px; min-width: 80px;">Next</button>
        </div>
    `;
}

function changePage(type, direction) {
    paginationState[type].page += direction;
    if (type === 'employees') renderEmployees();
    if (type === 'formatted') renderFormattedData();
    if (type === 'locations') renderLocations();
}

// --- Employees ---
async function loadEmployees() {
    const tbody = document.querySelector('#employees-table tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';
    document.getElementById('employees-pagination').innerHTML = '';
    
    try {
        const response = await fetch('api/employees');
        const data = await response.json();
        
        if (data.success) {
            paginationState.employees.data = data.data;
            paginationState.employees.page = 1;
            renderEmployees();
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--danger);">Error loading data: ${error.message}</td></tr>`;
    }
}

function renderEmployees() {
    const tbody = document.querySelector('#employees-table tbody');
    const { data, page, limit } = paginationState.employees;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No data available. Try syncing first.</td></tr>';
        return;
    }
    
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    tbody.innerHTML = paginatedData.map(emp => `
        <tr>
            <td>${emp.emp_no || '-'}</td>
            <td>${emp.name || '-'}</td>
            <td>${emp.grade || '-'}</td>
            <td>${emp.desg || '-'}</td>
            <td>${emp.email || '-'}</td>
            <td><span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${emp.source || '-'}</span></td>
        </tr>
    `).join('');
    
    renderPagination('employees', 'employees-pagination');
}

// --- Formatted Data ---
async function loadFormattedData(source = '') {
    const tbody = document.querySelector('#formatted-table tbody');
    tbody.innerHTML = `<tr><td colspan="28" style="text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Loading ${source} data...</td></tr>`;
    document.getElementById('formatted-pagination').innerHTML = '';
    
    try {
        const url = source ? `api/format-data?source=${source}` : 'api/format-data';
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            paginationState.formatted.data = data.data;
            paginationState.formatted.page = 1;
            renderFormattedData();
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="28" style="text-align:center; color: var(--danger);">Error loading data: ${error.message}</td></tr>`;
    }
}

function renderFormattedData() {
    const tbody = document.querySelector('#formatted-table tbody');
    const { data, page, limit } = paginationState.formatted;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="28" style="text-align:center">No data available. Try syncing first.</td></tr>';
        return;
    }
    
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    tbody.innerHTML = paginatedData.map(row => `
        <tr>
            <td>${row.compcode || '-'}</td>
            <td>${row.emp_no || '-'}</td>
            <td>${row.name || '-'}</td>
            <td>${row.grade || '-'}</td>
            <td>${row.desg || '-'}</td>
            <td>${row.sbu || '-'}</td>
            <td>${row.b_func || '-'}</td>
            <td>${row.j_func || '-'}</td>
            <td>${row.role || '-'}</td>
            <td>${row.industry || '-'}</td>
            <td>${row.rpt_code || '-'}</td>
            <td>${row.rpt_to || '-'}</td>
            <td>${row.sap_ter || '-'}</td>
            <td>${row.teritorry || '-'}</td>
            <td>${row.loc_code || '-'}</td>
            <td>${row.location || '-'}</td>
            <td>${row.plant || '-'}</td>
            <td>${row.plant_name || '-'}</td>
            <td>${row.dobc || '-'}</td>
            <td>${row.dojc || '-'}</td>
            <td>${row.retresdt || '-'}</td>
            <td>${row.email || '-'}</td>
            <td>${row.tphn_no1 || '-'}</td>
            <td>${row.ret_res_tg || '-'}</td>
            <td>${row.cat || '-'}</td>
            <td>${row.actual_loc || '-'}</td>
            <td>${row.aloc || '-'}</td>
            <td>${row.state || '-'}</td>
        </tr>
    `).join('');
    
    renderPagination('formatted', 'formatted-pagination');
}

// --- Locations ---
async function loadLocations() {
    const tbody = document.querySelector('#locations-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';
    document.getElementById('locations-pagination').innerHTML = '';
    
    try {
        const response = await fetch('api/locations');
        const data = await response.json();
        
        if (data.success) {
            paginationState.locations.data = data.data;
            paginationState.locations.page = 1;
            renderLocations();
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--danger);">Error loading data: ${error.message}</td></tr>`;
    }
}

function renderLocations() {
    const tbody = document.querySelector('#locations-table tbody');
    const { data, page, limit } = paginationState.locations;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No data available. Try syncing first.</td></tr>';
        return;
    }
    
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    tbody.innerHTML = paginatedData.map(loc => `
        <tr>
            <td>${loc.work_area_code || '-'}</td>
            <td>${loc.loc_code || '-'}</td>
            <td>${loc.plant || '-'}</td>
            <td>${loc.location || '-'}</td>
            <td>${loc.updated_on || '-'}</td>
        </tr>
    `).join('');
    
    renderPagination('locations', 'locations-pagination');
}

// Execute Custom Query
async function executeCustomQuery() {
    const query = document.getElementById('sql-query').value;
    const resultDisplay = document.getElementById('json-result');
    
    if (!query) {
        showToast('Please enter a SQL query', true);
        return;
    }
    
    resultDisplay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing query...';
    
    try {
        const response = await fetch('api/custom-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultDisplay.textContent = JSON.stringify(data.data, null, 4);
            showToast('Query executed successfully');
        } else {
            throw new Error(data.message || 'Error executing query');
        }
    } catch (error) {
        resultDisplay.textContent = `Error: ${error.message}`;
        showToast('Query execution failed', true);
    }
}

// Copy API URL
function copyApiUrl(source) {
    const basePath = window.location.href.split('?')[0]; 
    const url = (basePath.endsWith('/') ? basePath : basePath + '/') + 'api/format-data?source=' + source;
    navigator.clipboard.writeText(url).then(() => {
        showToast(source + ' API Endpoint copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy URL', true);
    });
}
