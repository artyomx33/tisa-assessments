import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Archive, Copy, ClipboardList, ChevronDown, ChevronRight, BookOpen, ArchiveRestore } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/ui/StarRating';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AssessmentTemplateDialog } from '@/components/assessments/AssessmentTemplateDialog';
import { DuplicateYearDialog } from '@/components/assessments/DuplicateYearDialog';
import type { AssessmentTemplate } from '@/types';

export default function AssessmentsPage() {
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AssessmentTemplate | null>(null);
  const [duplicatingTemplate, setDuplicatingTemplate] = useState<AssessmentTemplate | null>(null);

  const { assessmentTemplates, updateAssessmentTemplate, grades, activeSchoolYearId } = useAppStore();

  const activeAssessments = assessmentTemplates.filter((a) => {
    const matchesYear = a.schoolYearId === activeSchoolYearId;
    const isArchived = (a as any).isArchived === true;
    return matchesYear && (showArchived ? isArchived : !isArchived);
  });

  const filteredAssessments = activeAssessments.filter(
    (a) => filterGrade === 'all' || a.gradeId === filterGrade
  );

  const handleArchive = (template: AssessmentTemplate) => {
    const isArchived = (template as any).isArchived;
    updateAssessmentTemplate(template.id, { isArchived: !isArchived } as any);
    toast.success(isArchived ? 'Assessment restored' : 'Assessment archived');
  };

  const getGradeInfo = (gradeId: string) => grades.find((g) => g.id === gradeId);

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

  const getTotalPoints = (assessment: AssessmentTemplate) => {
    return assessment.subjects?.reduce((acc, s) => acc + (s.assessmentPoints?.length || 0), 0) || 0;
  };

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
              Create and manage assessment templates organized by subject and grade
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
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

          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
              Show archived
            </label>
          </div>
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
                    {assessments.length} {showArchived ? 'archived' : 'templates'}
                  </span>
                </div>

                {assessments.length > 0 ? (
                  <div className="grid gap-4">
                    {assessments.map((assessment, index) => (
                      <motion.div
                        key={assessment.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`overflow-hidden ${showArchived ? 'opacity-75' : ''}`}>
                          <div
                            className="h-1.5"
                            style={{ backgroundColor: `hsl(var(--grade-${grade.colorIndex}))` }}
                          />
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{assessment.name}</CardTitle>
                                {assessment.description && (
                                  <CardDescription className="mt-1">
                                    {assessment.description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {assessment.subjects?.length || 0} subjects
                                </Badge>
                                <Badge variant="secondary">
                                  {getTotalPoints(assessment)} points
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Subjects list */}
                            {assessment.subjects?.map((subject) => (
                              <Collapsible
                                key={subject.id}
                                open={expandedSubjects.has(subject.id)}
                                onOpenChange={() => toggleSubject(subject.id)}
                              >
                                <CollapsibleTrigger asChild>
                                  <div className="flex cursor-pointer items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50">
                                    <div className="flex items-center gap-3">
                                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <span className="font-medium">{subject.name}</span>
                                        {subject.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {subject.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {subject.assessmentPoints?.length || 0} points
                                      </Badge>
                                      {expandedSubjects.has(subject.id) ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="ml-7 mt-2 space-y-2 border-l-2 border-muted pl-4">
                                    {subject.assessmentPoints?.map((point) => (
                                      <div
                                        key={point.id}
                                        className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm"
                                      >
                                        <span className="text-foreground">{point.name}</span>
                                        <StarRating
                                          value={point.maxStars}
                                          max={point.maxStars}
                                          readonly
                                          size="sm"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            ))}

                            <div className="flex gap-2 border-t pt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingTemplate(assessment)}
                              >
                                <Pencil className="mr-1.5 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDuplicatingTemplate(assessment)}
                              >
                                <Copy className="mr-1.5 h-3 w-3" />
                                Duplicate to Year
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleArchive(assessment)}
                              >
                                {(assessment as any).isArchived ? (
                                  <>
                                    <ArchiveRestore className="mr-1.5 h-3 w-3" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <Archive className="mr-1.5 h-3 w-3" />
                                    Archive
                                  </>
                                )}
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
                      No {showArchived ? 'archived' : ''} assessments for this grade
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
                  <h3 className="mb-2 font-semibold">
                    {showArchived ? 'No archived assessments' : 'No assessments yet'}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {showArchived
                      ? 'Archived templates will appear here'
                      : 'Create your first assessment template to get started'}
                  </p>
                  {!showArchived && (
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Template
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AssessmentTemplateDialog
        open={isCreateDialogOpen || !!editingTemplate}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingTemplate(null);
          }
        }}
        editingTemplate={editingTemplate}
      />

      {duplicatingTemplate && (
        <DuplicateYearDialog
          open={!!duplicatingTemplate}
          onOpenChange={(open) => !open && setDuplicatingTemplate(null)}
          template={duplicatingTemplate}
        />
      )}
    </AppLayout>
  );
}
