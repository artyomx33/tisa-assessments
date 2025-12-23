import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, ChevronLeft, ChevronRight, BookOpen, Star, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import type { AssessmentTemplate, Subject, AssessmentPoint } from '@/types';

const STEPS = ['Basic Info', 'Subjects', 'Assessment Points', 'Intro & Texts'];

const basicInfoSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  gradeId: z.string().min(1, 'Please select a grade'),
});

interface AssessmentTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate?: AssessmentTemplate | null;
}

export function AssessmentTemplateDialog({
  open,
  onOpenChange,
  editingTemplate,
}: AssessmentTemplateDialogProps) {
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [introText, setIntroText] = useState('');
  const [staticTexts, setStaticTexts] = useState<{ key: string; title: string; content: string }[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const { grades, activeSchoolYearId, addAssessmentTemplate, updateAssessmentTemplate } = useAppStore();

  const form = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: editingTemplate?.name || '',
      description: editingTemplate?.description || '',
      gradeId: editingTemplate?.gradeId || '',
    },
  });

  // Initialize from editing template
  useState(() => {
    if (editingTemplate) {
      setSubjects(editingTemplate.subjects || []);
      setIntroText((editingTemplate as any).introText || '');
      setStaticTexts((editingTemplate as any).staticTexts || []);
    }
  });

  const resetDialog = () => {
    setStep(0);
    setSubjects([]);
    setIntroText('');
    setStaticTexts([]);
    setSelectedSubjectId(null);
    form.reset();
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const generateId = () => crypto.randomUUID();

  // Subject management
  const addSubject = () => {
    const newSubject: Subject = {
      id: generateId(),
      name: `New Subject ${subjects.length + 1}`,
      description: '',
      assessmentPoints: [],
    };
    setSubjects([...subjects, newSubject]);
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
    if (selectedSubjectId === id) setSelectedSubjectId(null);
  };

  // Assessment point management
  const addAssessmentPoint = (subjectId: string) => {
    const newPoint: AssessmentPoint = {
      id: generateId(),
      name: 'New Assessment Point',
      maxStars: 4,
    };
    updateSubject(subjectId, {
      assessmentPoints: [
        ...(subjects.find((s) => s.id === subjectId)?.assessmentPoints || []),
        newPoint,
      ],
    });
  };

  const updateAssessmentPoint = (subjectId: string, pointId: string, updates: Partial<AssessmentPoint>) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    updateSubject(subjectId, {
      assessmentPoints: subject.assessmentPoints.map((p) =>
        p.id === pointId ? { ...p, ...updates } : p
      ),
    });
  };

  const deleteAssessmentPoint = (subjectId: string, pointId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    updateSubject(subjectId, {
      assessmentPoints: subject.assessmentPoints.filter((p) => p.id !== pointId),
    });
  };

  // Static text management
  const addStaticText = () => {
    setStaticTexts([
      ...staticTexts,
      { key: generateId(), title: 'New Section', content: '' },
    ]);
  };

  const updateStaticText = (key: string, updates: { title?: string; content?: string }) => {
    setStaticTexts(staticTexts.map((t) => (t.key === key ? { ...t, ...updates } : t)));
  };

  const deleteStaticText = (key: string) => {
    setStaticTexts(staticTexts.filter((t) => t.key !== key));
  };

  const handleNext = async () => {
    if (step === 0) {
      const valid = await form.trigger();
      if (!valid) return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSave = () => {
    const values = form.getValues();
    
    const templateData = {
      id: editingTemplate?.id || generateId(),
      gradeId: values.gradeId,
      schoolYearId: activeSchoolYearId!,
      name: values.name,
      description: values.description,
      subjects,
      introText,
      staticTexts,
      createdAt: editingTemplate?.createdAt || new Date().toISOString(),
    };

    if (editingTemplate) {
      updateAssessmentTemplate(editingTemplate.id, templateData);
      toast.success('Assessment template updated');
    } else {
      addAssessmentTemplate(templateData as AssessmentTemplate);
      toast.success('Assessment template created');
    }

    handleClose();
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const totalPoints = subjects.reduce((acc, s) => acc + s.assessmentPoints.length, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Edit Assessment Template' : 'Create Assessment Template'}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-4">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <AnimatePresence mode="wait">
            {/* Step 0: Basic Info */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Student Progress Report - Semester 1" {...field} />
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
                          <FormLabel>Description (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of this assessment template..."
                              {...field}
                            />
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
                                      className="w-2 h-2 rounded-full"
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
                </Form>
              </motion.div>
            )}

            {/* Step 1: Subjects */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Add subjects that will be assessed. Each subject can have multiple assessment points.
                  </p>
                  <Button onClick={addSubject} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Subject
                  </Button>
                </div>

                <div className="space-y-3">
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={subject.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                            <div className="flex-1 space-y-3">
                              <Input
                                value={subject.name}
                                onChange={(e) => updateSubject(subject.id, { name: e.target.value })}
                                placeholder="Subject name"
                                className="font-medium"
                              />
                              <Input
                                value={subject.description || ''}
                                onChange={(e) => updateSubject(subject.id, { description: e.target.value })}
                                placeholder="Description (optional)"
                                className="text-sm"
                              />
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {subject.assessmentPoints.length} points
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => deleteSubject(subject.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {subjects.length === 0 && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No subjects added yet</p>
                        <p className="text-sm">Click "Add Subject" to start building your template</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Assessment Points */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  Select a subject to add assessment points. Total: {totalPoints} points across {subjects.length} subjects.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  {/* Subject list */}
                  <div className="col-span-1 space-y-2">
                    {subjects.map((subject) => (
                      <Button
                        key={subject.id}
                        variant={selectedSubjectId === subject.id ? 'default' : 'outline'}
                        className="w-full justify-start gap-2"
                        onClick={() => setSelectedSubjectId(subject.id)}
                      >
                        <BookOpen className="h-4 w-4" />
                        <span className="truncate flex-1 text-left">{subject.name}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {subject.assessmentPoints.length}
                        </Badge>
                      </Button>
                    ))}
                  </div>

                  {/* Assessment points for selected subject */}
                  <div className="col-span-2">
                    {selectedSubject ? (
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{selectedSubject.name}</CardTitle>
                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => addAssessmentPoint(selectedSubject.id)}
                            >
                              <Plus className="h-4 w-4" />
                              Add Point
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                          {selectedSubject.assessmentPoints.map((point, index) => (
                            <motion.div
                              key={point.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                            >
                              <div className="flex-1">
                                <Input
                                  value={point.name}
                                  onChange={(e) =>
                                    updateAssessmentPoint(selectedSubject.id, point.id, { name: e.target.value })
                                  }
                                  placeholder="Assessment point name"
                                  className="bg-background"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-star-filled" />
                                <Select
                                  value={String(point.maxStars)}
                                  onValueChange={(val) =>
                                    updateAssessmentPoint(selectedSubject.id, point.id, { maxStars: Number(val) })
                                  }
                                >
                                  <SelectTrigger className="w-16">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <SelectItem key={n} value={String(n)}>
                                        {n}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => deleteAssessmentPoint(selectedSubject.id, point.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          ))}

                          {selectedSubject.assessmentPoints.length === 0 && (
                            <div className="py-6 text-center text-muted-foreground">
                              <Star className="h-6 w-6 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No assessment points yet</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-dashed h-full flex items-center justify-center">
                        <CardContent className="text-center text-muted-foreground">
                          <ChevronLeft className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p>Select a subject to add assessment points</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Intro & Static Texts */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Introduction Text
                  </label>
                  <Textarea
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    placeholder="Dear Parents/Guardians, this report provides an overview of your child's progress..."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    This text will appear at the beginning of each report.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-medium">Additional Sections</label>
                    <Button onClick={addStaticText} size="sm" variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Section
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {staticTexts.map((text, index) => (
                      <Card key={text.key}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Input
                              value={text.title}
                              onChange={(e) => updateStaticText(text.key, { title: e.target.value })}
                              placeholder="Section title"
                              className="font-medium"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => deleteStaticText(text.key)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={text.content}
                            onChange={(e) => updateStaticText(text.key, { content: e.target.value })}
                            placeholder="Section content..."
                            className="min-h-[80px]"
                          />
                        </CardContent>
                      </Card>
                    ))}

                    {staticTexts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Add sections like grading scale explanations, school info, etc.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
