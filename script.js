const STORAGE_KEY = "taskflow_tasks";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const submitBtn = document.getElementById("submitBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");

const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const pendingTasksElement = document.getElementById("pendingTasks");
const remainingText = document.getElementById("remainingText");

const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = loadTasks();
let currentFilter = "all";
let editingTaskId = null;

function loadTasks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Unable to load saved tasks:", error);
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);
        formMessage.textContent =
            "Unable to save tasks in this browser. Check your storage settings.";
        return false;
    }
}

function showMessage(message, isError = true) {
    formMessage.textContent = message;
    formMessage.style.color = isError ? "var(--danger)" : "var(--success)";
}

function clearMessage() {
    formMessage.textContent = "";
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completed;
    pendingTasksElement.textContent = pending;

    remainingText.textContent =
        `${pending} ${pending === 1 ? "task" : "tasks"} remaining`;
}

function getVisibleTasks() {
    if (currentFilter === "active") {
        return tasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        return tasks.filter(task => task.completed);
    }

    return tasks;
}

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function createActionButton(label, className, title, handler) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `action-btn ${className}`;
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);

    button.addEventListener("click", handler);

    return button;
}

function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = getVisibleTasks();

    emptyState.style.display =
        visibleTasks.length === 0 ? "block" : "none";

    if (visibleTasks.length === 0) {
        const heading = emptyState.querySelector("h3");
        const description = emptyState.querySelector("p");

        if (currentFilter === "active" && tasks.length > 0) {
            heading.textContent = "No active tasks";
            description.textContent = "All your tasks are completed.";
        } else if (currentFilter === "completed" && tasks.length > 0) {
            heading.textContent = "No completed tasks";
            description.textContent = "Complete a task to see it here.";
        } else {
            heading.textContent = "No tasks here yet";
            description.textContent = "Add a task above to get started.";
        }
    }

    visibleTasks.forEach(task => {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Complete ${task.title}`);

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const date = document.createElement("p");
        date.className = "task-date";
        date.textContent = `Created ${formatDate(task.createdAt)}`;

        content.append(title, date);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        actions.append(
            createActionButton("✏️", "edit-btn", "Edit task", () => {
                editTask(task.id);
            }),
            createActionButton("🗑️", "delete-btn", "Delete task", () => {
                deleteTask(task.id);
            })
        );

        item.append(checkbox, content, actions);
        taskList.appendChild(item);
    });

    updateStats();
}

function addTask(title) {
    const task = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task);

    if (!saveTasks()) {
        tasks.shift();
        return;
    }

    currentFilter = "all";
    updateFilterButtons();
    renderTasks();
    showMessage("Task added successfully!", false);
}

function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    editingTaskId = id;
    taskInput.value = task.title;
    submitBtn.textContent = "Save Changes";

    clearMessage();
    taskInput.focus();
}

function resetForm() {
    editingTaskId = null;
    taskInput.value = "";
    submitBtn.textContent = "+ Add Task";
}

function toggleTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) {
        return;
    }

    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = !task.completed;
        return;
    }

    renderTasks();
    showMessage(
        task.completed ? "Task completed!" : "Task marked as active.",
        false
    );
}

function deleteTask(id) {
    const index = tasks.findIndex(item => item.id === id);

    if (index === -1) {
        return;
    }

    const [removedTask] = tasks.splice(index, 1);

    if (!saveTasks()) {
        tasks.splice(index, 0, removedTask);
        return;
    }

    if (editingTaskId === id) {
        resetForm();
    }

    renderTasks();
    showMessage("Task deleted.", false);
}

function updateFilterButtons() {
    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        showMessage("Please enter a task.");
        taskInput.focus();
        return;
    }

    if (title.length > 150) {
        showMessage("Tasks cannot exceed 150 characters.");
        return;
    }

    if (editingTaskId !== null) {
        const task = tasks.find(item => item.id === editingTaskId);

        if (!task) {
            resetForm();
            renderTasks();
            return;
        }

        const oldTitle = task.title;
        task.title = title;

        if (!saveTasks()) {
            task.title = oldTitle;
            return;
        }

        resetForm();
        renderTasks();
        showMessage("Task updated successfully!", false);
        return;
    }

    addTask(title);

    if (formMessage.style.color !== "var(--danger)") {
        taskInput.value = "";
    }

    taskInput.focus();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        updateFilterButtons();
        renderTasks();
        clearMessage();
    });
});

clearCompletedBtn.addEventListener("click", () => {
    const previousTasks = tasks;
    tasks = tasks.filter(task => !task.completed);

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    if (editingTaskId !== null &&
        !tasks.some(task => task.id === editingTaskId)) {
        resetForm();
    }

    renderTasks();
    showMessage("Completed tasks cleared.", false);
});

renderTasks();
updateFilterButtons();