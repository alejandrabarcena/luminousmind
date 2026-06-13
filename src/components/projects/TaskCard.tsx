import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProjectTask } from '@/types/projects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Pencil, GripVertical } from 'lucide-react';
import { EditTaskDialog } from './EditTaskDialog';

interface TaskCardProps {
  task: ProjectTask;
  onDelete: (taskId: string) => void;
  onUpdate: (
    taskId: string,
    updates: { title: string; description: string }
  ) => Promise<any>;
  isOverlay?: boolean;
}

export const TaskCard = ({ task, onDelete, onUpdate, isOverlay }: TaskCardProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isOverlay });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <div ref={isOverlay ? undefined : setNodeRef} style={isOverlay ? undefined : style}>
        <Card
          className={`bg-white shadow-sm hover:shadow-md transition-shadow group ${
            isOverlay ? 'shadow-xl rotate-2 cursor-grabbing' : ''
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 pt-0.5"
                {...attributes}
                {...listeners}
                aria-label="Arrastrar tarea"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex-1 min-w-0 text-left"
              >
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditTaskDialog
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={onUpdate}
      />
    </>
  );
};
