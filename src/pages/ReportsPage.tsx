import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, ChevronRight, ChevronDown, Sparkles, Save, Eye, BookOpen, MessageSquare, Star, Link, Check, Copy, Pencil, Filter, User, UserCircle, GraduationCap, Calendar, Users, Briefcase, Target, Heart, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
import { ExamResultsSection } from '@/components/reports/ExamResultsSection';
import { SignatureSection } from '@/components/reports/SignatureSection';
import { ExamResultsDisplay } from '@/components/reports/ExamResultsDisplay';
import { SignatureDisplay } from '@/components/reports/SignatureDisplay';
import { toast } from 'sonner';
import type { StudentReport, ReportEntry, SubjectComment, ExamResult, ReportSignature } from '@/types';
import tisaLogo from '@/assets/tisa_logo.png';

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
    isNA: boolean;
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
    examGrade: string;  // "A+", "A", "B+", etc.
    examDate: string;   // "12/2025" format
  };
}

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export default function ReportsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<EntryState>({});
  const [subjectComments, setSubjectComments] = useState<SubjectCommentState>({});
  const [generalComment, setGeneralComment] = useState('');
  const [viewingReport, setViewingReport] = useState<StudentReport | null>(null);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [generalCommentAI, setGeneralCommentAI] = useState('');
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [signatures, setSignatures] = useState<ReportSignature>({});
  const [starFilters, setStarFilters] = useState({ oneStar: false, twoStars: false, threeStars: false, comments: false });
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAILoading, setIsAILoading] = useState<{ [key: string]: boolean }>({});

  const {
    reports,
    addReport,
    updateReport,
    students,
    assessmentTemplates,
    grades,
    activeSchoolYearId,
    appSettings,
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
        // Initialize subject comments with today's date
        const today = new Date();
        const todayFormatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        
        newSubjectComments[subject.id] = {
          teacherComment: '',
          aiRewrittenComment: '',
          attitudeTowardsLearning: '',
          examGrade: '',
          examDate: todayFormatted,
        };
        
        subject.assessmentPoints?.forEach((point) => {
          const key = `${subject.id}:${point.id}`;
          newEntries[key] = {
            stars: point.maxStars, // START FULL!
            isNA: false,
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

  const updateEntry = (subjectId: string, pointId: string, field: keyof EntryState[string], value: string | number | boolean) => {
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
    setExamResults([]);
    setSignatures({});
    setExpandedSubjects(new Set());
    setEditingReportId(null);
    form.reset({
      studentId: '',
      assessmentTemplateId: '',
      term: 'Term 1 & 2',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (report: StudentReport) => {
    const assessment = assessmentTemplates.find(a => a.id === report.assessmentTemplateId);
    
    // Restore entries
    const restoredEntries: EntryState = {};
    report.entries.forEach((entry) => {
      const key = `${entry.subjectId}:${entry.assessmentPointId}`;
      restoredEntries[key] = {
        stars: entry.stars,
        isNA: entry.isNA || false,
        teacherNotes: entry.teacherNotes || '',
        aiRewrittenText: entry.aiRewrittenText || '',
      };
    });

    // Restore subject comments
    const restoredSubjectComments: SubjectCommentState = {};
    assessment?.subjects?.forEach((subject) => {
      const existingComment = report.subjectComments?.find(c => c.subjectId === subject.id);
      restoredSubjectComments[subject.id] = {
        teacherComment: existingComment?.teacherComment || '',
        aiRewrittenComment: existingComment?.aiRewrittenComment || '',
        attitudeTowardsLearning: existingComment?.attitudeTowardsLearning || '',
        examGrade: '',
        examDate: '',
      };
    });

    setSelectedStudentId(report.studentId);
    setSelectedAssessmentId(report.assessmentTemplateId);
    setEntries(restoredEntries);
    setSubjectComments(restoredSubjectComments);
    setGeneralComment(report.generalComment || '');
    setGeneralCommentAI('');
    setExamResults(report.examResults || []);
    setSignatures(report.signatures || {});
    setExpandedSubjects(new Set(assessment?.subjects?.map(s => s.id) || []));
    setEditingReportId(report.id);
    
    form.reset({
      studentId: report.studentId,
      assessmentTemplateId: report.assessmentTemplateId,
      term: report.term,
    });
    setIsDialogOpen(true);
  };


  const callAIRewrite = async (text: string, loadingKey: string, callback: (rewritten: string) => void) => {
    if (!text.trim()) {
      toast.error('Please enter some text first');
      return;
    }

    setIsAILoading(prev => ({ ...prev, [loadingKey]: true }));

    try {
      // Default to lovable if not set
      const provider = appSettings.aiProvider || 'lovable';
      
      // Determine which API key to use based on provider
      let customApiKey = '';
      if (provider === 'openai') {
        customApiKey = appSettings.openaiApiKey || '';
      } else if (provider === 'google') {
        customApiKey = appSettings.googleApiKey || '';
      } else if (provider === 'anthropic') {
        customApiKey = appSettings.anthropicApiKey || '';
      }

      // Check if custom provider is selected but no API key provided
      if (provider !== 'lovable' && !customApiKey) {
        toast.error(`Please add your ${provider} API key in Settings`);
        setIsAILoading(prev => ({ ...prev, [loadingKey]: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-rewrite', {
        body: {
          text,
          styleGuide: appSettings.companyWritingStyle,
          provider,
          customApiKey: customApiKey || undefined,
        },
      });

      if (error) {
        console.error('AI rewrite error:', error);
        toast.error('Failed to rewrite text. Please try again.');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.rewrittenText) {
        callback(data.rewrittenText);
        toast.success('Text rewritten by AI!');
      }
    } catch (err) {
      console.error('AI rewrite error:', err);
      toast.error('Failed to connect to AI. Please try again.');
    } finally {
      setIsAILoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const acceptAIRewrite = (key: string, aiText: string) => {
    // Replace the teacher notes with the AI rewritten version
    const [subjectId, pointId] = key.split(':');
    updateEntry(subjectId, pointId, 'teacherNotes', aiText);
    updateEntry(subjectId, pointId, 'aiRewrittenText', ''); // Clear AI field after accepting
    toast.success('AI text accepted!');
  };

  const acceptSubjectAIComment = (subjectId: string, aiText: string) => {
    updateSubjectComment(subjectId, 'teacherComment', aiText);
    updateSubjectComment(subjectId, 'aiRewrittenComment', ''); // Clear AI field after accepting
    toast.success('AI comment accepted!');
  };

  const acceptGeneralAIComment = () => {
    setGeneralComment(generalCommentAI);
    setGeneralCommentAI(''); // Clear AI field after accepting
    toast.success('AI comment accepted!');
  };

  const onSubmit = (data: ReportFormValues) => {
    // Convert entries to array format
    const entryArray: ReportEntry[] = Object.entries(entries).map(([key, value]) => {
      const [subjectId, pointId] = key.split(':');
      return {
        assessmentPointId: pointId,
        subjectId,
        stars: value.stars,
        isNA: value.isNA || undefined,
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

    // Auto-generate exam results from subject grades
    const generatedExamResults: ExamResult[] = Object.entries(subjectComments)
      .filter(([_, value]) => value.examGrade)
      .map(([subjectId, value]) => {
        const subject = selectedAssessment?.subjects?.find(s => s.id === subjectId);
        const subjectName = subject?.name || '';
        // Extract term from subject name (e.g., "English - Term 1" -> "Term 1")
        const termMatch = subjectName.match(/Term\s*\d/i);
        const term = termMatch ? termMatch[0] : 'Term 1';
        // Clean subject name (remove term)
        const cleanSubjectName = subjectName.replace(/\s*-\s*Term\s*\d/i, '').trim();
        
        return {
          id: crypto.randomUUID(),
          term,
          date: value.examDate,
          title: 'Assessment of term skills',
          subject: cleanSubjectName,
          grade: value.examGrade,
        };
      });

    const newReport: StudentReport = {
      id: crypto.randomUUID(),
      studentId: data.studentId,
      assessmentTemplateId: data.assessmentTemplateId,
      schoolYearId: activeSchoolYearId!,
      term: data.term,
      entries: entryArray,
      subjectComments: subjectCommentArray,
      generalComment: generalCommentAI || generalComment,
      examResults: [...examResults, ...generatedExamResults],
      signatures: signatures,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingReportId) {
      // Update existing report
      updateReport(editingReportId, {
        ...newReport,
        id: editingReportId,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Report updated successfully');
    } else {
      addReport(newReport);
      toast.success('Report saved successfully');
    }
    
    setIsDialogOpen(false);
    setEditingReportId(null);
    form.reset();
    setEntries({});
    setSubjectComments({});
    setGeneralComment('');
    setGeneralCommentAI('');
    setExamResults([]);
    setSignatures({});
  };

  const getGradeInfo = (gradeId: string) => grades.find((g) => g.id === gradeId);

  const availableAssessments = selectedStudent
    ? activeAssessments.filter((a) => a.gradeId === selectedStudent.gradeId)
    : [];

  const hasEntries = Object.keys(entries).length > 0;

  // Compute exam results in real-time from subject comments
  const computedExamResults = useMemo(() => {
    // Generate exam results from current subjectComments
    const generated: ExamResult[] = Object.entries(subjectComments)
      .filter(([_, value]) => value.examGrade)
      .map(([subjectId, value]) => {
        const subject = selectedAssessment?.subjects?.find(s => s.id === subjectId);
        const subjectName = subject?.name || '';
        const termMatch = subjectName.match(/Term\s*\d/i);
        const term = termMatch ? termMatch[0] : 'Term 1';
        const cleanSubjectName = subjectName.replace(/\s*-\s*Term\s*\d/i, '').trim();
        
        return {
          id: `gen-${subjectId}`,
          term,
          date: value.examDate,
          title: 'Assessment of term skills',
          subject: cleanSubjectName,
          grade: value.examGrade,
        };
      });
    
    // Combine with manually added results
    return [...examResults, ...generated];
  }, [subjectComments, selectedAssessment, examResults]);

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
                                            isNA={entry?.isNA || false}
                                            onNAChange={(val) => updateEntry(subject.id, point.id, 'isNA', val)}
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
                                              disabled={isAILoading[key]}
                                              onClick={() => callAIRewrite(
                                                entry.teacherNotes,
                                                key,
                                                (rewritten) => updateEntry(subject.id, point.id, 'aiRewrittenText', rewritten)
                                              )}
                                            >
                                              {isAILoading[key] ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                              ) : (
                                                <Sparkles className="h-3.5 w-3.5 text-accent" />
                                              )}
                                              {isAILoading[key] ? 'Rewriting...' : 'AI Rewrite'}
                                            </Button>
                                          </div>
                                        )}

                                        {entry?.aiRewrittenText && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-2"
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
                                            <Button
                                              type="button"
                                              variant="default"
                                              size="sm"
                                              className="gap-2"
                                              onClick={() => acceptAIRewrite(key, entry.aiRewrittenText)}
                                            >
                                              <Check className="h-3.5 w-3.5" />
                                              Accept AI Version
                                            </Button>
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
                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm text-muted-foreground shrink-0">
                                        Attitude:
                                      </label>
                                      <Select
                                        value={subjectComments[subject.id]?.attitudeTowardsLearning || ''}
                                        onValueChange={(val) => updateSubjectComment(subject.id, 'attitudeTowardsLearning', val)}
                                      >
                                        <SelectTrigger className="w-[140px]">
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
                                    
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm text-muted-foreground shrink-0">
                                        Grade:
                                      </label>
                                      <Select
                                        value={subjectComments[subject.id]?.examGrade || ''}
                                        onValueChange={(val) => updateSubjectComment(subject.id, 'examGrade', val)}
                                      >
                                        <SelectTrigger className="w-[90px]">
                                          <SelectValue placeholder="Grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {GRADE_OPTIONS.map((grade) => (
                                            <SelectItem key={grade} value={grade}>
                                              {grade}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm text-muted-foreground shrink-0">
                                        Date:
                                      </label>
                                      <input
                                        type="text"
                                        className="w-[90px] px-2 py-1 text-sm border rounded-md bg-background"
                                        placeholder="MM/YYYY"
                                        value={subjectComments[subject.id]?.examDate || ''}
                                        onChange={(e) => updateSubjectComment(subject.id, 'examDate', e.target.value)}
                                      />
                                    </div>
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
                                        disabled={isAILoading[`subject-${subject.id}`]}
                                        onClick={() => callAIRewrite(
                                          subjectComments[subject.id].teacherComment,
                                          `subject-${subject.id}`,
                                          (rewritten) => updateSubjectComment(subject.id, 'aiRewrittenComment', rewritten)
                                        )}
                                      >
                                        {isAILoading[`subject-${subject.id}`] ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Sparkles className="h-3.5 w-3.5 text-accent" />
                                        )}
                                        {isAILoading[`subject-${subject.id}`] ? 'Rewriting...' : 'AI Rewrite'}
                                      </Button>
                                    </div>
                                  )}

                                  {subjectComments[subject.id]?.aiRewrittenComment && (
                                    <div className="space-y-2">
                                      <Textarea
                                        className="min-h-[80px] bg-accent/5 border-accent/20"
                                        value={subjectComments[subject.id].aiRewrittenComment}
                                        onChange={(e) => updateSubjectComment(subject.id, 'aiRewrittenComment', e.target.value)}
                                      />
                                      <Button
                                        type="button"
                                        variant="default"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => acceptSubjectAIComment(subject.id, subjectComments[subject.id].aiRewrittenComment)}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                        Accept AI Version
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}

                      {/* Exam Results Summary Section */}
                      <ExamResultsSection
                        examResults={computedExamResults}
                        onUpdate={(id, updates) => {
                          if (id.startsWith('gen-')) {
                            // Update in subjectComments for generated results
                            const subjectId = id.replace('gen-', '');
                            if (updates.grade !== undefined) {
                              updateSubjectComment(subjectId, 'examGrade', updates.grade);
                            }
                          } else {
                            // Update manually added results
                            setExamResults(examResults.map(e => e.id === id ? { ...e, ...updates } : e));
                          }
                        }}
                        onDelete={(id) => {
                          if (id.startsWith('gen-')) {
                            // Clear grade in subjectComments for generated results
                            const subjectId = id.replace('gen-', '');
                            updateSubjectComment(subjectId, 'examGrade', '');
                          } else {
                            // Delete manually added results
                            setExamResults(examResults.filter(e => e.id !== id));
                          }
                        }}
                      />

                      {/* Signature Section */}
                      <SignatureSection
                        signatures={signatures}
                        classroomTeacherName={selectedStudent ? grades.find(g => g.id === selectedStudent.gradeId)?.classroomTeacher : ''}
                        onSign={(role, name) => setSignatures({ ...signatures, [role]: { name, signedAt: new Date().toISOString() } })}
                      />

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
                                disabled={isAILoading['general']}
                                onClick={() => callAIRewrite(generalComment, 'general', setGeneralCommentAI)}
                              >
                                {isAILoading['general'] ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                                )}
                                {isAILoading['general'] ? 'Rewriting...' : 'AI Rewrite'}
                              </Button>
                            </div>
                          )}

                          {generalCommentAI && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-2"
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
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="gap-2"
                                onClick={acceptGeneralAIComment}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Accept AI Version
                              </Button>
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2"
                            onClick={() => openEditDialog(report)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
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

        {/* View Report Dialog - TISA Style */}
        <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
            {viewingReport && (() => {
              const reportStudent = students.find((s) => s.id === viewingReport.studentId);
              const reportAssessment = assessmentTemplates.find((a) => a.id === viewingReport.assessmentTemplateId);
              const reportGrade = reportStudent ? getGradeInfo(reportStudent.gradeId) : null;
              const { appSettings } = useAppStore.getState();

              return (
                <div className="bg-card rounded-2xl overflow-hidden shadow-xl">
                  {/* Premium Hero Header - Netflix/Apple Style */}
                  <div className="relative bg-gradient-to-r from-tisa-purple via-tisa-purple/80 to-tisa-blue p-8 overflow-hidden">
                    {/* Background glow effects */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-tisa-purple/30 rounded-full blur-2xl" />
                    
                    <div className="relative flex items-center gap-6">
                      {/* Student Photo - Larger with glow */}
                      <div className="flex-shrink-0">
                        {reportStudent?.avatarUrl ? (
                          <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/90 shadow-2xl ring-4 ring-white/20">
                            <img 
                              src={reportStudent.avatarUrl} 
                              alt={`${reportStudent.firstName} ${reportStudent.lastName}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-white/20 border-4 border-white/90 flex items-center justify-center shadow-2xl ring-4 ring-white/20 backdrop-blur-sm">
                            <span className="text-2xl font-bold text-white">
                              {reportStudent?.firstName?.[0]}{reportStudent?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Title Section with enhanced typography */}
                      <div className="text-left flex-1 space-y-2">
                        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-white drop-shadow-lg">
                          {viewingReport.reportTitle || 'STUDENT PROGRESS REPORT'}
                        </h1>
                        <div className="flex items-center gap-3">
                          <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                            {viewingReport.term}
                          </span>
                          {(viewingReport.periodStart || viewingReport.periodEnd) && (
                            <span className="text-white/80 text-sm">
                              {viewingReport.periodStart} — {viewingReport.periodEnd}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions - refined styling */}
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105"
                          onClick={() => {
                            const { updateReportShareToken } = useAppStore.getState();
                            let token = viewingReport.shareToken;
                            
                            if (!token) {
                              token = crypto.randomUUID();
                              updateReportShareToken(viewingReport.id, token);
                            }
                            
                            const shareUrl = `${window.location.origin}/report/${token}`;
                            navigator.clipboard.writeText(shareUrl);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                            toast.success('Link copied!');
                          }}
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedLink ? 'Copied!' : 'Copy Link'}
                        </Button>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 shadow-lg">
                          <img src={tisaLogo} alt="TISA Logo" className="h-16 w-auto" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Student & Teacher Info - Side by Side Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Student Information Card - Full Width, No Header */}
                      <div className="lg:col-span-2 bg-gradient-to-br from-background to-muted/30 rounded-2xl shadow-lg p-5 border border-border/50 transition-all duration-300 hover:shadow-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-tisa-blue/10 rounded-xl">
                              <UserCircle className="h-5 w-5 text-tisa-blue" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Full Name</p>
                              <p className="font-semibold text-sm">{reportStudent?.firstName} {reportStudent?.lastName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-tisa-purple/10 rounded-xl">
                              <Sparkles className="h-5 w-5 text-tisa-purple" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Name Used</p>
                              <p className="font-medium text-sm">{reportStudent?.nameUsed || '-'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-tisa-blue/10 rounded-xl">
                              <GraduationCap className="h-5 w-5 text-tisa-blue" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Grade Level</p>
                              <p className="font-medium text-sm">{reportGrade?.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-tisa-purple/10 rounded-xl">
                              <Calendar className="h-5 w-5 text-tisa-purple" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Date of Birth</p>
                              <p className="font-medium text-sm">
                                {reportStudent?.dateOfBirth 
                                  ? new Date(reportStudent.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Teacher Information Card */}
                      {(reportGrade?.classroomTeacher || (reportGrade?.teacherAssignments && reportGrade.teacherAssignments.length > 0)) && (
                        <div className="bg-gradient-to-br from-background to-muted/30 rounded-2xl shadow-lg p-6 border border-border/50 transition-all duration-300 hover:shadow-xl">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-tisa-purple/10 rounded-xl">
                              <Users className="h-5 w-5 text-tisa-purple" />
                            </div>
                            <h3 className="font-semibold text-lg">Teacher Information</h3>
                          </div>
                          <div className="space-y-4">
                            {/* Core Programme */}
                            {((reportGrade.classroomTeacher) || (reportGrade.teacherAssignments && reportGrade.teacherAssignments.filter(a => a.category === 'core').length > 0)) && (
                              <div>
                                <p className="text-xs font-semibold text-tisa-purple uppercase tracking-wide mb-2 flex items-center gap-2">
                                  <BookOpen className="h-3.5 w-3.5" />
                                  Core Programme
                                </p>
                                <div className="space-y-2 pl-5">
                                  {reportGrade.classroomTeacher && (
                                    <div className="flex justify-between items-center py-1.5 border-b border-border/50">
                                      <span className="text-sm text-muted-foreground">Classroom Teacher</span>
                                      <span className="text-sm font-medium">{reportGrade.classroomTeacher}</span>
                                    </div>
                                  )}
                                  {reportGrade.teacherAssignments?.filter(a => a.category === 'core').map((a) => (
                                    <div key={a.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                                      <span className="text-sm text-muted-foreground">{a.subject}</span>
                                      <span className="text-sm font-medium">{a.teacher}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Professional Tracks */}
                            {reportGrade?.teacherAssignments && reportGrade.teacherAssignments.filter(a => a.category === 'professional').length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-tisa-blue uppercase tracking-wide mb-2 flex items-center gap-2">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  Professional Tracks
                                </p>
                                <div className="space-y-2 pl-5">
                                  {reportGrade.teacherAssignments.filter(a => a.category === 'professional').map((a) => (
                                    <div key={a.id} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                                      <span className="text-sm text-muted-foreground">{a.subject}</span>
                                      <span className="text-sm font-medium">{a.teacher}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* School Mission, Vision & Values - 2x2 Grid */}
                    {(appSettings.missionStatement || appSettings.vision || appSettings.statement || appSettings.values.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {appSettings.missionStatement && (
                          <div className="bg-gradient-to-br from-tisa-purple/5 to-background rounded-2xl shadow-lg p-5 border border-tisa-purple/20 transition-all duration-300 hover:shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-tisa-purple/10 rounded-lg">
                                <Target className="h-4 w-4 text-tisa-purple" />
                              </div>
                              <h4 className="font-semibold text-tisa-purple text-sm uppercase tracking-wide">Our Mission</h4>
                            </div>
                            <p className="text-sm text-foreground/80 italic leading-relaxed">{appSettings.missionStatement}</p>
                          </div>
                        )}
                        {appSettings.vision && (
                          <div className="bg-gradient-to-br from-tisa-blue/5 to-background rounded-2xl shadow-lg p-5 border border-tisa-blue/20 transition-all duration-300 hover:shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-tisa-blue/10 rounded-lg">
                                <Eye className="h-4 w-4 text-tisa-blue" />
                              </div>
                              <h4 className="font-semibold text-tisa-blue text-sm uppercase tracking-wide">Our Vision</h4>
                            </div>
                            <ul className="text-sm text-foreground/80 leading-relaxed space-y-1.5">
                              {appSettings.vision.split(/[•;]/).filter(v => v.trim()).map((point, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-tisa-blue mt-0.5">•</span>
                                  <span>{point.trim()}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {appSettings.statement && (
                          <div className="bg-gradient-to-br from-muted/30 to-background rounded-2xl shadow-lg p-5 border border-border/50 transition-all duration-300 hover:shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-muted rounded-lg">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <h4 className="font-semibold text-sm uppercase tracking-wide">Statement</h4>
                            </div>
                            <p className="text-sm text-foreground/80 whitespace-pre-line">{appSettings.statement}</p>
                          </div>
                        )}
                        {appSettings.values.length > 0 && (
                          <div className="bg-gradient-to-br from-tisa-purple/5 via-background to-tisa-blue/5 rounded-2xl shadow-lg p-5 border border-tisa-purple/20 transition-all duration-300 hover:shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-gradient-to-r from-tisa-purple/10 to-tisa-blue/10 rounded-lg">
                                <Heart className="h-4 w-4 text-tisa-purple" />
                              </div>
                              <h4 className="font-semibold text-tisa-purple text-sm uppercase tracking-wide">Our Values</h4>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4">
                              {appSettings.values.map((value, i) => (
                                <span 
                                  key={i} 
                                  className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-tisa-purple to-tisa-blue text-white shadow-sm transition-transform duration-200 hover:scale-105"
                                >
                                  {value}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Grading Key - Compact Elegant Card */}
                    {appSettings.gradingKey && (
                      <div className="bg-gradient-to-r from-star-filled/5 via-background to-star-filled/10 rounded-2xl shadow-lg p-5 border border-star-filled/20">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-star-filled/10 rounded-xl">
                              <Star className="h-5 w-5 text-star-filled fill-star-filled" />
                            </div>
                            <h4 className="font-semibold">Learner Profile - Grading Key</h4>
                          </div>
                          <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full shadow-sm">
                              <span className="text-star-filled">⭐⭐⭐</span>
                              <span className="text-muted-foreground font-medium">Mostly</span>
                            </div>
                            <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full shadow-sm">
                              <span className="text-star-filled">⭐⭐</span>
                              <span className="text-muted-foreground font-medium">Usually</span>
                            </div>
                            <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full shadow-sm">
                              <span className="text-star-filled">⭐</span>
                              <span className="text-muted-foreground font-medium">Rarely</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subjects Filter Buttons */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Subject Assessments</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={starFilters.oneStar ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStarFilters(prev => ({ ...prev, oneStar: !prev.oneStar }))}
                          className="h-8 px-3 gap-1"
                        >
                          <Star className="h-3.5 w-3.5 fill-star-filled text-star-filled" />
                          <span className="text-xs">1</span>
                        </Button>
                        <Button
                          variant={starFilters.twoStars ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStarFilters(prev => ({ ...prev, twoStars: !prev.twoStars }))}
                          className="h-8 px-3 gap-1"
                        >
                          <Star className="h-3.5 w-3.5 fill-star-filled text-star-filled" />
                          <span className="text-xs">2</span>
                        </Button>
                        <Button
                          variant={starFilters.threeStars ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStarFilters(prev => ({ ...prev, threeStars: !prev.threeStars }))}
                          className="h-8 px-3 gap-1"
                        >
                          <Star className="h-3.5 w-3.5 fill-star-filled text-star-filled" />
                          <span className="text-xs">3</span>
                        </Button>
                        <Button
                          variant={starFilters.comments ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStarFilters(prev => ({ ...prev, comments: !prev.comments }))}
                          className="h-8 px-3 gap-1.5"
                        >
                          <Filter className="h-3.5 w-3.5" />
                          <span className="text-xs">Comments</span>
                        </Button>
                      </div>
                    </div>

                    {/* Subjects and Assessment Points */}
                    {reportAssessment?.subjects
                      .filter((subject) => {
                        const noFiltersActive = !starFilters.oneStar && !starFilters.twoStars && !starFilters.threeStars && !starFilters.comments;
                        if (noFiltersActive) return true;
                        
                        const subjectEntries = viewingReport.entries.filter((e) => e.subjectId === subject.id);
                        
                        const hasOneStar = starFilters.oneStar && subjectEntries.some(e => e.stars === 1);
                        const hasTwoStars = starFilters.twoStars && subjectEntries.some(e => e.stars === 2);
                        const hasThreeStars = starFilters.threeStars && subjectEntries.some(e => e.stars === 3);
                        
                        const subjectComment = viewingReport.subjectComments?.find((c) => c.subjectId === subject.id);
                        const hasComment = starFilters.comments && (subjectComment?.teacherComment || subjectComment?.aiRewrittenComment || subjectEntries.some((e) => e.teacherNotes || e.aiRewrittenText));
                        
                        return hasOneStar || hasTwoStars || hasThreeStars || hasComment;
                      })
                      .map((subject) => {
                        const subjectEntries = viewingReport.entries.filter((e) => e.subjectId === subject.id);
                        const subjectComment = viewingReport.subjectComments?.find((c) => c.subjectId === subject.id);

                        return (
                          <div key={subject.id} className="overflow-hidden rounded-lg border border-border">
                            <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide flex items-center justify-between">
                              <span>{subject.name}</span>
                              {subjectComment?.attitudeTowardsLearning && (
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                                  {subjectComment.attitudeTowardsLearning}
                                </span>
                              )}
                            </div>
                            <div className="divide-y divide-border">
                              {subject.assessmentPoints.map((point, idx) => {
                                const entry = subjectEntries.find((e) => e.assessmentPointId === point.id);
                                return (
                                  <div 
                                    key={point.id} 
                                    className={`flex items-center justify-between px-4 py-2 ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}
                                  >
                                    <span className="text-sm text-foreground">{point.name}</span>
                                    <StarRating value={entry?.stars || 0} max={point.maxStars} readonly size="sm" isNA={entry?.isNA} />
                                  </div>
                                );
                              })}
                            </div>
                            {(subjectComment?.teacherComment || subjectComment?.aiRewrittenComment) && (
                              <div className="border-t border-border bg-muted/30 px-4 py-3">
                                <div className="flex items-center gap-2 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  <MessageSquare className="h-3 w-3" />
                                  Teacher Comment
                                </div>
                                <p className="text-sm text-foreground">{subjectComment.aiRewrittenComment || subjectComment.teacherComment}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                    {/* Tests and Exams Results */}
                    {viewingReport.examResults && viewingReport.examResults.length > 0 && (
                      <ExamResultsDisplay examResults={viewingReport.examResults} />
                    )}

                    {/* General Comment */}
                    {viewingReport.generalComment && (
                      <div className="overflow-hidden rounded-lg border border-border">
                        <div className="bg-tisa-purple text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
                          General Comment
                        </div>
                        <div className="p-4 bg-card">
                          <p className="text-sm text-foreground leading-relaxed">{viewingReport.generalComment}</p>
                        </div>
                      </div>
                    )}

                    {/* Signatures */}
                    <SignatureDisplay
                      signatures={viewingReport.signatures}
                      classroomTeacherName={(() => {
                        const { grades, students } = useAppStore.getState();
                        const student = students.find(s => s.id === viewingReport.studentId);
                        const grade = grades.find(g => g.id === student?.gradeId);
                        return grade?.classroomTeacher || '';
                      })()}
                      headOfSchoolName="Karina Medvedeva"
                    />

                    {/* Footer */}
                    <div className="border-t border-border pt-4 text-xs text-muted-foreground flex items-center justify-between">
                      <span>Report created: {new Date(viewingReport.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      <span>Last updated: {new Date(viewingReport.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="border-t border-border p-4 bg-muted/30 flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => {
                        const { updateReportShareToken } = useAppStore.getState();
                        let token = viewingReport.shareToken;
                        
                        if (!token) {
                          token = crypto.randomUUID();
                          updateReportShareToken(viewingReport.id, token);
                        }
                        
                        const shareUrl = `${window.location.origin}/report/${token}`;
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Link copied! Share this with parents', {
                          description: shareUrl,
                        });
                      }}
                    >
                      <Link className="h-4 w-4" />
                      {viewingReport.shareToken ? 'Copy Share Link' : 'Share with Parents'}
                    </Button>
                    <Button variant="outline" onClick={() => setViewingReport(null)}>Close</Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
