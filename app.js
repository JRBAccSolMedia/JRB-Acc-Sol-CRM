// Data Storage
let clients = JSON.parse(localStorage.getItem('clients')) || [];
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let currentTab = 'dashboard';

// User Roles and Permissions
const ROLES = {
    admin: {
        name: 'Admin',
        permissions: ['view', 'create', 'edit', 'delete', 'manage_users'],
        description: 'Full access to all features including user management'
    },
    editor: {
        name: 'Editor',
        permissions: ['view', 'create', 'edit'],
        description: 'Can view, create, and edit clients and tasks'
    },
    viewer: {
        name: 'Viewer',
        permissions: ['view'],
        description: 'Read-only access to clients and tasks'
    }
};

// Initialize default admin user if no users exist
function initializeDefaultUser() {
    if (users.length === 0) {
        const defaultAdmin = {
            id: generateId(),
            username: 'admin',
            email: 'admin@jrbaccounting.co.za',
            fullName: 'System Administrator',
            role: 'admin',
            password: btoa('admin123'),
            createdDate: new Date().toISOString(),
            isActive: true
        };
        users.push(defaultAdmin);
        saveUsers();
    }
}

// Welcome Page Function
function enterApplication() {
    document.getElementById('welcomePage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('active');
    
    // Check if user is logged in
    if (!currentUser) {
        showLoginModal();
    } else {
        initializeApp();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultUser();
    
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
    }
    
    // Show welcome page by default
    document.getElementById('welcomePage').classList.remove('hidden');
    document.getElementById('mainApp').classList.remove('active');
    
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);
    document.getElementById('userMenuBtn').addEventListener('click', toggleUserDropdown);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('manageUsersBtn').addEventListener('click', () => switchTab('users'));
    document.getElementById('userRole').addEventListener('change', updateRolePermissions);
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#userMenu')) {
            document.getElementById('userDropdown').classList.add('hidden');
        }
    });
}

// Authentication Functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    const user = users.find(u => u.username === username && u.isActive);
    
    if (!user || atob(user.password) !== password) {
        showNotification('Invalid username or password', 'error');
        return;
    }
    
    currentUser = {
        ...user,
        lastLogin: new Date().toISOString()
    };
    
    if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    hideLoginModal();
    initializeApp();
    showNotification(`Welcome back, ${user.fullName}!`, 'success');
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    
    document.getElementById('userMenu').classList.add('hidden');
    document.getElementById('usersTabBtn').classList.add('hidden');
    
    // Show welcome page again
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('welcomePage').classList.remove('hidden');
    
    showNotification('Logged out successfully', 'success');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('hidden');
}

// Permission System
function hasPermission(permission) {
    if (!currentUser) return false;
    const userRole = ROLES[currentUser.role];
    return userRole && userRole.permissions.includes(permission);
}

function checkPermission(permission, action = 'perform this action') {
    if (!hasPermission(permission)) {
        showNotification(`You don't have permission to ${action}`, 'error');
        return false;
    }
    return true;
}

// Initialize App
function initializeApp() {
    updateUserInterface();
    switchTab('dashboard');
    loadClients();
    loadTasks();
    updateDashboard();
}

function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('userMenu').classList.remove('hidden');
    
    const roleInfo = ROLES[currentUser.role];
    document.getElementById('currentUser').textContent = `${currentUser.fullName} (${roleInfo ? roleInfo.name : currentUser.role})`;
    document.getElementById('userInfo').innerHTML = `
        <div class="font-medium">${currentUser.fullName}</div>
        <div class="text-xs text-gray-500">@${currentUser.username} • ${roleInfo ? roleInfo.name : currentUser.role}</div>
    `;
    
    if (hasPermission('manage_users')) {
        document.getElementById('usersTabBtn').classList.remove('hidden');
        document.getElementById('manageUsersBtn').classList.remove('hidden');
    } else {
        document.getElementById('usersTabBtn').classList.add('hidden');
        document.getElementById('manageUsersBtn').classList.add('hidden');
    }
}

