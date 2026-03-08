// Global State
let currentDate = new Date();
let selectedDate = new Date();
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// DOM Elements
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    currentMonth: document.getElementById('currentMonth'),
    calendarGrid: document.getElementById('calendarGrid'),
    selectedDateSpan: document.getElementById('selectedDate'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    tasksList: document.getElementById('tasksList'),
    taskModal: document.getElementById('taskModal'),
    taskForm: document.getElementById('taskForm'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    cancelBtn: document.getElementById('cancelBtn'),
    taskTitle: document.getElementById('taskTitle'),
    taskTime: document.getElementById('taskTime'),
    taskDescription: document.getElementById('taskDescription'),
    taskDueDate: document.getElementById('taskDueDate'),
    taskPriority: document.getElementById('taskPriority')
};

// Initialize App
function init() {
    loadTasksFromStorage();
    loadThemeFromStorage();
    renderCalendar();
    renderTasks();
    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Calendar navigation
    elements.prevMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    elements.nextMonth.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Task modal
    elements.addTaskBtn.addEventListener('click', openAddTaskModal);
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelBtn.addEventListener('click', closeModal);
    elements.taskModal.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) closeModal();
    });

    // Task form
    elements.taskForm.addEventListener('submit', handleTaskSubmit);

    // Task filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
}

// Theme Management
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = elements.themeToggle.querySelector('i');
    icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function loadThemeFromStorage() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const icon = elements.themeToggle.querySelector('i');
    icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Calendar Rendering
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    elements.currentMonth.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar
    elements.calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        elements.calendarGrid.appendChild(header);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayCell = createDayCell(daysInPrevMonth - i, true, year, month - 1);
        elements.calendarGrid.appendChild(dayCell);
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = createDayCell(day, false, year, month);
        elements.calendarGrid.appendChild(dayCell);
    }
    
    // Add days from next month
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayCell = createDayCell(day, true, year, month + 1);
        elements.calendarGrid.appendChild(dayCell);
    }
}

function createDayCell(day, isOtherMonth, year, month) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    
    const date = new Date(year, month, day);
    const dateString = formatDate(date);
    
    // Check if today
    const today = new Date();
    if (date.toDateString() === today.toDateString() && !isOtherMonth) {
        cell.classList.add('today');
    }
    
    // Check if selected
    if (date.toDateString() === selectedDate.toDateString() && !isOtherMonth) {
        cell.classList.add('selected');
    }
    
    // Add day number
    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);
    
    // Check if has tasks
    const hasTasks = tasks.some(task => task.date === dateString);
    if (hasTasks && !isOtherMonth) {
        const indicator = document.createElement('div');
        indicator.className = 'task-indicator';
        cell.appendChild(indicator);
    }
    
    // Add click event
    if (!isOtherMonth) {
        cell.addEventListener('click', () => {
            selectedDate = new Date(date);
            renderCalendar();
            renderTasks();
            updateSelectedDateDisplay();
        });
        cell.setAttribute('data-testid', `day-cell-${day}`);
    }
    
    return cell;
}

// Task Management
function openAddTaskModal() {
    editingTaskId = null;
    elements.modalTitle.textContent = 'Add New Task';
    elements.taskForm.reset();
    elements.taskDueDate.value = formatDate(selectedDate);
    elements.taskModal.classList.add('active');
}

function openEditTaskModal(taskId) {
    editingTaskId = taskId;
    const task = tasks.find(t => t.id === taskId);
    
    elements.modalTitle.textContent = 'Edit Task';
    elements.taskTitle.value = task.title;
    elements.taskTime.value = task.time || '';
    elements.taskDescription.value = task.description || '';
    elements.taskDueDate.value = task.dueDate || '';
    elements.taskPriority.value = task.priority;
    
    elements.taskModal.classList.add('active');
}

function closeModal() {
    elements.taskModal.classList.remove('active');
    elements.taskForm.reset();
    editingTaskId = null;
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        id: editingTaskId || Date.now().toString(),
        title: elements.taskTitle.value.trim(),
        time: elements.taskTime.value,
        description: elements.taskDescription.value.trim(),
        dueDate: elements.taskDueDate.value,
        priority: elements.taskPriority.value,
        date: formatDate(selectedDate),
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    if (editingTaskId) {
        // Update existing task
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            taskData.completed = tasks[index].completed;
            tasks[index] = taskData;
        }
    } else {
        // Add new task
        tasks.push(taskData);
    }
    
    saveTasksToStorage();
    renderCalendar();
    renderTasks();
    closeModal();
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasksToStorage();
        renderCalendar();
        renderTasks();
    }
}

function toggleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasksToStorage();
        renderTasks();
    }
}

// Task Rendering
function renderTasks() {
    const dateString = formatDate(selectedDate);
    let filteredTasks = tasks.filter(task => task.date === dateString);
    
    // Apply filter
    if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (currentFilter === 'pending') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    elements.tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        const noTasks = document.createElement('div');
        noTasks.className = 'no-tasks';
        noTasks.setAttribute('data-testid', 'no-tasks-message');
        noTasks.innerHTML = `
            <i class="fas fa-clipboard-list"></i>
            <p>${currentFilter === 'all' ? 'No tasks for this date. Click "Add Task" to create one.' : `No ${currentFilter} tasks for this date.`}</p>
        `;
        elements.tasksList.appendChild(noTasks);
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        elements.tasksList.appendChild(taskCard);
    });
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = `task-card ${task.completed ? 'completed' : ''}`;
    card.style.setProperty('--priority-color', getPriorityColor(task.priority));
    card.setAttribute('data-testid', `task-card-${task.id}`);
    
    card.innerHTML = `
        <div class="task-header">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-testid="task-checkbox-${task.id}">
                ${task.completed ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="task-content">
                <div class="task-title" data-testid="task-title-${task.id}">${task.title}</div>
                ${task.description ? `<div class="task-description" data-testid="task-description-${task.id}">${task.description}</div>` : ''}
                <div class="task-meta">
                    ${task.time ? `<div class="task-meta-item"><i class="fas fa-clock"></i> ${task.time}</div>` : ''}
                    ${task.dueDate ? `<div class="task-meta-item"><i class="fas fa-calendar"></i> ${formatDateDisplay(task.dueDate)}</div>` : ''}
                    <div class="priority-badge priority-${task.priority}" data-testid="task-priority-${task.id}">
                        <i class="fas fa-flag"></i> ${task.priority}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit" data-testid="edit-task-btn-${task.id}" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-testid="delete-task-btn-${task.id}" title="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const checkbox = card.querySelector('.task-checkbox');
    checkbox.addEventListener('click', () => toggleTaskStatus(task.id));
    
    const editBtn = card.querySelector('.edit');
    editBtn.addEventListener('click', () => openEditTaskModal(task.id));
    
    const deleteBtn = card.querySelector('.delete');
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    return card;
}

// Utility Functions
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function updateSelectedDateDisplay() {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    elements.selectedDateSpan.textContent = selectedDate.toLocaleDateString('en-US', options);
}

function getPriorityColor(priority) {
    const colors = {
        low: '#10b981',
        medium: '#f59e0b',
        high: '#ef4444'
    };
    return colors[priority] || colors.medium;
}

// Local Storage
function saveTasksToStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasksFromStorage() {
    const stored = localStorage.getItem('tasks');
    if (stored) {
        tasks = JSON.parse(stored);
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
    updateSelectedDateDisplay();
});