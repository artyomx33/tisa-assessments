import { useState } from 'react';
import { PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ReportSignature } from '@/types';

interface SignatureSectionProps {
  signatures?: ReportSignature;
  classroomTeacherName?: string;
  headOfSchoolName?: string;
  onSign: (role: 'classroomTeacher' | 'headOfSchool', name: string) => void;
  readOnly?: boolean;
}

export function SignatureSection({
  signatures,
  classroomTeacherName = '',
  headOfSchoolName = 'Karina Medvedeva',
  onSign,
  readOnly = false,
}: SignatureSectionProps) {
  const [signingRole, setSigningRole] = useState<'classroomTeacher' | 'headOfSchool' | null>(null);
  const [signatureName, setSignatureName] = useState('');

  const handleSign = () => {
    if (signingRole && signatureName.trim()) {
      onSign(signingRole, signatureName.trim());
      setSigningRole(null);
      setSignatureName('');
    }
  };

  const openSignDialog = (role: 'classroomTeacher' | 'headOfSchool') => {
    const defaultName = role === 'classroomTeacher' ? classroomTeacherName : headOfSchoolName;
    setSignatureName(defaultName);
    setSigningRole(role);
  };

  const renderSignature = (
    role: 'classroomTeacher' | 'headOfSchool',
    title: string,
    defaultName: string
  ) => {
    const signature = signatures?.[role];
    const isSigned = !!signature;

    return (
      <div className="flex-1 text-center space-y-2">
        {isSigned ? (
          <>
            <div className="font-cursive text-2xl text-tisa-purple min-h-[3rem] flex items-center justify-center">
              {signature.name}
            </div>
            <div className="border-t border-foreground/30 pt-2 mx-8">
              <p className="font-semibold text-sm">{signature.name}</p>
              <p className="text-xs text-muted-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Signed: {new Date(signature.signedAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-[3rem] flex items-center justify-center">
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => openSignDialog(role)}
                >
                  <PenLine className="h-4 w-4" />
                  Click to Sign
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm italic">Not signed</span>
              )}
            </div>
            <div className="border-t border-foreground/30 pt-2 mx-8">
              <p className="font-semibold text-sm">{defaultName || '_______________'}</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8 py-4">
            {renderSignature('classroomTeacher', 'Classroom Teacher', classroomTeacherName)}
            {renderSignature('headOfSchool', 'Head of School', headOfSchoolName)}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!signingRole} onOpenChange={(open) => !open && setSigningRole(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Digital Signature</DialogTitle>
            <DialogDescription>
              Enter your name to sign the report. This will be displayed in a cursive style.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter your name"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="text-lg"
              autoFocus
            />
            {signatureName && (
              <div className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <p className="font-cursive text-3xl text-tisa-purple">{signatureName}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSigningRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={!signatureName.trim()}>
              Sign Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
