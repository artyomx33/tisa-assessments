import { useState } from 'react';
import { PenLine, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { ReportSignature } from '@/types';

interface SignatureSectionProps {
  signatures?: ReportSignature;
  classroomTeacherName?: string;
  headOfSchoolName?: string;
  onSign: (role: 'classroomTeacher' | 'headOfSchool', name: string) => void;
  readonly?: boolean;
}

export function SignatureSection({
  signatures,
  classroomTeacherName = '',
  headOfSchoolName = 'Karina Medvedeva',
  onSign,
  readonly = false,
}: SignatureSectionProps) {
  const [signDialog, setSignDialog] = useState<{
    open: boolean;
    role: 'classroomTeacher' | 'headOfSchool';
    defaultName: string;
  }>({ open: false, role: 'classroomTeacher', defaultName: '' });
  const [signatureName, setSignatureName] = useState('');

  const openSignDialog = (role: 'classroomTeacher' | 'headOfSchool', defaultName: string) => {
    setSignDialog({ open: true, role, defaultName });
    setSignatureName(defaultName);
  };

  const handleSign = () => {
    if (signatureName.trim()) {
      onSign(signDialog.role, signatureName.trim());
      setSignDialog({ ...signDialog, open: false });
      setSignatureName('');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            {/* Classroom Teacher */}
            <div className="text-center space-y-2">
              {signatures?.classroomTeacher ? (
                <>
                  <div className="h-16 flex items-center justify-center">
                    <span className="font-cursive text-3xl text-foreground">
                      {signatures.classroomTeacher.name}
                    </span>
                  </div>
                  <div className="border-t border-foreground pt-2">
                    <p className="font-medium text-sm">{signatures.classroomTeacher.name}</p>
                    <p className="text-xs text-muted-foreground">Classroom Teacher</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Signed: {formatDate(signatures.classroomTeacher.signedAt)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 flex items-center justify-center">
                    {!readonly ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSignDialog('classroomTeacher', classroomTeacherName)}
                        className="gap-2"
                      >
                        <PenLine className="h-4 w-4" />
                        Click to Sign
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Not signed</span>
                    )}
                  </div>
                  <div className="border-t border-muted-foreground/30 pt-2">
                    <p className="font-medium text-sm text-muted-foreground">
                      {classroomTeacherName || 'Classroom Teacher'}
                    </p>
                    <p className="text-xs text-muted-foreground">Classroom Teacher</p>
                  </div>
                </>
              )}
            </div>

            {/* Head of School */}
            <div className="text-center space-y-2">
              {signatures?.headOfSchool ? (
                <>
                  <div className="h-16 flex items-center justify-center">
                    <span className="font-cursive text-3xl text-foreground">
                      {signatures.headOfSchool.name}
                    </span>
                  </div>
                  <div className="border-t border-foreground pt-2">
                    <p className="font-medium text-sm">{signatures.headOfSchool.name}</p>
                    <p className="text-xs text-muted-foreground">Head of School</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Signed: {formatDate(signatures.headOfSchool.signedAt)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 flex items-center justify-center">
                    {!readonly ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openSignDialog('headOfSchool', headOfSchoolName)}
                        className="gap-2"
                      >
                        <PenLine className="h-4 w-4" />
                        Click to Sign
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">Not signed</span>
                    )}
                  </div>
                  <div className="border-t border-muted-foreground/30 pt-2">
                    <p className="font-medium text-sm text-muted-foreground">{headOfSchoolName}</p>
                    <p className="text-xs text-muted-foreground">Head of School</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sign Dialog */}
      <Dialog open={signDialog.open} onOpenChange={(open) => setSignDialog({ ...signDialog, open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Digital Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Enter your name to sign:</label>
              <Input
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Your full name"
                className="text-lg"
              />
            </div>
            {signatureName && (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div className="text-center">
                  <span className="font-cursive text-4xl">{signatureName}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignDialog({ ...signDialog, open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!signatureName.trim()} className="gap-2">
              <Check className="h-4 w-4" />
              Sign Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
