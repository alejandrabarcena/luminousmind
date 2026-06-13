import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useProjectTasks } from '@/hooks/useProjects';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { ProjectTask, TASK_STATUSES, TaskStatus } from '@/types/projects';

interface KanbanBoardProps {
  projectId: string;
}

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const { tasks, loading, createTask, updateTask, deleteTask, reorderTasks } =
    useProjectTasks(projectId);
  const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Object.keys(TASK_STATUSES).map((status) => (
          <div
            key={status}
            className="flex-1 min-w-[280px] max-w-[320px] bg-gray-50 rounded-xl p-4 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
            <div className="space-y-2">
              <div className="h-16 bg-gray-200 rounded" />
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statuses = Object.keys(TASK_STATUSES) as TaskStatus[];

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // The droppable can be a column (status string) or another task id
    const overTask = tasks.find((t) => t.id === overId);
    const overStatus: TaskStatus = overTask
      ? overTask.status
      : (overId as TaskStatus);

    if (!statuses.includes(overStatus)) return;

    // No-op if dropped on itself
    if (overTask && overTask.id === activeTask.id) return;

    // Build the next ordered list per column
    const byStatus: Record<TaskStatus, ProjectTask[]> = {
      ideas: [],
      in_progress: [],
      review: [],
      completed: [],
    };
    for (const s of statuses) {
      byStatus[s] = tasks
        .filter((t) => t.status === s && t.id !== activeId)
        .sort((a, b) => a.position - b.position);
    }

    const moved: ProjectTask = { ...activeTask, status: overStatus };
    const destList = byStatus[overStatus];

    let insertIndex = destList.length;
    if (overTask && overTask.status === overStatus) {
      insertIndex = destList.findIndex((t) => t.id === overTask.id);
      if (insertIndex < 0) insertIndex = destList.length;
    }
    destList.splice(insertIndex, 0, moved);

    // Re-number positions for every task in every column
    const next: ProjectTask[] = [];
    for (const s of statuses) {
      byStatus[s].forEach((t, idx) => {
        next.push({ ...t, status: s, position: idx });
      });
    }

    reorderTasks(next);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks
              .filter((t) => t.status === status)
              .sort((a, b) => a.position - b.position)}
            onCreateTask={(title) => createTask(title, '', status)}
            onDeleteTask={deleteTask}
            onUpdateTask={updateTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onDelete={() => {}}
            onUpdate={async () => {}}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
