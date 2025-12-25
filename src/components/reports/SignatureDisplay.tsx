import type { ReportSignature } from '@/types';

interface SignatureDisplayProps {
  signatures?: ReportSignature;
  classroomTeacherName?: string;
  headOfSchoolName?: string;
}

export function SignatureDisplay({
  signatures,
  classroomTeacherName = '',
  headOfSchoolName = 'Karina Medvedeva',
}: SignatureDisplayProps) {
  const renderSignature = (
    signature: { name: string; signedAt: string } | undefined,
    title: string,
    defaultName: string
  ) => {
    return (
      <div className="flex-1 text-center space-y-2">
        {signature ? (
          <>
            <div className="font-cursive text-2xl text-tisa-purple min-h-[3rem] flex items-center justify-center">
              {signature.name}
            </div>
            <div className="border-t border-foreground/30 pt-2 mx-8">
              <p className="font-semibold text-sm">{signature.name}</p>
              <p className="text-xs text-muted-foreground">{title}</p>
            </div>
          </>
        ) : (
          <>
            <div className="min-h-[3rem] flex items-center justify-center">
              <span className="text-muted-foreground text-sm italic">_______________</span>
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
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="bg-tisa-purple text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
        Signatures
      </div>
      <div className="p-6 bg-card">
        <div className="flex gap-8 py-4">
          {renderSignature(
            signatures?.classroomTeacher?.name && signatures?.classroomTeacher?.signedAt
              ? { name: signatures.classroomTeacher.name, signedAt: signatures.classroomTeacher.signedAt }
              : undefined,
            'Classroom Teacher',
            classroomTeacherName
          )}
          {renderSignature(
            signatures?.headOfSchool?.name && signatures?.headOfSchool?.signedAt
              ? { name: signatures.headOfSchool.name, signedAt: signatures.headOfSchool.signedAt }
              : undefined,
            'Head of School',
            headOfSchoolName
          )}
        </div>
      </div>
    </div>
  );
}