// Tab Management
function switchTab(tabName) {
    if (tabName === 'users' && !hasPermission('manage_users')) {
        showNotification('You don\'t have permission to access user management', 'error');
        return;
    }
    
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-blue-600', 'border-blue-600');
        btn.classList.add('text-gray-700', 'border-transparent');
    });
    
    document.getElementById(tabName).classList.add('active');
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-700', 'border-transparent');
        activeBtn.classList.add('text-blue-600', 'border-blue-600');
    }
    
    currentTab = tabName;
    
    if (tabName === 'clients') {
        displayClients();
    } else if (tabName === 'tasks') {
        displayTasks();
    } else if (tabName === 'users') {
        displayUsers();
    } else if (tabName === 'dashboard') {
        updateDashboard();
    }
}

// Dashboard Functions
function updateDashboard() {
    const totalClients = clients.length;
    let activeTasks = tasks.filter(task => task.status !== 'completed');
    const recurringTasks = tasks.filter(task => task.type === 'recurring');
    
    if (currentUser && !hasPermission('manage_users')) {
        activeTasks = activeTasks.filter(task => task.assignedUserId === currentUser.id || !task.assignedUserId);
    }
    
    const activeTasksCount = activeTasks.length;
    
    document.getElementById('totalClients').textContent = `${totalClients} Clients`;
    document.getElementById('totalTasks').textContent = `${activeTasksCount} Active Tasks`;
    
    document.getElementById('statsTotalClients').textContent = totalClients;
    document.getElementById('statsActiveTasks').textContent = activeTasksCount;
    document.getElementById('statsRecurringTasks').textContent = recurringTasks.length;
    
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    document.getElementById('statsCompletionRate').textContent = `${completionRate}%`;
    
    updateRecentClients();
    updateUpcomingTasks();
}

