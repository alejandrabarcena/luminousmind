import { useState } from 'react';
import { ProjectTask, TASK_STATUSES, TaskStatus } from '@/types/projects';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { EditTaskDialog } from './EditTaskDialog';

interface TaskCardProps {
  task: ProjectTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, updates: { title: string; description: string }) => Promise<any>;
}

export const TaskCard = ({ task, onStatusChange, onDelete, onUpdate }: TaskCardProps) => {
  const statuses = Object.keys(TASK_STATUSES) as TaskStatus[];
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow group">
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex-1 min-w-0 text-left"
            >
              <h4 className="font-medium text-sm text-gray-900 truncate">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">Mover a</DropdownMenuLabel>
                {statuses
                  .filter((s) => s !== task.status)
                  .map((s) => (
                    <DropdownMenuItem key={s} onClick={() => onStatusChange(task.id, s)}>
                      <span className={`w-2 h-2 rounded-full mr-2 ${TASK_STATUSES[s].color}`} />
                      {TASK_STATUSES[s].label}
                    </DropdownMenuItem>
                  ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={onUpdate}
      />
    </>
  );
};
