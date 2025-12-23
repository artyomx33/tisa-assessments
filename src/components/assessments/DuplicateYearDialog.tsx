import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import type { AssessmentTemplate } from '@/types';

interface DuplicateYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: AssessmentTemplate;
}

export function DuplicateYearDialog({
  open,
  onOpenChange,
  template,
}: DuplicateYearDialogProps) {
  const [selectedYearId, setSelectedYearId] = useState('');
  
  const { schoolYears, addAssessmentTemplate } = useAppStore();

  const otherYears = schoolYears.filter((y) => y.id !== template.schoolYearId);

  const handleDuplicate = () => {
    if (!selectedYearId) {
      toast.error('Please select a school year');
      return;
    }

    const newTemplate: AssessmentTemplate = {
      ...template,
      id: crypto.randomUUID(),
      schoolYearId: selectedYearId,
      createdAt: new Date().toISOString(),
    };

    addAssessmentTemplate(newTemplate);
    
    const targetYear = schoolYears.find((y) => y.id === selectedYearId);
    toast.success(`Template duplicated to ${targetYear?.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate to New Year
          </DialogTitle>
          <DialogDescription>
            Create a copy of "{template.name}" for another school year.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Target School Year</label>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {otherYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {otherYears.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Create another school year in Settings first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDuplicate} disabled={!selectedYearId} className="gap-2">
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
