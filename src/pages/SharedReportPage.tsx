import { useParams } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, FileText } from 'lucide-react';
import { ExamResultsDisplay } from '@/components/reports/ExamResultsDisplay';
import { SignatureDisplay } from '@/components/reports/SignatureDisplay';
import { ReflectionsSection } from '@/components/reports/ReflectionsSection';
import tisaLogo from '@/assets/tisa_logo.png';

export default function SharedReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { reports, students, assessmentTemplates, grades, appSettings, updateReportReflection } = useAppStore();

  // Find the report by share token
  const report = reports.find((r) => r.shareToken === shareToken);

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

  const handleUpdateReflection = (reflection: Parameters<typeof updateReportReflection>[1]) => {
    updateReportReflection(report.id, reflection);
  };

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
          <div className="bg-tisa-purple text-white p-4 flex items-center gap-4">
            {/* Student Photo in Header */}
            <div className="flex-shrink-0">
              {student?.avatarUrl ? (
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                  <img 
                    src={student.avatarUrl} 
                    alt={`${student.firstName} ${student.lastName}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {student?.firstName?.[0]}{student?.lastName?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="text-left flex-1">
              <h1 className="font-display text-xl font-bold uppercase tracking-widest">
                {report.reportTitle || 'STUDENT PROGRESS REPORT'}
              </h1>
              <p className="text-white/90 font-medium mt-1">
                {report.term}
              </p>
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
              <div className="flex">
                <div className="flex-1 grid grid-cols-2 divide-x divide-border">
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

            {/* Tests and Exams Results */}
            {report.examResults && report.examResults.length > 0 && (
              <ExamResultsDisplay examResults={report.examResults} />
            )}

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

            {/* Reflections (Editable by parents/students) */}
            <ReflectionsSection
              reflections={report.reflections}
              onUpdate={handleUpdateReflection}
              isSharedView={true}
            />

            {/* Signatures */}
            <SignatureDisplay
              signatures={report.signatures}
              classroomTeacherName={grade?.classroomTeacher}
              headOfSchoolName="Karina Medvedeva"
            />

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
