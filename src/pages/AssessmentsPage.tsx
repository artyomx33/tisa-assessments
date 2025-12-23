import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ClipboardList, GripVertical, Star } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { StarRating } from '@/components/ui/StarRating';
import { toast } from 'sonner';

const assessmentPointSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  maxStars: z.number().min(1).max(5),
  order: z.number(),
});

const assessmentFormSchema = z.object({
  name: z.string().min(1, 'Assessment name is required'),
  description: z.string().optional(),
  gradeId: z.string().min(1, 'Please select a grade'),
  points: z.array(assessmentPointSchema).min(1, 'Add at least one assessment point'),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

export default function AssessmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<string | null>(null);
  const [filterGrade, setFilterGrade] = useState<string>('all');

  const { assessmentTemplates, addAssessmentTemplate, updateAssessmentTemplate, deleteAssessmentTemplate, grades, activeSchoolYearId } = useAppStore();

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      gradeId: '',
      points: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'points',
  });

  const activeAssessments = assessmentTemplates.filter(
    (a) => a.schoolYearId === activeSchoolYearId
  );

  const filteredAssessments = activeAssessments.filter(
    (a) => filterGrade === 'all' || a.gradeId === filterGrade
  );

  const openCreateDialog = () => {
    form.reset({
      name: '',
      description: '',
      gradeId: '',
      points: [],
    });
    setEditingAssessment(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (assessment: typeof assessmentTemplates[0]) => {
    form.reset({
      name: assessment.name,
      description: assessment.description || '',
      gradeId: assessment.gradeId,
      points: assessment.points,
    });
    setEditingAssessment(assessment.id);
    setIsDialogOpen(true);
  };

  const addPoint = () => {
    append({
      id: crypto.randomUUID(),
      label: '',
      description: '',
      maxStars: 4,
      order: fields.length,
    });
  };

  const onSubmit = (data: AssessmentFormValues) => {
    if (editingAssessment) {
      updateAssessmentTemplate(editingAssessment, {
        ...data,
        points: data.points.map((p, i) => ({ ...p, order: i })),
      });
      toast.success('Assessment updated successfully');
    } else {
      addAssessmentTemplate({
        id: crypto.randomUUID(),
        ...data,
        points: data.points.map((p, i) => ({ ...p, order: i })),
        schoolYearId: activeSchoolYearId!,
        createdAt: new Date().toISOString(),
      });
      toast.success('Assessment created successfully');
    }
    setIsDialogOpen(false);
    form.reset();
  };

  const handleDelete = (id: string) => {
    deleteAssessmentTemplate(id);
    toast.success('Assessment deleted');
  };

  const getGradeInfo = (gradeId: string) => grades.find((g) => g.id === gradeId);

  // Group by grade
  const assessmentsByGrade = grades.map((grade) => ({
    grade,
    assessments: filteredAssessments.filter((a) => a.gradeId === grade.id),
  })).filter((group) => group.assessments.length > 0 || filterGrade === group.grade.id);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Assessments</h1>
            <p className="text-muted-foreground">
              Create and manage assessment templates with star criteria
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Assessment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
                </DialogTitle>
                <DialogDescription>
                  Define the assessment criteria with star ratings for each point
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Math Skills Q1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gradeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {grades.map((grade) => (
                                <SelectItem key={grade.id} value={grade.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded"
                                      style={{ backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` }}
                                    />
                                    {grade.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Brief description of this assessment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Assessment Points */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">Assessment Points</FormLabel>
                      <Button type="button" variant="outline" size="sm" onClick={addPoint}>
                        <Plus className="mr-1.5 h-3 w-3" />
                        Add Point
                      </Button>
                    </div>

                    {fields.length === 0 && (
                      <Card className="border-dashed">
                        <CardContent className="py-6 text-center text-muted-foreground">
                          <Star className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p className="text-sm">No assessment points yet</p>
                          <p className="text-xs">Click "Add Point" to create criteria</p>
                        </CardContent>
                      </Card>
                    )}

                    <AnimatePresence mode="popLayout">
                      {fields.map((field, index) => (
                        <motion.div
                          key={field.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <GripVertical className="mt-2 h-5 w-5 text-muted-foreground/50" />
                                <div className="flex-1 space-y-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <FormField
                                      control={form.control}
                                      name={`points.${index}.label`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormControl>
                                            <Input placeholder="Point label (e.g., Number Recognition)" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`points.${index}.maxStars`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Max stars:</span>
                                            <Select
                                              value={String(field.value)}
                                              onValueChange={(val) => field.onChange(Number(val))}
                                            >
                                              <FormControl>
                                                <SelectTrigger className="w-20">
                                                  <SelectValue />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                {[1, 2, 3, 4, 5].map((n) => (
                                                  <SelectItem key={n} value={String(n)}>
                                                    {n}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                            <StarRating value={field.value} max={5} readonly size="sm" />
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name={`points.${index}.description`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            placeholder="Description (optional)"
                                            className="text-sm"
                                            {...field}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAssessment ? 'Save Changes' : 'Create Assessment'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {grades.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assessments by Grade */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {assessmentsByGrade.map(({ grade, assessments }) => (
              <motion.div
                key={grade.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="h-1 w-8 rounded-full"
                    style={{ backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` }}
                  />
                  <h2 className="font-display font-semibold">{grade.name}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {assessments.length} assessments
                  </span>
                </div>

                {assessments.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {assessments.map((assessment, index) => (
                      <motion.div
                        key={assessment.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="group h-full transition-all hover:shadow-lg">
                          <div
                            className="h-1.5 rounded-t-lg"
                            style={{ backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` }}
                          />
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{assessment.name}</CardTitle>
                            {assessment.description && (
                              <CardDescription className="line-clamp-2">
                                {assessment.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              {assessment.points.slice(0, 3).map((point) => (
                                <div key={point.id} className="flex items-center justify-between text-sm">
                                  <span className="truncate text-muted-foreground">{point.label}</span>
                                  <StarRating value={point.maxStars} max={point.maxStars} readonly size="sm" />
                                </div>
                              ))}
                              {assessment.points.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{assessment.points.length - 3} more points
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => openEditDialog(assessment)}
                              >
                                <Pencil className="mr-1.5 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleDelete(assessment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No assessments for this grade
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {activeAssessments.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 font-semibold">No assessments yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first assessment template to get started
                  </p>
                  <Button onClick={openCreateDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assessment
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
