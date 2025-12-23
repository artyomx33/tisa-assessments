import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, ChevronRight, Sparkles, Save, Eye } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import type { StudentReport, ReportEntry } from '@/types';

const reportFormSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  assessmentTemplateId: z.string().min(1, 'Please select an assessment'),
  term: z.number().min(1).max(4),
  entries: z.array(
    z.object({
      assessmentPointId: z.string(),
      stars: z.number().min(0).max(5),
      teacherNotes: z.string().optional(),
      aiRewrittenText: z.string().optional(),
    })
  ),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function ReportsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [viewingReport, setViewingReport] = useState<StudentReport | null>(null);

  const {
    reports,
    addReport,
    updateReport,
    students,
    assessmentTemplates,
    grades,
    activeSchoolYearId,
  } = useAppStore();

  const activeStudents = students.filter((s) => s.schoolYearId === activeSchoolYearId);
  const activeAssessments = assessmentTemplates.filter((a) => a.schoolYearId === activeSchoolYearId);
  const activeReports = reports.filter((r) => r.schoolYearId === activeSchoolYearId);

  const selectedStudent = activeStudents.find((s) => s.id === selectedStudentId);
  const selectedAssessment = activeAssessments.find((a) => a.id === selectedAssessmentId);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      studentId: '',
      assessmentTemplateId: '',
      term: 1,
      entries: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    form.setValue('studentId', studentId);
    
    // Filter assessments for this student's grade
    const student = activeStudents.find((s) => s.id === studentId);
    if (student) {
      const gradeAssessments = activeAssessments.filter((a) => a.gradeId === student.gradeId);
      if (gradeAssessments.length > 0 && !selectedAssessmentId) {
        // Don't auto-select, let user choose
      }
    }
  };

  const handleAssessmentChange = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    form.setValue('assessmentTemplateId', assessmentId);
    
    const assessment = activeAssessments.find((a) => a.id === assessmentId);
    if (assessment) {
      // Initialize entries for each assessment point
      const entries: ReportEntry[] = assessment.points.map((point) => ({
        assessmentPointId: point.id,
        stars: 0,
        teacherNotes: '',
        aiRewrittenText: '',
      }));
      replace(entries);
    }
  };

  const openCreateDialog = () => {
    setSelectedStudentId('');
    setSelectedAssessmentId('');
    form.reset({
      studentId: '',
      assessmentTemplateId: '',
      term: 1,
      entries: [],
    });
    setIsDialogOpen(true);
  };

  const simulateAIRewrite = (text: string, index: number) => {
    if (!text.trim()) {
      toast.error('Please enter some notes first');
      return;
    }

    // Simulate AI rewrite (placeholder for actual AI integration)
    const tisaVoice = `${text.charAt(0).toUpperCase()}${text.slice(1)}. The student shows consistent effort and demonstrates a positive attitude towards learning. We encourage continued practice at home.`;
    
    form.setValue(`entries.${index}.aiRewrittenText`, tisaVoice);
    toast.success('Text rewritten in TISA voice!');
  };

  const onSubmit = (data: ReportFormValues) => {
    const newReport: StudentReport = {
      id: crypto.randomUUID(),
      studentId: data.studentId,
      assessmentTemplateId: data.assessmentTemplateId,
      schoolYearId: activeSchoolYearId!,
      term: data.term,
      entries: data.entries,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addReport(newReport);
    toast.success('Report saved successfully');
    setIsDialogOpen(false);
    form.reset();
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown';
  };

  const getAssessmentName = (assessmentId: string) => {
    const assessment = assessmentTemplates.find((a) => a.id === assessmentId);
    return assessment?.name || 'Unknown';
  };

  const getGradeInfo = (gradeId: string) => grades.find((g) => g.id === gradeId);

  const availableAssessments = selectedStudent
    ? activeAssessments.filter((a) => a.gradeId === selectedStudent.gradeId)
    : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Student Reports</h1>
            <p className="text-muted-foreground">
              Fill out progress reports with star ratings and AI-enhanced feedback
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Student Report</DialogTitle>
                <DialogDescription>
                  Fill in star ratings and notes. Use AI to rewrite in TISA voice.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Student & Assessment Selection */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              handleStudentChange(val);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeStudents.map((student) => {
                                const grade = getGradeInfo(student.gradeId);
                                return (
                                  <SelectItem key={student.id} value={student.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: grade ? `hsl(var(--grade-${grade.colorIndex}))` : undefined }}
                                      />
                                      {student.firstName} {student.lastName}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assessmentTemplateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              handleAssessmentChange(val);
                            }}
                            disabled={!selectedStudentId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assessment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableAssessments.map((assessment) => (
                                <SelectItem key={assessment.id} value={assessment.id}>
                                  {assessment.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="term"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term</FormLabel>
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
                              <SelectItem value="1">Term 1</SelectItem>
                              <SelectItem value="2">Term 2</SelectItem>
                              <SelectItem value="3">Term 3</SelectItem>
                              <SelectItem value="4">Term 4</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Assessment Points */}
                  {selectedAssessment && fields.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-display font-semibold">Assessment Points</h3>
                      <AnimatePresence>
                        {fields.map((field, index) => {
                          const point = selectedAssessment.points.find(
                            (p) => p.id === field.assessmentPointId
                          );
                          if (!point) return null;

                          return (
                            <motion.div
                              key={field.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <CardTitle className="text-base">{point.label}</CardTitle>
                                      {point.description && (
                                        <CardDescription>{point.description}</CardDescription>
                                      )}
                                    </div>
                                    <FormField
                                      control={form.control}
                                      name={`entries.${index}.stars`}
                                      render={({ field: starField }) => (
                                        <StarRating
                                          value={starField.value}
                                          max={point.maxStars}
                                          onChange={starField.onChange}
                                          size="lg"
                                        />
                                      )}
                                    />
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <FormField
                                    control={form.control}
                                    name={`entries.${index}.teacherNotes`}
                                    render={({ field: notesField }) => (
                                      <FormItem>
                                        <FormLabel className="text-sm text-muted-foreground">
                                          Teacher Notes
                                        </FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Enter your observations for this assessment point..."
                                            className="min-h-[80px]"
                                            {...notesField}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />

                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="gap-2"
                                      onClick={() =>
                                        simulateAIRewrite(
                                          form.getValues(`entries.${index}.teacherNotes`) || '',
                                          index
                                        )
                                      }
                                    >
                                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                                      Rewrite in TISA Voice
                                    </Button>
                                  </div>

                                  <FormField
                                    control={form.control}
                                    name={`entries.${index}.aiRewrittenText`}
                                    render={({ field: aiField }) =>
                                      aiField.value ? (
                                        <motion.div
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                        >
                                          <FormItem>
                                            <FormLabel className="flex items-center gap-2 text-sm">
                                              <Sparkles className="h-3.5 w-3.5 text-accent" />
                                              AI Rewritten (TISA Voice)
                                            </FormLabel>
                                            <FormControl>
                                              <Textarea
                                                className="min-h-[80px] bg-accent-light border-accent/20"
                                                {...aiField}
                                              />
                                            </FormControl>
                                          </FormItem>
                                        </motion.div>
                                      ) : null
                                    }
                                  />
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                  {!selectedAssessment && selectedStudentId && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Select an assessment to fill out the report
                      </CardContent>
                    </Card>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={fields.length === 0} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Report
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {activeReports.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeReports.map((report, index) => {
                const student = students.find((s) => s.id === report.studentId);
                const assessment = assessmentTemplates.find(
                  (a) => a.id === report.assessmentTemplateId
                );
                const grade = student ? getGradeInfo(student.gradeId) : null;

                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group cursor-pointer transition-all hover:shadow-lg">
                      <div
                        className="h-1.5 rounded-t-lg"
                        style={{
                          backgroundColor: grade
                            ? `hsl(var(--grade-${grade.colorIndex}))`
                            : 'hsl(var(--muted))',
                        }}
                      />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              {student
                                ? `${student.firstName} ${student.lastName}`
                                : 'Unknown Student'}
                            </CardTitle>
                            <CardDescription>
                              {assessment?.name || 'Unknown Assessment'}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={report.status === 'completed' ? 'default' : 'secondary'}
                          >
                            {report.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Term {report.term}</span>
                          <span>{report.entries.length} points</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1 gap-2">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mb-2 font-semibold">No reports yet</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create your first student report to get started
                  </p>
                  <Button onClick={openCreateDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Report
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
