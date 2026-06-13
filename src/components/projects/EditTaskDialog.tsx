import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ProjectTask } from '@/types/projects';

interface EditTaskDialogProps {
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (taskId: string, updates: { title: string; description: string }) => Promise<any>;
}

export const EditTaskDialog = ({ task, open, onOpenChange, onSave }: EditTaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) return;
    setSaving(true);
    await onSave(task.id, { title: title.trim(), description: description.trim() });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-poppins">Editar tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Descripción</Label>
            <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="hero" disabled={saving || !title.trim()} className="flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
