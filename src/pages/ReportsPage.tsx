import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, ChevronRight, ChevronDown, Sparkles, Save, Eye, BookOpen } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { StarRating } from '@/components/ui/StarRating';
import { toast } from 'sonner';
import type { StudentReport, ReportEntry, Subject } from '@/types';

const reportFormSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  assessmentTemplateId: z.string().min(1, 'Please select an assessment'),
  term: z.string().default('Term 1 & 2'),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

// Separate state for entries since they're dynamic
interface EntryState {
  [key: string]: {
    stars: number;
    teacherNotes: string;
    aiRewrittenText: string;
  };
}

export default function ReportsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<EntryState>({});

  const {
    reports,
    addReport,
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
      term: 'Term 1 & 2',
    },
  });

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    form.setValue('studentId', studentId);
  };

  const handleAssessmentChange = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    form.setValue('assessmentTemplateId', assessmentId);
    
    const assessment = activeAssessments.find((a) => a.id === assessmentId);
    if (assessment) {
      // Initialize entries for each assessment point across all subjects
      const newEntries: EntryState = {};
      assessment.subjects?.forEach((subject) => {
        subject.assessmentPoints?.forEach((point) => {
          const key = `${subject.id}:${point.id}`;
          newEntries[key] = {
            stars: 0,
            teacherNotes: '',
            aiRewrittenText: '',
          };
        });
        // Expand all subjects by default
        setExpandedSubjects((prev) => new Set([...prev, subject.id]));
      });
      setEntries(newEntries);
    }
  };

  const updateEntry = (subjectId: string, pointId: string, field: keyof EntryState[string], value: string | number) => {
    const key = `${subjectId}:${pointId}`;
    setEntries((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const openCreateDialog = () => {
    setSelectedStudentId('');
    setSelectedAssessmentId('');
    setEntries({});
    setExpandedSubjects(new Set());
    form.reset({
      studentId: '',
      assessmentTemplateId: '',
      term: 'Term 1 & 2',
    });
    setIsDialogOpen(true);
  };

  const simulateAIRewrite = (text: string, subjectId: string, pointId: string) => {
    if (!text.trim()) {
      toast.error('Please enter some notes first');
      return;
    }

    // Simulate AI rewrite (placeholder for actual AI integration)
    const tisaVoice = `${text.charAt(0).toUpperCase()}${text.slice(1)}. The student shows consistent effort and demonstrates a positive attitude towards learning. We encourage continued practice at home.`;
    
    updateEntry(subjectId, pointId, 'aiRewrittenText', tisaVoice);
    toast.success('Text rewritten in TISA voice!');
  };

  const onSubmit = (data: ReportFormValues) => {
    // Convert entries to array format
    const entryArray: ReportEntry[] = Object.entries(entries).map(([key, value]) => {
      const [subjectId, pointId] = key.split(':');
      return {
        assessmentPointId: pointId,
        subjectId,
        stars: value.stars,
        teacherNotes: value.teacherNotes,
        aiRewrittenText: value.aiRewrittenText,
      };
    });

    const newReport: StudentReport = {
      id: crypto.randomUUID(),
      studentId: data.studentId,
      assessmentTemplateId: data.assessmentTemplateId,
      schoolYearId: activeSchoolYearId!,
      term: data.term,
      entries: entryArray,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addReport(newReport);
    toast.success('Report saved successfully');
    setIsDialogOpen(false);
    form.reset();
    setEntries({});
  };

  const getGradeInfo = (gradeId: string) => grades.find((g) => g.id === gradeId);

  const availableAssessments = selectedStudent
    ? activeAssessments.filter((a) => a.gradeId === selectedStudent.gradeId)
    : [];

  const hasEntries = Object.keys(entries).length > 0;

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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Term 1">Term 1</SelectItem>
                              <SelectItem value="Term 2">Term 2</SelectItem>
                              <SelectItem value="Term 1 & 2">Term 1 & 2</SelectItem>
                              <SelectItem value="Term 3">Term 3</SelectItem>
                              <SelectItem value="Term 4">Term 4</SelectItem>
                              <SelectItem value="Term 3 & 4">Term 3 & 4</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Assessment Subjects & Points */}
                  {selectedAssessment && hasEntries && (
                    <div className="space-y-4">
                      <h3 className="font-display font-semibold">Assessment Subjects</h3>
                      {selectedAssessment.subjects?.map((subject) => (
                        <Collapsible
                          key={subject.id}
                          open={expandedSubjects.has(subject.id)}
                          onOpenChange={() => toggleSubject(subject.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                              <CardHeader className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    <div>
                                      <CardTitle className="text-base">{subject.name}</CardTitle>
                                      {subject.description && (
                                        <CardDescription>{subject.description}</CardDescription>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {subject.assessmentPoints?.length || 0} points
                                    </Badge>
                                    {expandedSubjects.has(subject.id) ? (
                                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-4 mt-2 space-y-3 border-l-2 border-primary/20 pl-4">
                              {subject.assessmentPoints?.map((point) => {
                                const key = `${subject.id}:${point.id}`;
                                const entry = entries[key];
                                
                                return (
                                  <motion.div
                                    key={point.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                  >
                                    <Card>
                                      <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-sm font-medium">
                                            {point.name}
                                          </CardTitle>
                                          <StarRating
                                            value={entry?.stars || 0}
                                            max={point.maxStars}
                                            onChange={(val) => updateEntry(subject.id, point.id, 'stars', val)}
                                            size="md"
                                          />
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div>
                                          <label className="mb-1.5 block text-sm text-muted-foreground">
                                            Teacher Notes
                                          </label>
                                          <Textarea
                                            placeholder="Enter your observations..."
                                            className="min-h-[60px]"
                                            value={entry?.teacherNotes || ''}
                                            onChange={(e) => updateEntry(subject.id, point.id, 'teacherNotes', e.target.value)}
                                          />
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => simulateAIRewrite(entry?.teacherNotes || '', subject.id, point.id)}
                                          >
                                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                                            Rewrite in TISA Voice
                                          </Button>
                                        </div>

                                        {entry?.aiRewrittenText && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                          >
                                            <label className="mb-1.5 flex items-center gap-2 text-sm">
                                              <Sparkles className="h-3.5 w-3.5 text-accent" />
                                              AI Rewritten (TISA Voice)
                                            </label>
                                            <Textarea
                                              className="min-h-[60px] bg-accent/5 border-accent/20"
                                              value={entry.aiRewrittenText}
                                              onChange={(e) => updateEntry(subject.id, point.id, 'aiRewrittenText', e.target.value)}
                                            />
                                          </motion.div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
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
                    <Button type="submit" disabled={!hasEntries} className="gap-2">
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
                          <span>{report.term}</span>
                          <span>{report.entries.length} entries</span>
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
