import sqlite3
import os

DB_FILE = "todo.db"

def get_db_connection():
    """Create a database connection to the SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    """Initialize the database and create tables / run schema migrations."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create baseline table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0
        )
    """)
    
    # Schema Migration: Check if 'task_date' column exists, if not add it dynamically
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [row["name"] for row in cursor.fetchall()]
    if "task_date" not in columns:
        cursor.execute("ALTER TABLE tasks ADD COLUMN task_date TEXT NOT NULL DEFAULT ''")
        
    conn.commit()
    conn.close()

def get_tasks(room_id: str):
    """Retrieve all tasks for a specific room."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE room_id = ?", (room_id,))
    rows = cursor.fetchall()
    conn.close()
    
    # Convert rows to a list of dicts, providing a fallback for task_date if empty
    return [
        {
            "id": row["id"], 
            "room_id": row["room_id"], 
            "title": row["title"], 
            "completed": bool(row["completed"]),
            "task_date": row["task_date"] if row["task_date"] else ""
        } 
        for row in rows
    ]

def get_task_by_id(task_id: int):
    """Retrieve a single task by its ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"], 
            "room_id": row["room_id"], 
            "title": row["title"], 
            "completed": bool(row["completed"]),
            "task_date": row["task_date"] if row["task_date"] else ""
        }
    return None

def add_task(room_id: str, title: str, task_date: str, completed: bool = False):
    """Add a new task to the database for a specific room and date."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (room_id, title, task_date, completed) VALUES (?, ?, ?, ?)",
        (room_id, title, task_date, 1 if completed else 0)
    )
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    
    return get_task_by_id(inserted_id)

def update_task_status(task_id: int, completed: bool):
    """Update a task's completed status."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET completed = ? WHERE id = ?",
        (1 if completed else 0, task_id)
    )
    conn.commit()
    conn.close()
    
    return get_task_by_id(task_id)

def delete_task(task_id: int):
    """Delete a task by ID."""
    task = get_task_by_id(task_id)
    if not task:
        return False
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    
    return task

# Automatically initialize database when database.py is imported
init_db()
