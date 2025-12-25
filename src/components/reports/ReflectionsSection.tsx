import { useState, useEffect } from 'react';
import { MessageSquareText, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import type { ReportReflection } from '@/types';

interface ReflectionsSectionProps {
  reflections?: ReportReflection;
  onUpdate: (reflection: Partial<ReportReflection>) => void;
  isSharedView?: boolean;
}

export function ReflectionsSection({
  reflections,
  onUpdate,
  isSharedView = false,
}: ReflectionsSectionProps) {
  const [parentReflection, setParentReflection] = useState(reflections?.parentReflection || '');
  const [studentReflection, setStudentReflection] = useState(reflections?.studentReflection || '');
  const [savedParent, setSavedParent] = useState(false);
  const [savedStudent, setSavedStudent] = useState(false);

  useEffect(() => {
    setParentReflection(reflections?.parentReflection || '');
    setStudentReflection(reflections?.studentReflection || '');
  }, [reflections]);

  const handleSaveParent = () => {
    onUpdate({
      parentReflection,
      parentSignedAt: new Date().toISOString(),
    });
    setSavedParent(true);
    setTimeout(() => setSavedParent(false), 2000);
  };

  const handleSaveStudent = () => {
    onUpdate({
      studentReflection,
      studentSignedAt: new Date().toISOString(),
    });
    setSavedStudent(true);
    setTimeout(() => setSavedStudent(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />
          General Report
        </CardTitle>
        {isSharedView && (
          <CardDescription>
            You can add your reflections below. Click "Save" to store your feedback.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parent's Reflection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Parent's Reflection</label>
            {reflections?.parentSignedAt && (
              <span className="text-xs text-muted-foreground">
                Last saved: {new Date(reflections.parentSignedAt).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          <Textarea
            placeholder="Share your thoughts about your child's progress..."
            className="min-h-[100px]"
            value={parentReflection}
            onChange={(e) => setParentReflection(e.target.value)}
          />
          {isSharedView && (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={handleSaveParent}
              disabled={parentReflection === (reflections?.parentReflection || '')}
            >
              {savedParent ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Parent Reflection
                </>
              )}
            </Button>
          )}
        </div>

        {/* Student's Reflection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Student's Reflection</label>
            {reflections?.studentSignedAt && (
              <span className="text-xs text-muted-foreground">
                Last saved: {new Date(reflections.studentSignedAt).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          <Textarea
            placeholder="Share your thoughts about your learning journey..."
            className="min-h-[100px]"
            value={studentReflection}
            onChange={(e) => setStudentReflection(e.target.value)}
          />
          {isSharedView && (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={handleSaveStudent}
              disabled={studentReflection === (reflections?.studentReflection || '')}
            >
              {savedStudent ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Student Reflection
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