function updateRecentClients() {
    const recentClientsDiv = document.getElementById('recentClients');
    const recentClients = clients.slice(-5).reverse();
    
    if (recentClients.length === 0) {
        recentClientsDiv.innerHTML = '<p class="text-gray-500">No clients added yet</p>';
        return;
    }
    
    recentClientsDiv.innerHTML = recentClients.map(client => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="viewClientDetails('${client.id}')">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600"></i>
                </div>
                <div>
                    <p class="font-medium">${client.name}</p>
                    <p class="text-sm text-gray-500">${client.type === 'business' ? 'Company' : client.type.charAt(0).toUpperCase() + client.type.slice(1)}</p>
                </div>
            </div>
            <span class="text-xs text-gray-400">${formatDate(client.dateAdded)}</span>
        </div>
    `).join('');
}

function updateUpcomingTasks() {
    const upcomingTasksDiv = document.getElementById('upcomingTasks');
    const today = new Date();
    
    let userTasks = tasks;
    if (currentUser && !hasPermission('manage_users')) {
        userTasks = tasks.filter(task => task.assignedUserId === currentUser.id || !task.assignedUserId);
    }
    
    const upcomingTasks = userTasks
        .filter(task => task.status !== 'completed' && task.dueDate)
        .filter(task => new Date(task.dueDate) >= today)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
    
    if (upcomingTasks.length === 0) {
        upcomingTasksDiv.innerHTML = '<p class="text-gray-500">No upcoming tasks with deadlines.</p>';
        return;
    }
    
    upcomingTasksDiv.innerHTML = upcomingTasks.map(task => {
        const assignedUser = task.assignedUserId ? users.find(u => u.id === task.assignedUserId) : null;
        const daysUntil = Math.ceil((new Date(task.dueDate) - today) / (1000 * 60 * 60 * 24));
        const urgencyColor = daysUntil <= 3 ? 'text-red-600' : daysUntil <= 7 ? 'text-yellow-600' : 'text-gray-600';
        
        return `
            <div class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onclick="viewTaskDetails('${task.id}')">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="font-medium text-sm">${task.title}</p>
                        <div class="flex items-center space-x-2 mt-1">
                            ${assignedUser ? `<span class="text-xs text-gray-500">${assignedUser.fullName}</span>` : ''}
                            <span class="text-xs ${urgencyColor}">
                                ${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                            </span>
                        </div>
                    </div>
                    <span class="inline-block px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}">${task.priority}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Client Management Functions
function openClientModal() {
    if (!checkPermission('create', 'create clients')) return;
    showNotification('Client management features coming soon!', 'info');
}

function displayClients() {
    const clientsGrid = document.getElementById('clientsGrid');
    
    if (clients.length === 0) {
        clientsGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">No clients found. Add your first client to get started.</p></div>';
        return;
    }
    
    clientsGrid.innerHTML = clients.map(client => {
        const typeIcon = getClientTypeIcon(client.type);
        const typeColor = getClientTypeColor(client.type);
        
        return `
            <div class="client-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 ${typeColor} rounded-full flex items-center justify-center">
                        <i class="fas ${typeIcon} text-white"></i>
                    </div>
                </div>
                
                <h3 class="font-semibold text-lg mb-2">${client.name}</h3>
                <p class="text-sm text-gray-500 mb-4">${client.type === 'business' ? 'Company' : client.type.charAt(0).toUpperCase() + client.type.slice(1)}</p>
                
                <div class="space-y-2 text-sm">
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-envelope w-4 mr-2"></i>
                        <span class="truncate">${client.email}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-phone w-4 mr-2"></i>
                        <span>${client.phone}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Task Management Functions
function openTaskModal() {
    console.log('openTaskModal called');
    if (!checkPermission('create', 'create tasks')) return;
    
    console.log('Permission granted, opening modal');
    document.getElementById('taskModal').classList.add('active');
    document.getElementById('taskForm').reset();
    toggleRecurringFields();
    updateTaskClientOptions();
    updateTaskUserOptions();
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function toggleRecurringFields() {
    const taskType = document.getElementById('taskType').value;
    const recurringFields = document.getElementById('recurringFields');
    
    console.log('toggleRecurringFields called, taskType:', taskType);
    
    if (taskType === 'recurring') {
        recurringFields.classList.remove('hidden');
    } else {
        recurringFields.classList.add('hidden');
    }
}

function updateTaskClientOptions() {
    const select = document.getElementById('taskClient');
    console.log('updateTaskClientOptions called, clients:', clients);
    
    select.innerHTML = '<option value="">No Client</option>' +
        clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');
}

function updateTaskUserOptions() {
    const select = document.getElementById('taskAssignedUser');
    const activeUsers = users.filter(user => user.isActive);
    
    console.log('updateTaskUserOptions called, activeUsers:', activeUsers);
    
    select.innerHTML = '<option value="">Unassigned</option>' +
        activeUsers.map(user => `<option value="${user.id}">${user.fullName}</option>`).join('');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    console.log('handleTaskSubmit called');
    
    const task = {
        id: generateId(),
        title: document.getElementById('taskTitle').value,
        type: document.getElementById('taskType').value,
        priority: document.getElementById('taskPriority').value,
        clientId: document.getElementById('taskClient').value || null,
        assignedUserId: document.getElementById('taskAssignedUser').value || null,
        dueDate: document.getElementById('taskDueDate').value,
        description: document.getElementById('taskDescription').value,
        status: 'pending',
        createdDate: new Date().toISOString(),
        createdBy: currentUser.id,
        ...(document.getElementById('taskType').value === 'recurring' && {
            recurringFrequency: document.getElementById('recurringFrequency').value,
            recurringEndDate: document.getElementById('recurringEndDate').value,
            recurringDays: Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => cb.value)
        })
    };
    
    console.log('Task data:', task);
    
    tasks.push(task);
    saveTasks();
    
    closeTaskModal();
    displayTasks();
    updateDashboard();
    
    showNotification('Task added successfully!', 'success');
}

function displayTasks() {
    const tasksList = document.getElementById('tasksList');
    const canEdit = hasPermission('edit');
    const canDelete = hasPermission('delete');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">No tasks found. Add your first task to get started.</p></div>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => {
        const client = clients.find(c => c.id === task.clientId);
        const assignedUser = task.assignedUserId ? users.find(u => u.id === task.assignedUserId) : null;
        const priorityColor = getPriorityColor(task.priority);
        const statusColor = getStatusColor(task.status);
        const typeIcon = task.type === 'recurring' ? 'fa-sync-alt' : 'fa-clock';
        
        return `
            <div class="task-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-semibold text-lg">${task.title}</h3>
                            <i class="fas ${typeIcon} text-gray-400" title="${task.type}"></i>
                        </div>
                        
                        ${task.description ? `<p class="text-gray-600 mb-3">${task.description}</p>` : ''}
                        
                        <div class="flex flex-wrap items-center gap-2 mb-3">
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${priorityColor}">${task.priority}</span>
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${statusColor}">${task.status}</span>
                            ${client ? `<span class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">${client.name}</span>` : ''}
                            ${assignedUser ? `<span class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                <i class="fas fa-user mr-1"></i>${assignedUser.fullName}
                            </span>` : '<span class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">Unassigned</span>'}
                        </div>
                        
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            ${task.dueDate ? `<span><i class="fas fa-calendar mr-1"></i>Due: ${formatDate(task.dueDate)}</span>` : ''}
                            <span><i class="fas fa-plus-circle mr-1"></i>Created: ${formatDate(task.createdDate)}</span>
                            ${task.type === 'recurring' ? `<span><i class="fas fa-redo mr-1"></i>${task.recurringFrequency}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex flex-col space-x-2 ml-4">
                        ${task.status !== 'completed' && canEdit ? `
                            <button onclick="updateTaskStatus('${task.id}', 'in-progress')" class="text-blue-600 hover:text-blue-800 mb-2" title="Mark in progress">
                                <i class="fas fa-play"></i>
                            </button>
                            <button onclick="updateTaskStatus('${task.id}', 'completed')" class="text-green-600 hover:text-green-800 mb-2" title="Mark complete">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : task.status === 'completed' && canEdit ? `
                            <button onclick="updateTaskStatus('${task.id}', 'pending')" class="text-gray-600 hover:text-gray-800 mb-2" title="Reopen task">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                        ${canEdit ? `<button onclick="editTask('${task.id}')" class="text-blue-600 hover:text-blue-800 mb-2" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>` : ''}
                        ${canDelete ? `<button onclick="deleteTask('${task.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTaskStatus(taskId, newStatus) {
    if (!checkPermission('edit', 'update task status')) return;
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    tasks[taskIndex].status = newStatus;
    
    if (newStatus === 'completed') {
        tasks[taskIndex].completedDate = new Date().toISOString();
    } else {
        delete tasks[taskIndex].completedDate;
    }
    
    saveTasks();
    displayTasks();
    updateDashboard();
    
    showNotification(`Task marked as ${newStatus}!`, 'success');
}

function editTask(taskId) {
    if (!checkPermission('edit', 'edit tasks')) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskType').value = task.type;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskClient').value = task.clientId || '';
    document.getElementById('taskAssignedUser').value = task.assignedUserId || '';
    document.getElementById('taskDueDate').value = task.dueDate || '';
    document.getElementById('taskDescription').value = task.description || '';
    
    if (task.type === 'recurring') {
        document.getElementById('recurringFrequency').value = task.recurringFrequency || 'weekly';
        document.getElementById('recurringEndDate').value = task.recurringEndDate || '';
        
        document.querySelectorAll('.day-checkbox').forEach(checkbox => {
            checkbox.checked = task.recurringDays && task.recurringDays.includes(checkbox.value);
        });
    }
    
    toggleRecurringFields();
    updateTaskClientOptions();
    updateTaskUserOptions();
    
    const form = document.getElementById('taskForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        updateTask(taskId);
    };
    
    form.querySelector('button[type="submit"]').textContent = 'Update Task';
    
    openTaskModal();
}

function updateTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title: document.getElementById('taskTitle').value,
        type: document.getElementById('taskType').value,
        priority: document.getElementById('taskPriority').value,
        clientId: document.getElementById('taskClient').value || null,
        assignedUserId: document.getElementById('taskAssignedUser').value || null,
        dueDate: document.getElementById('taskDueDate').value,
        description: document.getElementById('taskDescription').value,
        ...(document.getElementById('taskType').value === 'recurring' && {
            recurringFrequency: document.getElementById('recurringFrequency').value,
            recurringEndDate: document.getElementById('recurringEndDate').value,
            recurringDays: Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => cb.value)
        })
    };
    
    saveTasks();
    closeTaskModal();
    displayTasks();
    updateDashboard();
    
    const form = document.getElementById('taskForm');
    form.onsubmit = handleTaskSubmit;
    form.querySelector('button[type="submit"]').textContent = 'Add Task';
    
    showNotification('Task updated successfully!', 'success');
}

function deleteTask(taskId) {
    if (!checkPermission('delete', 'delete tasks')) return;
    
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }
    
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    displayTasks();
    updateDashboard();
    
    showNotification('Task deleted successfully!', 'success');
}

function searchTasks() {
    const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
    );
    
    displayFilteredTasks(filteredTasks);
}

