import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, GraduationCap, Users, ClipboardList } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const gradeFormSchema = z.object({
  name: z.string().min(1, 'Grade name is required'),
  description: z.string().optional(),
  colorIndex: z.number().min(0).max(5),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

const colorOptions = [
  { value: 0, label: 'Teal', class: 'bg-grade-0' },
  { value: 1, label: 'Blue', class: 'bg-grade-1' },
  { value: 2, label: 'Purple', class: 'bg-grade-2' },
  { value: 3, label: 'Pink', class: 'bg-grade-3' },
  { value: 4, label: 'Orange', class: 'bg-grade-4' },
  { value: 5, label: 'Yellow', class: 'bg-grade-5' },
];

export default function GradesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  
  const { grades, addGrade, updateGrade, deleteGrade, students, assessmentTemplates, activeSchoolYearId } = useAppStore();

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      colorIndex: 0,
    },
  });

  const openCreateDialog = () => {
    form.reset({ name: '', description: '', colorIndex: 0 });
    setEditingGrade(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grade: typeof grades[0]) => {
    form.reset({
      name: grade.name,
      description: grade.description || '',
      colorIndex: grade.colorIndex,
    });
    setEditingGrade(grade.id);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: GradeFormValues) => {
    if (editingGrade) {
      updateGrade(editingGrade, data);
      toast.success('Grade updated successfully');
    } else {
      addGrade({
        id: crypto.randomUUID(),
        ...data,
        order: grades.length,
      });
      toast.success('Grade created successfully');
    }
    setIsDialogOpen(false);
    form.reset();
  };

  const handleDelete = (id: string) => {
    deleteGrade(id);
    toast.success('Grade deleted');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Grades</h1>
            <p className="text-muted-foreground">Manage grade levels and their configurations</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingGrade ? 'Edit Grade' : 'Create New Grade'}</DialogTitle>
                <DialogDescription>
                  {editingGrade ? 'Update the grade details' : 'Add a new grade level to the system'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Grade 1-2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of this grade level" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="colorIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Theme</FormLabel>
                        <Select
                          value={String(field.value)}
                          onValueChange={(val) => field.onChange(Number(val))}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {colorOptions.map((color) => (
                              <SelectItem key={color.value} value={String(color.value)}>
                                <div className="flex items-center gap-2">
                                  <div className={`h-4 w-4 rounded ${color.class}`} />
                                  {color.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingGrade ? 'Save Changes' : 'Create Grade'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Grades Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {grades.map((grade, index) => {
              const gradeStudents = students.filter(
                (s) => s.gradeId === grade.id && s.schoolYearId === activeSchoolYearId
              );
              const gradeAssessments = assessmentTemplates.filter(
                (a) => a.gradeId === grade.id && a.schoolYearId === activeSchoolYearId
              );

              return (
                <motion.div
                  key={grade.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group overflow-hidden transition-all hover:shadow-lg">
                    <div
                      className="h-2"
                      style={{ backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` }}
                    />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground font-bold"
                            style={{ backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` }}
                          >
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{grade.name}</CardTitle>
                            {grade.description && (
                              <CardDescription>{grade.description}</CardDescription>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{gradeStudents.length} students</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ClipboardList className="h-4 w-4" />
                          <span>{gradeAssessments.length} assessments</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(grade)}
                        >
                          <Pencil className="mr-1.5 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDelete(grade.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {grades.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full"
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 font-semibold">No grades yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first grade to get started
                  </p>
                  <Button onClick={openCreateDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Grade
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
