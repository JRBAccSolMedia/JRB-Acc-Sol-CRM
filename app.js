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
    console.log('enterApplication called');
    console.log('currentUser:', currentUser);
    
    document.getElementById('welcomePage').classList.add('hidden');
    document.getElementById('mainApp').classList.add('active');
    
    // Check if user is logged in
    if (!currentUser) {
        console.log('Showing login modal');
        showLoginModal();
    } else {
        console.log('Initializing app');
        initializeApp();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDefaultUser();
    
    // Show welcome page by default
    document.getElementById('welcomePage').classList.remove('hidden');
    document.getElementById('mainApp').classList.remove('active');
    
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('userMenuBtn').addEventListener('click', toggleUserDropdown);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('manageUsersBtn').addEventListener('click', () => switchTab('users'));
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('#userMenu')) {
            document.getElementById('userDropdown').classList.add('hidden');
        }
    });
}

// Authentication Functions
function showLoginModal() {
    console.log('showLoginModal called');
    const modal = document.getElementById('loginModal');
    console.log('Modal element:', modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('Modal classes after adding active:', modal.className);
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
    if (!checkPermission('create', 'create tasks')) return;
    showNotification('Task management features coming soon!', 'info');
}

function displayTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="text-center py-12"><p class="text-gray-500">No tasks found. Add your first task to get started.</p></div>';
        return;
    }
    
    tasksList.innerHTML = tasks.map(task => {
        const priorityColor = getPriorityColor(task.priority);
        const statusColor = getStatusColor(task.status);
        
        return `
            <div class="task-card bg-white rounded-lg shadow p-6">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg mb-2">${task.title}</h3>
                        ${task.description ? `<p class="text-gray-600 mb-3">${task.description}</p>` : ''}
                        
                        <div class="flex flex-wrap items-center gap-2 mb-3">
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${priorityColor}">${task.priority}</span>
                            <span class="inline-block px-2 py-1 text-xs rounded-full ${statusColor}">${task.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// User Management Functions
function openUserModal() {
    if (!checkPermission('manage_users', 'manage users')) return;
    showNotification('User management features coming soon!', 'info');
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
            </div>
        `;
    }).join('');
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
