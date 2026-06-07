/**
 * TaskFlow Frontend Application Logic
 * Communicates with FastAPI Backend API using SQLite storage & Shared Room Keys
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
    }

    // Connect to a specific Room
    function connectToRoom(roomId) {
        currentRoomId = roomId;
        localStorage.setItem('taskflow_room_id', roomId);
        
        // Update UI displays
        roomDisplay.textContent = `Room: ${roomId}`;
        
        // Show/Hide containers
        joinContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        // Clear tasks list and fetch immediately
        tasks = [];
        fetchTasks();
        
        // Start Polling (every 3 seconds)
        startPolling();
        
        showToast(`Connected to room: ${roomId}`, 'success');
    }

    // Disconnect/Leave Room
    function disconnectRoom() {
        // Stop polling
        stopPolling();
        
        // Clear local storage & state
        localStorage.removeItem('taskflow_room_id');
        currentRoomId = '';
        tasks = [];
        
        // Reset inputs
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
        stopPolling(); // Ensure no duplicate intervals
        pollIntervalId = setInterval(fetchTasks, 3000);
    }

    // Stop polling the server
    function stopPolling() {
        if (pollIntervalId) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
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
                body: JSON.stringify({ title }),
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const newTask = await response.json();
            
            // Add task locally and render immediately for instant feedback
            tasks.push(newTask);
            taskInput.value = '';
            taskInput.focus();
            
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
            
            // Smart Update: Compare with current list. Only re-render if something changed.
            if (hasTaskStateChanged(tasks, fetchedTasks)) {
                tasks = fetchedTasks;
                renderTasks();
            }
        } catch (error) {
            console.error('Error fetching tasks during polling:', error);
            // Don't spam error toasts during polling to maintain clean UX, 
            // just log it.
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
                oldT.completed !== newT.completed
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
            
            // Update local state and render immediately
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
            // Apply removing animation locally first for fluid interaction
            taskElement.classList.add('removing');
            
            // Wait for slide-out animation to complete (320ms)
            await new Promise(resolve => setTimeout(resolve, 320));

            const response = await fetch(`${API_URL}/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            // Remove from local state and re-render
            tasks = tasks.filter(task => task.id !== taskId);
            renderTasks();
            
            showToast('Task deleted.', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            // Revert animation class if delete fails
            taskElement.classList.remove('removing');
            showToast('Could not delete task.', 'danger');
        }
    }

    // Render local tasks to the DOM
    function renderTasks() {
        taskList.innerHTML = '';
        
        // Update count stats
        updateStats();

        // Check if list is empty
        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        // Generate DOM for each task
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;

            // Task item container for checkbox & title
            const contentDiv = document.createElement('div');
            contentDiv.className = 'task-content';
            contentDiv.addEventListener('click', () => toggleTaskStatus(task.id, task.completed));

            // Custom Checkbox
            const checkbox = document.createElement('span');
            checkbox.className = 'custom-checkbox';
            checkbox.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;

            // Task title
            const textSpan = document.createElement('span');
            textSpan.className = 'task-text';
            textSpan.textContent = task.title;

            contentDiv.appendChild(checkbox);
            contentDiv.appendChild(textSpan);

            // Delete button
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
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;

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

        // Fade out toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            // Remove from DOM after transition completes
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }
});