function filterTasks() {
    const statusFilter = document.getElementById('taskStatusFilter').value;
    const typeFilter = document.getElementById('taskTypeFilter').value;
    const priorityFilter = document.getElementById('taskPriorityFilter').value;
    const userFilter = document.getElementById('taskUserFilter').value;
    const searchTerm = document.getElementById('taskSearch').value.toLowerCase();
    
    let filteredTasks = tasks;
    
    if (statusFilter) {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    
    if (typeFilter) {
        filteredTasks = filteredTasks.filter(task => task.type === typeFilter);
    }
    
    if (priorityFilter) {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }
    
    if (userFilter) {
        if (userFilter === 'unassigned') {
            filteredTasks = filteredTasks.filter(task => !task.assignedUserId);
        } else if (userFilter === 'my-tasks') {
            filteredTasks = filteredTasks.filter(task => task.assignedUserId === currentUser.id);
        } else {
            filteredTasks = filteredTasks.filter(task => task.assignedUserId === userFilter);
        }
    }
    
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }
    
    displayFilteredTasks(filteredTasks);
}

function displayFilteredTasks(filteredTasks) {
    const tasksList = document.getElementById('tasksList');
    const canEdit = hasPermission('edit');
    const canDelete = hasPermission('delete');
    
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">No tasks found matching your criteria.</p></div>';
        return;
    }
    
    tasksList.innerHTML = filteredTasks.map(task => {
        const client = clients.find(c => c.id === task.clientId);
        const assignedUser = task.assignedUserId ? users.find(u => u.id === task.assignedUserId) : null;
        const priorityColor = getPriorityColor(task.priority);
        const statusColor = getStatusColor(task.status);
        const typeIcon = task.type === 'recurring' ? 'fa-sync-alt' : 'fa-clock';
        
        return `
            <div class="task-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-semibold text-lg">${task.title}</h3>
                            <i class="fas ${typeIcon} text-gray-400" title="${task.type}"></i>
                        </div>
                        
                        ${task.description ? `<p class="text-gray-600 mb-3">${task.description}</p>` : ''}
                        
                        <div class="flex flex-wrap items-center gap-2 mb-3">
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${priorityColor}">${task.priority}</span>
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${statusColor}">${task.status}</span>
                            ${client ? `<span class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">${client.name}</span>` : ''}
                            ${assignedUser ? `<span class="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                <i class="fas fa-user mr-1"></i>${assignedUser.fullName}
                            </span>` : '<span class="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">Unassigned</span>'}
                        </div>
                        
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            ${task.dueDate ? `<span><i class="fas fa-calendar mr-1"></i>Due: ${formatDate(task.dueDate)}</span>` : ''}
                            <span><i class="fas fa-plus-circle mr-1"></i>Created: ${formatDate(task.createdDate)}</span>
                            ${task.type === 'recurring' ? `<span><i class="fas fa-redo mr-1"></i>${task.recurringFrequency}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex flex-col space-x-2 ml-4">
                        ${task.status !== 'completed' && canEdit ? `
                            <button onclick="updateTaskStatus('${task.id}', 'in-progress')" class="text-blue-600 hover:text-blue-800 mb-2" title="Mark in progress">
                                <i class="fas fa-play"></i>
                            </button>
                            <button onclick="updateTaskStatus('${task.id}', 'completed')" class="text-green-600 hover:text-green-800 mb-2" title="Mark complete">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : task.status === 'completed' && canEdit ? `
                            <button onclick="updateTaskStatus('${task.id}', 'pending')" class="text-gray-600 hover:text-gray-800 mb-2" title="Reopen task">
                                <i class="fas fa-undo"></i>
                            </button>
                        ` : ''}
                        ${canEdit ? `<button onclick="editTask('${task.id}')" class="text-blue-600 hover:text-blue-800 mb-2" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>` : ''}
                        ${canDelete ? `<button onclick="deleteTask('${task.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// User Management Functions
function openUserModal() {
    if (!checkPermission('manage_users', 'manage users')) return;
    
    document.getElementById('userModal').classList.add('active');
    document.getElementById('userForm').reset();
    updateRolePermissions();
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function updateRolePermissions() {
    const role = document.getElementById('userRole').value;
    const permissionsDiv = document.getElementById('rolePermissions');
    
    if (!role || !ROLES[role]) {
        permissionsDiv.innerHTML = '<p>Select a role to view permissions</p>';
        return;
    }
    
    const roleInfo = ROLES[role];
    permissionsDiv.innerHTML = `
        <div class="space-y-2">
            <p><strong>${roleInfo.name}</strong></p>
            <p class="text-gray-600">${roleInfo.description}</p>
            <div class="mt-2">
                <strong>Permissions:</strong>
                <ul class="list-disc list-inside mt-1">
                    ${roleInfo.permissions.map(perm => `<li>${perm.charAt(0).toUpperCase() + perm.slice(1).replace('_', ' ')}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function handleUserSubmit(e) {
    e.preventDefault();
    
    if (!checkPermission('manage_users', 'manage users')) return;
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('userEmail').value;
    const fullName = document.getElementById('fullName').value;
    const role = document.getElementById('userRole').value;
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (users.some(u => u.username === username)) {
        showNotification('Username already exists', 'error');
        return;
    }
    
    const newUser = {
        id: generateId(),
        username,
        email,
        fullName,
        role,
        password: btoa(password),
        createdDate: new Date().toISOString(),
        isActive: true,
        createdBy: currentUser.id
    };
    
    users.push(newUser);
    saveUsers();
    
    closeUserModal();
    displayUsers();
    showNotification('User created successfully!', 'success');
}

function displayUsers() {
    const usersGrid = document.getElementById('usersGrid');
    
    if (users.length === 0) {
        usersGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500">No users found.</p></div>';
        return;
    }
    
    usersGrid.innerHTML = users.map(user => {
        const roleInfo = ROLES[user.role];
        const isActiveClass = user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        
        return `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-user text-blue-600"></i>
                    </div>
                    <div class="flex space-x-2">
                        ${currentUser.id !== user.id ? `
                            <button onclick="toggleUserStatus('${user.id}')" class="text-${user.isActive ? 'red' : 'green'}-600 hover:text-${user.isActive ? 'red' : 'green'}-800">
                                <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                            </button>
                            <button onclick="deleteUser('${user.id}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : '<span class="text-gray-400 text-sm">You</span>'}
                    </div>
                </div>
                
                <h3 class="font-semibold text-lg mb-2">${user.fullName}</h3>
                <p class="text-sm text-gray-500 mb-4">@${user.username}</p>
                
                <div class="space-y-2 text-sm">
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-envelope w-4 mr-2"></i>
                        <span class="truncate">${user.email}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i class="fas fa-shield-alt w-4 mr-2"></i>
                        <span>${roleInfo ? roleInfo.name : user.role}</span>
                    </div>
                    <div class="flex items-center">
                        <span class="inline-block px-2 py-1 text-xs rounded-full ${isActiveClass}">
                            ${user.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t text-xs text-gray-400">
                    <p>Created: ${formatDate(user.createdDate)}</p>
                    ${user.lastLogin ? `<p>Last login: ${formatDate(user.lastLogin)}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function toggleUserStatus(userId) {
    if (!checkPermission('manage_users', 'manage users')) return;
    
    const user = users.find(u => u.id === userId);
    if (!user || user.id === currentUser.id) {
        showNotification('You cannot deactivate your own account', 'error');
        return;
    }
    
    user.isActive = !user.isActive;
    saveUsers();
    displayUsers();
    
    showNotification(`User ${user.isActive ? 'activated' : 'deactivated'} successfully!`, 'success');
}

function deleteUser(userId) {
    if (!checkPermission('manage_users', 'manage users')) return;
    
    const user = users.find(u => u.id === userId);
    if (!user || user.id === currentUser.id) {
        showNotification('You cannot delete your own account', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.`)) {
        return;
    }
    
    users = users.filter(u => u.id !== userId);
    saveUsers();
    displayUsers();
    
    showNotification('User deleted successfully!', 'success');
}

// Placeholder functions for features not yet implemented
function searchClients() {
    showNotification('Search feature coming soon!', 'info');
}

function filterClients() {
    showNotification('Filter feature coming soon!', 'info');
}

function sortClients() {
    showNotification('Sort feature coming soon!', 'info');
}

function searchTasks() {
    showNotification('Search feature coming soon!', 'info');
}

function filterTasks() {
    showNotification('Filter feature coming soon!', 'info');
}

function viewClientDetails(clientId) {
    showNotification('Client details feature coming soon!', 'info');
}

function viewTaskDetails(taskId) {
    showNotification('Task details feature coming soon!', 'info');
}

// Utility functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getClientTypeIcon(type) {
    switch (type) {
        case 'individual': return 'fa-user';
        case 'business': return 'fa-building';
        case 'trust': return 'fa-shield-alt';
        default: return 'fa-user';
    }
}

function getClientTypeColor(type) {
    switch (type) {
        case 'individual': return 'bg-blue-500';
        case 'business': return 'bg-green-500';
        case 'trust': return 'bg-purple-500';
        default: return 'bg-gray-500';
    }
}

function getPriorityColor(priority) {
    switch (priority) {
        case 'high': return 'bg-red-100 text-red-700';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        case 'low': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'pending': return 'bg-gray-100 text-gray-700';
        case 'in-progress': return 'bg-blue-100 text-blue-700';
        case 'completed': return 'bg-green-100 text-green-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Data persistence
function saveClients() {
    localStorage.setItem('clients', JSON.stringify(clients));
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function loadClients() {
    const stored = localStorage.getItem('clients');
    if (stored) {
        clients = JSON.parse(stored);
    }
}

function loadTasks() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
        tasks = JSON.parse(stored);
    }
}
