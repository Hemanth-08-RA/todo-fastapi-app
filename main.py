from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import database

app = FastAPI(title="Premium Shared Todo API", version="1.0.0")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TaskBase(BaseModel):
    title: str

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    room_id: str
    completed: bool

# API Endpoints
@app.get("/api/tasks", response_model=List[Task])
def list_tasks(room_id: str = Query(..., description="Secret Room Key used to group tasks")):
    """List all tasks in a room from SQLite database."""
    if not room_id or room_id.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room ID cannot be empty"
        )
    return database.get_tasks(room_id.strip())

@app.post("/api/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate, 
    room_id: str = Query(..., description="Secret Room Key used to group tasks")
):
    """Add a new task to SQLite database for a specific room."""
    if not room_id or room_id.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room ID cannot be empty"
        )
    if not task.title or task.title.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task title cannot be empty"
        )
    
    new_task = database.add_task(room_id.strip(), task.title.strip())
    return new_task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(task_id: int):
    """Delete a task from SQLite by its ID."""
    deleted_task = database.delete_task(task_id)
    if not deleted_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    return {"message": "Task deleted successfully", "task": deleted_task}

@app.patch("/api/tasks/{task_id}", response_model=Task)
def update_task_status(task_id: int, completed: bool = Query(..., description="Task completed status")):
    """Toggle a task's completed status in SQLite."""
    updated_task = database.update_task_status(task_id, completed)
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    return updated_task

# Serve the frontend static files
# Mount static files AFTER API routes to prevent shadowing
app.mount("/", StaticFiles(directory="static", html=True), name="static")
