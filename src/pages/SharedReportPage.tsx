import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, FileText, Save, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import tisaLogo from '@/assets/tisa_logo.png';

export default function SharedReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { reports, students, assessmentTemplates, grades, appSettings, updateReportReflection } = useAppStore();

  const [parentReflection, setParentReflection] = useState('');
  const [studentReflection, setStudentReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Find the report by share token
  const report = reports.find((r) => r.shareToken === shareToken);

  // Initialize reflections from report when found
  useState(() => {
    if (report?.reflections) {
      setParentReflection(report.reflections.parentReflection || '');
      setStudentReflection(report.reflections.studentReflection || '');
    }
  });

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 font-semibold text-xl">Report Not Found</h3>
            <p className="text-sm text-muted-foreground">
              This report link may have expired or is no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const student = students.find((s) => s.id === report.studentId);
  const assessment = assessmentTemplates.find((a) => a.id === report.assessmentTemplateId);
  const grade = student ? grades.find((g) => g.id === student.gradeId) : null;

  const handleSaveReflection = (type: 'parent' | 'student') => {
    if (!shareToken) return;
    setIsSaving(true);
    
    const reflections = type === 'parent' 
      ? { parentReflection, parentSignedAt: new Date().toISOString() }
      : { studentReflection, studentSignedAt: new Date().toISOString() };
    
    updateReportReflection(shareToken, reflections);
    toast.success(`${type === 'parent' ? 'Parent' : 'Student'} reflection saved!`);
    setIsSaving(false);
  };

  const renderStars = (count: number, max: number = 3, isNA?: boolean) => {
    if (isNA) {
      return <span className="text-sm text-muted-foreground font-medium">N/A</span>;
    }
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < count
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  // Group exam results by term
  const examResultsByTerm = (report.examResults || []).reduce((acc, result) => {
    if (!acc[result.term]) acc[result.term] = [];
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, typeof report.examResults>);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto">
        {/* View Only Badge */}
        <div className="flex justify-center py-3">
          <Badge variant="secondary" className="text-xs">
            View Only — Shared Report
          </Badge>
        </div>

        <div className="bg-card shadow-lg">
          {/* TISA Purple Header Banner */}
          <div className="bg-tisa-purple text-white p-4 flex items-center justify-between">
            <div className="text-left">
              <h1 className="font-display text-xl font-bold uppercase tracking-widest">
                {report.reportTitle || 'STUDENT PROGRESS REPORT'}
              </h1>
              <p className="text-white/90 font-medium mt-1">{report.term}</p>
              {(report.periodStart || report.periodEnd) && (
                <p className="text-white/80 text-sm mt-0.5">
                  Period: {report.periodStart} - {report.periodEnd}
                </p>
              )}
            </div>
            <img src={tisaLogo} alt="TISA Logo" className="h-20 w-auto" />
          </div>

          <div className="p-6 space-y-6">
            {/* Student Information Section */}
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
                Student Information
              </div>
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="divide-y divide-border">
                  <div className="flex">
                    <div className="bg-muted/50 px-4 py-2 w-32 text-sm font-medium text-muted-foreground">Full Name</div>
                    <div className="px-4 py-2 text-sm font-semibold flex-1">{student?.firstName} {student?.lastName}</div>
                  </div>
                  <div className="flex">
                    <div className="bg-muted/50 px-4 py-2 w-32 text-sm font-medium text-muted-foreground">Name Used</div>
                    <div className="px-4 py-2 text-sm flex-1">{student?.nameUsed || '-'}</div>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex">
                    <div className="bg-muted/50 px-4 py-2 w-32 text-sm font-medium text-muted-foreground">Grade Level</div>
                    <div className="px-4 py-2 text-sm flex-1">{grade?.name}</div>
                  </div>
                  <div className="flex">
                    <div className="bg-muted/50 px-4 py-2 w-32 text-sm font-medium text-muted-foreground">Date of Birth</div>
                    <div className="px-4 py-2 text-sm flex-1">
                      {student?.dateOfBirth 
                        ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Information Section */}
            {(grade?.classroomTeacher || (grade?.teacherAssignments && grade.teacherAssignments.length > 0)) && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
                  Teacher Information
                </div>
                <div className="divide-y divide-border">
                  {grade.teacherAssignments && grade.teacherAssignments.filter(a => a.category === 'core').length > 0 && (
                    <div className="grid grid-cols-[140px_1fr_1fr] text-sm">
                      <div className="bg-tisa-purple/10 px-4 py-2 font-semibold text-tisa-purple row-span-99 flex items-center border-r border-border">
                        CORE PROGRAMME
                      </div>
                      <div className="col-span-2 divide-y divide-border">
                        {grade.teacherAssignments.filter(a => a.category === 'core').map((assignment, idx) => (
                          <div key={idx} className="grid grid-cols-2 divide-x divide-border">
                            <div className="px-4 py-1.5 bg-muted/30">{assignment.subject}</div>
                            <div className="px-4 py-1.5">{assignment.teacher}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {grade.teacherAssignments && grade.teacherAssignments.filter(a => a.category === 'professional').length > 0 && (
                    <div className="grid grid-cols-[140px_1fr_1fr] text-sm">
                      <div className="bg-tisa-purple/10 px-4 py-2 font-semibold text-tisa-purple row-span-99 flex items-center border-r border-border">
                        PROF TRACKS
                      </div>
                      <div className="col-span-2 divide-y divide-border">
                        {grade.teacherAssignments.filter(a => a.category === 'professional').map((assignment, idx) => (
                          <div key={idx} className="grid grid-cols-2 divide-x divide-border">
                            <div className="px-4 py-1.5 bg-muted/30">{assignment.subject}</div>
                            <div className="px-4 py-1.5">{assignment.teacher}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mission Statement */}
            {appSettings.missionStatement && (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground italic text-center leading-relaxed">
                  "{appSettings.missionStatement}"
                </p>
                {appSettings.values && appSettings.values.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {appSettings.values.map((value, idx) => (
                      <Badge key={idx} variant="outline" className="bg-tisa-purple/10 text-tisa-purple border-tisa-purple/30">
                        {value}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grading Key */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
              <div className="flex items-center gap-4 justify-center text-sm">
                <span className="font-semibold text-amber-900 dark:text-amber-200">Grading Key:</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-amber-800 dark:text-amber-300">Mostly</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-muted text-muted" />
                  <span className="ml-1 text-amber-800 dark:text-amber-300">Usually</span>
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-muted text-muted" />
                  <Star className="h-4 w-4 fill-muted text-muted" />
                  <span className="ml-1 text-amber-800 dark:text-amber-300">Rarely</span>
                </span>
              </div>
            </div>

            {/* Subject Assessments */}
            {assessment?.subjects.map((subject) => {
              const subjectEntries = report.entries.filter((e) => e.subjectId === subject.id);
              const subjectComment = report.subjectComments?.find((sc) => sc.subjectId === subject.id);
              
              if (subjectEntries.length === 0 && !subjectComment) return null;

              return (
                <div key={subject.id} className="overflow-hidden rounded-lg border border-border">
                  <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide flex items-center justify-between">
                    <span>{subject.name}</span>
                    {subjectComment?.attitudeTowardsLearning && (
                      <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs">
                        {subjectComment.attitudeTowardsLearning}
                      </Badge>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {subjectEntries.map((entry) => {
                      const point = subject.assessmentPoints.find((p) => p.id === entry.assessmentPointId);
                      if (!point) return null;
                      
                      return (
                        <div key={entry.assessmentPointId} className="grid grid-cols-[1fr_auto] items-center px-4 py-2 bg-card">
                          <span className="text-sm">{point.name}</span>
                          {renderStars(entry.stars, point.maxStars, entry.isNA)}
                        </div>
                      );
                    })}
                    
                    {(subjectComment?.aiRewrittenComment || subjectComment?.teacherComment) && (
                      <div className="p-4 bg-muted/30">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {subjectComment.aiRewrittenComment || subjectComment.teacherComment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Tests and Exams Results */}
            {report.examResults && report.examResults.length > 0 && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="bg-tisa-purple text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
                  Tests and Exams Results
                </div>
                {Object.entries(examResultsByTerm).map(([term, results]) => (
                  <div key={term}>
                    <div className="bg-tisa-blue/80 text-white px-4 py-1.5 text-sm font-medium">
                      {term}
                    </div>
                    <div className="divide-y divide-border">
                      <div className="grid grid-cols-[80px_1fr_120px_80px] px-4 py-1.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                        <span>Date</span>
                        <span>Title</span>
                        <span>Subject</span>
                        <span>Grade</span>
                      </div>
                      {results?.map((result) => (
                        <div key={result.id} className="grid grid-cols-[80px_1fr_120px_80px] px-4 py-2 items-center text-sm bg-card">
                          <span>{result.date}</span>
                          <span>{result.title}</span>
                          <span>{result.subject}</span>
                          {renderStars(result.grade, 3)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* General Comment */}
            {report.generalComment && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="bg-tisa-purple text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
                  General Comment
                </div>
                <div className="p-4 bg-card">
                  <p className="text-sm text-foreground leading-relaxed">{report.generalComment}</p>
                </div>
              </div>
            )}

            {/* Reflections Section - Editable! */}
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reflections
              </div>
              <div className="p-4 space-y-4 bg-card">
                {/* Parent Reflection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Parent's Reflection</label>
                  <Textarea
                    placeholder="Share your thoughts on your child's progress..."
                    value={parentReflection}
                    onChange={(e) => setParentReflection(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={() => handleSaveReflection('parent')} disabled={isSaving} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Reflection
                    </Button>
                  </div>
                </div>

                {/* Student Reflection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Student's Reflection</label>
                  <Textarea
                    placeholder="Share your thoughts on your learning this term..."
                    value={studentReflection}
                    onChange={(e) => setStudentReflection(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" onClick={() => handleSaveReflection('student')} disabled={isSaving} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Reflection
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            {report.signatures && (report.signatures.classroomTeacher || report.signatures.headOfSchool) && (
              <div className="overflow-hidden rounded-lg border border-border">
                <div className="bg-tisa-purple text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
                  Signatures
                </div>
                <div className="p-6 bg-card">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Classroom Teacher */}
                    <div className="text-center space-y-2">
                      {report.signatures.classroomTeacher && (
                        <>
                          <div className="h-16 flex items-center justify-center">
                            <span className="font-cursive text-3xl text-foreground">
                              {report.signatures.classroomTeacher.name}
                            </span>
                          </div>
                          <div className="border-t border-foreground pt-2">
                            <p className="font-medium text-sm">{report.signatures.classroomTeacher.name}</p>
                            <p className="text-xs text-muted-foreground">Classroom Teacher</p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Head of School */}
                    <div className="text-center space-y-2">
                      {report.signatures.headOfSchool && (
                        <>
                          <div className="h-16 flex items-center justify-center">
                            <span className="font-cursive text-3xl text-foreground">
                              {report.signatures.headOfSchool.name}
                            </span>
                          </div>
                          <div className="border-t border-foreground pt-2">
                            <p className="font-medium text-sm">{report.signatures.headOfSchool.name}</p>
                            <p className="text-xs text-muted-foreground">Head of School</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border pt-4 text-xs text-muted-foreground flex items-center justify-between">
              <span>Report created: {new Date(report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span>Last updated: {new Date(report.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          {/* TISA Footer */}
          <div className="bg-tisa-purple/10 border-t border-tisa-purple/20 p-4 text-center">
            <p className="text-xs text-tisa-purple font-medium">{appSettings.schoolName}</p>
          </div>
        </div>

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by TISA Assessment System
          </p>
        </div>
      </div>
    </div>
  );
}
