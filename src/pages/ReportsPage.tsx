import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, ChevronRight, ChevronDown, Sparkles, Save, Eye, BookOpen, MessageSquare } from 'lucide-react';
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
import type { StudentReport, ReportEntry, SubjectComment } from '@/types';

const reportFormSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  assessmentTemplateId: z.string().min(1, 'Please select an assessment'),
  term: z.string().default('Term 1 & 2'),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

// State for entries
interface EntryState {
  [key: string]: {
    stars: number;
    teacherNotes: string;
    aiRewrittenText: string;
  };
}

// State for subject comments
interface SubjectCommentState {
  [subjectId: string]: {
    teacherComment: string;
    aiRewrittenComment: string;
    attitudeTowardsLearning: 'Emerging' | 'Developing' | 'Applying' | 'Independent' | '';
  };
}

export default function ReportsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<EntryState>({});
  const [subjectComments, setSubjectComments] = useState<SubjectCommentState>({});
  const [generalComment, setGeneralComment] = useState('');
  const [viewingReport, setViewingReport] = useState<StudentReport | null>(null);
  const [generalCommentAI, setGeneralCommentAI] = useState('');

  const {
    reports,
    addReport,
    students,
    assessmentTemplates,
    grades,
    activeSchoolYearId,
  } = useAppStore();

  const activeStudents = students.filter((s) => s.schoolYearId === activeSchoolYearId);
  const activeAssessments = assessmentTemplates.filter(
    (a) => a.schoolYearId === activeSchoolYearId && !(a as any).isArchived
  );
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
    // Reset assessment when student changes
    setSelectedAssessmentId('');
    form.setValue('assessmentTemplateId', '');
    setEntries({});
    setSubjectComments({});
  };

  const handleAssessmentChange = (assessmentId: string) => {
    setSelectedAssessmentId(assessmentId);
    form.setValue('assessmentTemplateId', assessmentId);
    
    const assessment = activeAssessments.find((a) => a.id === assessmentId);
    if (assessment) {
      // Initialize entries for each assessment point - START WITH MAX STARS!
      const newEntries: EntryState = {};
      const newSubjectComments: SubjectCommentState = {};
      const expandedIds = new Set<string>();
      
      assessment.subjects?.forEach((subject) => {
        // Initialize subject comments
        newSubjectComments[subject.id] = {
          teacherComment: '',
          aiRewrittenComment: '',
          attitudeTowardsLearning: '',
        };
        
        subject.assessmentPoints?.forEach((point) => {
          const key = `${subject.id}:${point.id}`;
          newEntries[key] = {
            stars: point.maxStars, // START FULL!
            teacherNotes: '',
            aiRewrittenText: '',
          };
        });
        // Expand first subject by default
        if (expandedIds.size === 0) {
          expandedIds.add(subject.id);
        }
      });
      
      setEntries(newEntries);
      setSubjectComments(newSubjectComments);
      setExpandedSubjects(expandedIds);
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

  const updateSubjectComment = (
    subjectId: string,
    field: keyof SubjectCommentState[string],
    value: string
  ) => {
    setSubjectComments((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value,
      },
    }));
  };

  const openCreateDialog = () => {
    setSelectedStudentId('');
    setSelectedAssessmentId('');
    setEntries({});
    setSubjectComments({});
    setGeneralComment('');
    setGeneralCommentAI('');
    setExpandedSubjects(new Set());
    form.reset({
      studentId: '',
      assessmentTemplateId: '',
      term: 'Term 1 & 2',
    });
    setIsDialogOpen(true);
  };

  const simulateAIRewrite = (text: string, callback: (rewritten: string) => void) => {
    if (!text.trim()) {
      toast.error('Please enter some text first');
      return;
    }

    // Simulate AI rewrite (placeholder for actual AI integration)
    const tisaVoice = `${text.charAt(0).toUpperCase()}${text.slice(1)}. The student demonstrates consistent effort and maintains a positive attitude towards learning. We encourage continued practice at home to further develop these skills.`;
    
    callback(tisaVoice);
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

    // Convert subject comments to array
    const subjectCommentArray: SubjectComment[] = Object.entries(subjectComments)
      .filter(([_, value]) => value.teacherComment || value.attitudeTowardsLearning)
      .map(([subjectId, value]) => ({
        subjectId,
        teacherComment: value.teacherComment,
        aiRewrittenComment: value.aiRewrittenComment,
        attitudeTowardsLearning: value.attitudeTowardsLearning || undefined,
      }));

    const newReport: StudentReport = {
      id: crypto.randomUUID(),
      studentId: data.studentId,
      assessmentTemplateId: data.assessmentTemplateId,
      schoolYearId: activeSchoolYearId!,
      term: data.term,
      entries: entryArray,
      subjectComments: subjectCommentArray,
      generalComment: generalCommentAI || generalComment,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addReport(newReport);
    toast.success('Report saved successfully');
    setIsDialogOpen(false);
    form.reset();
    setEntries({});
    setSubjectComments({});
    setGeneralComment('');
    setGeneralCommentAI('');
  };

  const getGradeInfo = (gradeId: string) => grades.find((g) => g.id === gradeId);

  const availableAssessments = selectedStudent
    ? activeAssessments.filter((a) => a.gradeId === selectedStudent.gradeId)
    : [];

  const hasEntries = Object.keys(entries).length > 0;

  // Get intro text from template
  const introText = selectedAssessment ? (selectedAssessment as any).introText : '';

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
                  All stars start at maximum. Click to reduce rating. Use AI to polish comments.
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
                              {activeStudents.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                  No students found. Add students first.
                                </div>
                              ) : (
                                activeStudents.map((student) => {
                                  const grade = getGradeInfo(student.gradeId);
                                  const hasTemplate = activeAssessments.some(a => a.gradeId === student.gradeId);
                                  return (
                                    <SelectItem key={student.id} value={student.id}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="h-2 w-2 rounded-full"
                                          style={{ backgroundColor: grade ? `hsl(var(--grade-${grade.colorIndex}))` : undefined }}
                                        />
                                        {student.firstName} {student.lastName}
                                        {!hasTemplate && (
                                          <span className="text-xs text-muted-foreground">(no template)</span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })
                              )}
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

                  {/* Intro Text Preview */}
                  {introText && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="p-4">
                        <p className="text-sm italic text-muted-foreground">{introText}</p>
                      </CardContent>
                    </Card>
                  )}

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
                              {/* Assessment Points */}
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
                                            value={entry?.stars || point.maxStars}
                                            max={point.maxStars}
                                            onChange={(val) => updateEntry(subject.id, point.id, 'stars', val)}
                                            size="md"
                                          />
                                        </div>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div>
                                          <label className="mb-1.5 block text-sm text-muted-foreground">
                                            Teacher Notes (optional)
                                          </label>
                                          <Textarea
                                            placeholder="Enter your observations..."
                                            className="min-h-[60px]"
                                            value={entry?.teacherNotes || ''}
                                            onChange={(e) => updateEntry(subject.id, point.id, 'teacherNotes', e.target.value)}
                                          />
                                        </div>

                                        {entry?.teacherNotes && (
                                          <div className="flex items-center gap-2">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="gap-2"
                                              onClick={() => simulateAIRewrite(
                                                entry.teacherNotes,
                                                (rewritten) => updateEntry(subject.id, point.id, 'aiRewrittenText', rewritten)
                                              )}
                                            >
                                              <Sparkles className="h-3.5 w-3.5 text-accent" />
                                              AI Rewrite
                                            </Button>
                                          </div>
                                        )}

                                        {entry?.aiRewrittenText && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                          >
                                            <label className="mb-1.5 flex items-center gap-2 text-sm">
                                              <Sparkles className="h-3.5 w-3.5 text-accent" />
                                              AI Polished
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

                              {/* Subject Comment Section */}
                              <Card className="border-dashed bg-muted/30">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Subject Comment
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <label className="text-sm text-muted-foreground shrink-0">
                                      Attitude:
                                    </label>
                                    <Select
                                      value={subjectComments[subject.id]?.attitudeTowardsLearning || ''}
                                      onValueChange={(val) => updateSubjectComment(subject.id, 'attitudeTowardsLearning', val)}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Emerging">Emerging</SelectItem>
                                        <SelectItem value="Developing">Developing</SelectItem>
                                        <SelectItem value="Applying">Applying</SelectItem>
                                        <SelectItem value="Independent">Independent</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <Textarea
                                    placeholder="Overall comment for this subject..."
                                    className="min-h-[80px]"
                                    value={subjectComments[subject.id]?.teacherComment || ''}
                                    onChange={(e) => updateSubjectComment(subject.id, 'teacherComment', e.target.value)}
                                  />

                                  {subjectComments[subject.id]?.teacherComment && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => simulateAIRewrite(
                                          subjectComments[subject.id].teacherComment,
                                          (rewritten) => updateSubjectComment(subject.id, 'aiRewrittenComment', rewritten)
                                        )}
                                      >
                                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                                        AI Rewrite
                                      </Button>
                                    </div>
                                  )}

                                  {subjectComments[subject.id]?.aiRewrittenComment && (
                                    <Textarea
                                      className="min-h-[80px] bg-accent/5 border-accent/20"
                                      value={subjectComments[subject.id].aiRewrittenComment}
                                      onChange={(e) => updateSubjectComment(subject.id, 'aiRewrittenComment', e.target.value)}
                                    />
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}

                      {/* General Comment */}
                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            General Comment
                          </CardTitle>
                          <CardDescription>
                            Overall feedback for the student's report
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Textarea
                            placeholder="Write your overall feedback for the student..."
                            className="min-h-[100px]"
                            value={generalComment}
                            onChange={(e) => setGeneralComment(e.target.value)}
                          />

                          {generalComment && (
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => simulateAIRewrite(generalComment, setGeneralCommentAI)}
                              >
                                <Sparkles className="h-3.5 w-3.5 text-accent" />
                                AI Rewrite
                              </Button>
                            </div>
                          )}

                          {generalCommentAI && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                            >
                              <label className="mb-1.5 flex items-center gap-2 text-sm">
                                <Sparkles className="h-3.5 w-3.5 text-accent" />
                                AI Polished Version
                              </label>
                              <Textarea
                                className="min-h-[100px] bg-accent/5 border-accent/20"
                                value={generalCommentAI}
                                onChange={(e) => setGeneralCommentAI(e.target.value)}
                              />
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {!selectedAssessment && selectedStudentId && (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Select an assessment to fill out the report
                      </CardContent>
                    </Card>
                  )}

                  {activeStudents.length === 0 && (
                    <Card className="border-dashed border-destructive/50">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No students found. Add students in the Students page first.
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2"
                            onClick={() => setViewingReport(report)}
                          >
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

        {/* View Report Dialog */}
        <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {viewingReport && (() => {
              const reportStudent = students.find((s) => s.id === viewingReport.studentId);
              const reportAssessment = assessmentTemplates.find((a) => a.id === viewingReport.assessmentTemplateId);
              const reportGrade = reportStudent ? getGradeInfo(reportStudent.gradeId) : null;
              const { appSettings } = useAppStore.getState();

              return (
                <>
                  {/* Report Header */}
                  <div className="text-center border-b pb-4">
                    <h2 className="font-display text-lg font-bold uppercase tracking-wide">
                      {viewingReport.reportTitle || 'STUDENT PROGRESS REPORT'} — {viewingReport.term}
                    </h2>
                    {(viewingReport.periodStart || viewingReport.periodEnd) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Period: {viewingReport.periodStart} - {viewingReport.periodEnd}
                      </p>
                    )}
                  </div>

                  <div className="space-y-6 py-4">
                    {/* Student Information */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Student Information</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm bg-muted/30 rounded-lg p-3">
                        <div><span className="text-muted-foreground">Full Name:</span> <strong>{reportStudent?.firstName} {reportStudent?.lastName}</strong></div>
                        {reportStudent?.nameUsed && (
                          <div><span className="text-muted-foreground">Name Used:</span> <strong>{reportStudent.nameUsed}</strong></div>
                        )}
                        <div><span className="text-muted-foreground">Grade Level:</span> <strong>{reportGrade?.name}</strong></div>
                        {reportStudent?.dateOfBirth && (
                          <div><span className="text-muted-foreground">Date of Birth:</span> <strong>{new Date(reportStudent.dateOfBirth).toLocaleDateString('en-GB')}</strong></div>
                        )}
                      </div>
                    </div>

                    {/* Teacher Information */}
                    {reportGrade?.teacherAssignments && reportGrade.teacherAssignments.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Teacher Information</h3>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                          {reportGrade.classroomTeacher && (
                            <div className="text-sm"><span className="text-muted-foreground">Classroom Teacher:</span> <strong>{reportGrade.classroomTeacher}</strong></div>
                          )}
                          {reportGrade.teacherAssignments.filter(a => a.category === 'core').length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">CORE PROGRAMME</p>
                              <div className="grid grid-cols-2 gap-1 text-sm">
                                {reportGrade.teacherAssignments.filter(a => a.category === 'core').map((a) => (
                                  <div key={a.id}><span className="text-muted-foreground">{a.subject}:</span> {a.teacher}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {reportGrade.teacherAssignments.filter(a => a.category === 'professional').length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">PROFESSIONAL TRACKS</p>
                              <div className="grid grid-cols-2 gap-1 text-sm">
                                {reportGrade.teacherAssignments.filter(a => a.category === 'professional').map((a) => (
                                  <div key={a.id}><span className="text-muted-foreground">{a.subject}:</span> {a.teacher}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* School Mission */}
                    {appSettings.missionStatement && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Our Mission</h3>
                        <p className="text-sm text-muted-foreground italic">{appSettings.missionStatement}</p>
                        {appSettings.values.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {appSettings.values.map((value, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{value}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grading Key */}
                    {appSettings.gradingKey && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-1">Grading Key</h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-line">{appSettings.gradingKey}</p>
                      </div>
                    )}

                    {/* Subjects and Assessment Points */}
                    {reportAssessment?.subjects.map((subject) => {
                      const subjectEntries = viewingReport.entries.filter((e) => e.subjectId === subject.id);
                      const subjectComment = viewingReport.subjectComments?.find((c) => c.subjectId === subject.id);

                      return (
                        <div key={subject.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{subject.name}</h3>
                            {subjectComment?.attitudeTowardsLearning && (
                              <Badge variant="outline" className="text-xs">
                                {subjectComment.attitudeTowardsLearning}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            {subject.assessmentPoints.map((point) => {
                              const entry = subjectEntries.find((e) => e.assessmentPointId === point.id);
                              return (
                                <div key={point.id} className="flex items-start justify-between gap-4 py-1">
                                  <span className="text-sm text-muted-foreground flex-1">{point.name}</span>
                                  <StarRating value={entry?.stars || 0} max={point.maxStars} readonly size="sm" />
                                </div>
                              );
                            })}
                          </div>

                          {(subjectComment?.teacherComment || subjectComment?.aiRewrittenComment) && (
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                Comment
                              </div>
                              <p className="text-foreground">{subjectComment.aiRewrittenComment || subjectComment.teacherComment}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {viewingReport.generalComment && (
                      <div className="border-t pt-4">
                        <h3 className="font-semibold text-foreground mb-2">General Comment</h3>
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground">{viewingReport.generalComment}</div>
                      </div>
                    )}

                    <div className="border-t pt-4 text-xs text-muted-foreground flex items-center justify-between">
                      <span>Created: {new Date(viewingReport.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(viewingReport.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setViewingReport(null)}>Close</Button>
                  </DialogFooter>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
