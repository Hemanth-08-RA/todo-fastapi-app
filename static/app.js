/**
 * TaskFlow Frontend Application Logic
 * Integrates shared rooms, real-time polling, and an interactive Month/Week calendar.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Containers
    const joinContainer = document.getElementById('join-container');
    const appContainer = document.getElementById('app-container');

    // DOM Forms & Inputs
    const joinForm = document.getElementById('join-form');
    const roomInput = document.getElementById('room-input');
    const todoForm = document.getElementById('todo-form');
    const taskInput = document.getElementById('task-input');

    // DOM Calendar Elements
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const calendarDaysGrid = document.getElementById('calendar-days');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const activeDateDisplay = document.getElementById('active-date-display');
    const viewMonthBtn = document.getElementById('view-month-btn');
    const viewWeekBtn = document.getElementById('view-week-btn');

    // DOM Interactive Elements
    const taskList = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');
    const totalCount = document.getElementById('total-count');
    const completedCount = document.getElementById('completed-count');
    const roomDisplay = document.getElementById('room-display');
    const leaveBtn = document.getElementById('leave-btn');
    const toastContainer = document.getElementById('toast-container');

    // API Base URL
    const API_URL = '/api/tasks';

    // Application State
    let tasks = [];
    let currentRoomId = '';
    let pollIntervalId = null;

    // Calendar & Date State
    const today = new Date();
    let selectedDate = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
    
    // View mode: 'month' or 'week'
    let currentView = 'month';
    
    // Month/Year active calendar viewport
    let calendarYear = today.getFullYear();
    let calendarMonth = today.getMonth(); // 0-indexed (0 = Jan)

    // Week view anchor date
    let weekPivotDate = new Date(today);

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    // Initialize application
    init();

    function init() {
        const savedRoomId = localStorage.getItem('taskflow_room_id');
        if (savedRoomId && savedRoomId.trim() !== '') {
            connectToRoom(savedRoomId.trim());
        } else {
            showJoinScreen();
        }
        setupEventListeners();
    }

    // Setup Event Listeners
    function setupEventListeners() {
        joinForm.addEventListener('submit', handleJoinSubmit);
        todoForm.addEventListener('submit', handleTaskSubmit);
        leaveBtn.addEventListener('click', disconnectRoom);

        // Calendar Navigation
        prevMonthBtn.addEventListener('click', () => navigateCalendar(-1));
        nextMonthBtn.addEventListener('click', () => navigateCalendar(1));

        // Calendar View Toggles
        viewMonthBtn.addEventListener('click', () => switchView('month'));
        viewWeekBtn.addEventListener('click', () => switchView('week'));
    }

    // Switch Calendar view (Month vs Week)
    function switchView(view) {
        if (currentView === view) return;
        currentView = view;

        if (view === 'month') {
            viewWeekBtn.classList.remove('active');
            viewMonthBtn.classList.add('active');
            
            // Sync month viewport to selected date
            const [y, m, d] = selectedDate.split('-').map(Number);
            calendarMonth = m - 1;
            calendarYear = y;
        } else {
            viewMonthBtn.classList.remove('active');
            viewWeekBtn.classList.add('active');
            
            // Sync week pivot to selected date
            const [y, m, d] = selectedDate.split('-').map(Number);
            weekPivotDate = new Date(y, m - 1, d);
        }

        renderCalendar();
    }

    // Helper to format date elements to YYYY-MM-DD
    function formatDateString(year, monthIndex, day) {
        const mm = String(monthIndex + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    // Helper to display date in friendly format: e.g. "Monday, Jun 8, 2026"
    function formatFriendlyDate(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }

    // Connect to a specific Room
    function connectToRoom(roomId) {
        currentRoomId = roomId;
        localStorage.setItem('taskflow_room_id', roomId);
        
        roomDisplay.textContent = `Room: ${roomId}`;
        joinContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        tasks = [];
        updateActiveDateUI();
        fetchTasks();
        
        // Start Polling (every 3 seconds)
        startPolling();
        
        showToast(`Connected to room: ${roomId}`, 'success');
    }

    // Disconnect/Leave Room
    function disconnectRoom() {
        stopPolling();
        
        localStorage.removeItem('taskflow_room_id');
        currentRoomId = '';
        tasks = [];
        
        roomInput.value = '';
        taskInput.value = '';
        
        showJoinScreen();
        showToast('Disconnected from room', 'success');
    }

    function showJoinScreen() {
        appContainer.classList.add('hidden');
        joinContainer.classList.remove('hidden');
        roomInput.focus();
    }

    // Handle Joining Room
    function handleJoinSubmit(e) {
        e.preventDefault();
        const roomId = roomInput.value.trim();
        if (roomId) {
            connectToRoom(roomId);
        }
    }

    // Start polling the server for updates
    function startPolling() {
        stopPolling();
        pollIntervalId = setInterval(fetchTasks, 3000);
    }

    // Stop polling the server
    function stopPolling() {
        if (pollIntervalId) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
    }

    // Navigation for calendar
    function navigateCalendar(direction) {
        if (currentView === 'month') {
            calendarMonth += direction;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear -= 1;
            } else if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear += 1;
            }
        } else {
            // Shift week pivot by 7 days
            weekPivotDate.setDate(weekPivotDate.getDate() + (direction * 7));
            calendarMonth = weekPivotDate.getMonth();
            calendarYear = weekPivotDate.getFullYear();
        }
        renderCalendar();
    }

    // Update active date header text and form placeholder
    function updateActiveDateUI() {
        activeDateDisplay.textContent = `Tasks for ${formatFriendlyDate(selectedDate)}`;
        
        const todayStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
        if (selectedDate === todayStr) {
            taskInput.placeholder = "Add a task for today...";
        } else {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const shortDate = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            taskInput.placeholder = `Add a task for ${shortDate}...`;
        }
    }

    // Main calendar renderer delegates based on currentView mode
    function renderCalendar() {
        if (currentView === 'month') {
            renderMonthCalendar();
        } else {
            renderWeekCalendar();
        }
    }

    // Render Full Month Calendar Grid
    function renderMonthCalendar() {
        calendarMonthYear.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;
        calendarDaysGrid.innerHTML = '';

        // Get index of first day of the month (Monday-start mapping: 0 = Mon, 6 = Sun)
        let firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
        firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const prevTotalDays = new Date(calendarYear, calendarMonth, 0).getDate();

        // 1. Previous Month's Padding Days
        for (let i = firstDayIndex; i > 0; i--) {
            const dayNum = prevTotalDays - i + 1;
            const prevMonthIndex = calendarMonth === 0 ? 11 : calendarMonth - 1;
            const prevYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
            const dateStr = formatDateString(prevYear, prevMonthIndex, dayNum);

            const dayDiv = createDayCell(dayNum, dateStr, true);
            calendarDaysGrid.appendChild(dayDiv);
        }

        // 2. Current Month's Days
        for (let i = 1; i <= totalDays; i++) {
            const dateStr = formatDateString(calendarYear, calendarMonth, i);
            const dayDiv = createDayCell(i, dateStr, false);
            calendarDaysGrid.appendChild(dayDiv);
        }

        // 3. Next Month's Padding Days
        const totalCellsRendered = firstDayIndex + totalDays;
        const totalGridCells = Math.ceil(totalCellsRendered / 7) * 7;
        const nextMonthPadding = totalGridCells - totalCellsRendered;

        for (let i = 1; i <= nextMonthPadding; i++) {
            const nextMonthIndex = calendarMonth === 11 ? 0 : calendarMonth + 1;
            const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
            const dateStr = formatDateString(nextYear, nextMonthIndex, i);

            const dayDiv = createDayCell(i, dateStr, true);
            calendarDaysGrid.appendChild(dayDiv);
        }
    }

    // Render Week Strip Calendar Grid (7 Days)
    function renderWeekCalendar() {
        calendarDaysGrid.innerHTML = '';

        // Calculate Monday of the week containing weekPivotDate
        const currentDay = weekPivotDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(weekPivotDate);
        monday.setDate(weekPivotDate.getDate() + diffToMonday);

        // Calculate Sunday of the same week for header title logic
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        // Header Title ranges
        if (monday.getMonth() === sunday.getMonth()) {
            calendarMonthYear.textContent = `${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
        } else {
            const monMonth = monthNames[monday.getMonth()].substring(0, 3);
            const sunMonth = monthNames[sunday.getMonth()].substring(0, 3);
            if (monday.getFullYear() === sunday.getFullYear()) {
                calendarMonthYear.textContent = `${monMonth} - ${sunMonth} ${monday.getFullYear()}`;
            } else {
                calendarMonthYear.textContent = `${monMonth} ${monday.getFullYear()} - ${sunMonth} ${sunday.getFullYear()}`;
            }
        }

        // Render exactly 7 days
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + i);
            const dateStr = formatDateString(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
            
            const dayDiv = createDayCell(dayDate.getDate(), dateStr, false);
            calendarDaysGrid.appendChild(dayDiv);
        }
    }

    // Helper to generate day grid cell element
    function createDayCell(dayNum, dateStr, isAdjacent) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.textContent = dayNum;
        
        if (isAdjacent) {
            dayDiv.classList.add('adjacent-month');
        }

        const todayStr = formatDateString(today.getFullYear(), today.getMonth(), today.getDate());
        if (dateStr === todayStr) {
            dayDiv.classList.add('today');
        }

        if (dateStr === selectedDate) {
            dayDiv.classList.add('selected-day');
        }

        const hasTasks = tasks.some(task => task.task_date === dateStr);
        if (hasTasks) {
            dayDiv.classList.add('has-tasks');
        }

        dayDiv.addEventListener('click', () => {
            selectedDate = dateStr;
            
            // Align calendar view states
            const [y, m, d] = dateStr.split('-').map(Number);
            calendarMonth = m - 1;
            calendarYear = y;
            weekPivotDate = new Date(y, m - 1, d);

            updateActiveDateUI();
            renderCalendar();
            renderTasks();
        });

        return dayDiv;
    }

    // Handle Task Form Submission
    async function handleTaskSubmit(e) {
        e.preventDefault();
        const title = taskInput.value.trim();
        if (!title) return;

        try {
            const response = await fetch(`${API_URL}?room_id=${encodeURIComponent(currentRoomId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    title: title, 
                    task_date: selectedDate 
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const newTask = await response.json();
            
            tasks.push(newTask);
            taskInput.value = '';
            taskInput.focus();
            
            renderCalendar();
            renderTasks();
            showToast('Task added!', 'success');
        } catch (error) {
            console.error('Error adding task:', error);
            showToast('Could not add task. Try again.', 'danger');
        }
    }

    // Fetch all tasks from the API for the current room
    async function fetchTasks() {
        if (!currentRoomId) return;

        try {
            const response = await fetch(`${API_URL}?room_id=${encodeURIComponent(currentRoomId)}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const fetchedTasks = await response.json();
            
            if (hasTaskStateChanged(tasks, fetchedTasks)) {
                tasks = fetchedTasks;
                renderCalendar();
                renderTasks();
            }
        } catch (error) {
            console.error('Error fetching tasks during polling:', error);
        }
    }

    // Deep compare tasks to check if UI update is actually needed
    function hasTaskStateChanged(oldList, newList) {
        if (oldList.length !== newList.length) return true;
        
        for (let i = 0; i < oldList.length; i++) {
            const oldT = oldList[i];
            const newT = newList[i];
            if (
                oldT.id !== newT.id || 
                oldT.title !== newT.title || 
                oldT.completed !== newT.completed ||
                oldT.task_date !== newT.task_date
            ) {
                return true;
            }
        }
        return false;
    }

    // Toggle Task completed status
    async function toggleTaskStatus(taskId, currentStatus) {
        const newStatus = !currentStatus;
        try {
            const response = await fetch(`${API_URL}/${taskId}?completed=${newStatus}`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error('Failed to update task status');
            }

            const updatedTask = await response.json();
            
            tasks = tasks.map(task => task.id === taskId ? updatedTask : task);
            renderTasks();
            
            if (newStatus) {
                showToast('Task completed!', 'success');
            } else {
                showToast('Task reactivated.', 'success');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            showToast('Could not update task status.', 'danger');
        }
    }

    // Delete a task by ID
    async function deleteTask(taskId, taskElement) {
        try {
            taskElement.classList.add('removing');
            
            await new Promise(resolve => setTimeout(resolve, 320));

            const response = await fetch(`${API_URL}/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            tasks = tasks.filter(task => task.id !== taskId);
            renderCalendar();
            renderTasks();
            
            showToast('Task deleted.', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            taskElement.classList.remove('removing');
            showToast('Could not delete task.', 'danger');
        }
    }

    // Render local tasks matching selectedDate to the DOM
    function renderTasks() {
        taskList.innerHTML = '';
        
        const activeTasks = tasks.filter(task => task.task_date === selectedDate);
        
        updateStats(activeTasks);

        if (activeTasks.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        activeTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';
            contentDiv.addEventListener('click', () => toggleTaskStatus(task.id, task.completed));

            const checkbox = document.createElement('span');
            checkbox.className = 'custom-checkbox';
            checkbox.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;

            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.title;

            contentDiv.appendChild(checkbox);
            contentDiv.appendChild(textSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.setAttribute('aria-label', `Delete task: ${task.title}`);
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            `;
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id, li);
            });

            li.appendChild(contentDiv);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }

    // Update the counter badges
    function updateStats(activeTasks) {
        const total = activeTasks.length;
        const completed = activeTasks.filter(task => task.completed).length;

        totalCount.textContent = total;
        completedCount.textContent = completed;
    }

    // Toast Notification system
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(var(--accent-green));"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else {
            icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(var(--accent-red));"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        }

        toast.innerHTML = `${icon} <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }
});
