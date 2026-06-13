import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProjectTask, TASK_STATUSES, TaskStatus } from '@/types/projects';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: ProjectTask[];
  onCreateTask: (title: string, status: TaskStatus) => Promise<any>;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (
    taskId: string,
    updates: { title: string; description: string }
  ) => Promise<any>;
}

export const KanbanColumn = ({
  status,
  tasks,
  onCreateTask,
  onDeleteTask,
  onUpdateTask,
}: KanbanColumnProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const statusInfo = TASK_STATUSES[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await onCreateTask(newTaskTitle, status);
    setNewTaskTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTaskTitle('');
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] max-w-[320px] rounded-xl p-4 transition-colors ${
        isOver ? 'bg-orange-50 ring-2 ring-orange-300' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${statusInfo.color}`} />
        <h3 className="font-semibold text-gray-900">{statusInfo.label}</h3>
        <span className="text-sm text-gray-500 ml-auto">{tasks.length}</span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 mb-3 min-h-[40px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onUpdate={onUpdateTask}
            />
          ))}
        </div>
      </SortableContext>

      {isAdding ? (
        <div className="space-y-2">
          <Input
            placeholder="Título de la tarea..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddTask} disabled={!newTaskTitle.trim()}>
              Añadir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewTaskTitle('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-500 hover:text-gray-700"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir tarea
        </Button>
      )}
    </div>
  );
};
