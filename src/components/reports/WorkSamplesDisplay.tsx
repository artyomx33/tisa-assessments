import { useState } from 'react';
import { FileText, Download, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { StudentDocument } from '@/types';

interface WorkSamplesDisplayProps {
  documents: StudentDocument[];
}

export function WorkSamplesDisplay({ documents }: WorkSamplesDisplayProps) {
  const [viewingDoc, setViewingDoc] = useState<StudentDocument | null>(null);

  if (documents.length === 0) {
    return null;
  }

  const isImage = (fileType: string) => fileType.startsWith('image/');

  const handleDownload = (doc: StudentDocument) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide flex items-center gap-2">
          <Image className="h-4 w-4" />
          Student Work Samples
        </div>
        <div className="p-4 bg-card">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group cursor-pointer"
                onClick={() => setViewingDoc(doc)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border group-hover:border-primary transition-colors">
                  {isImage(doc.fileType) ? (
                    <img
                      src={doc.fileData}
                      alt={doc.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium mt-1 truncate">{doc.label}</p>
                {doc.comment && (
                  <p className="text-xs text-muted-foreground truncate">{doc.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {viewingDoc?.label || 'Work Sample'}
          </DialogTitle>
          {viewingDoc && (
            <div>
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div>
                  <h3 className="font-semibold">{viewingDoc.label}</h3>
                  {viewingDoc.comment && (
                    <p className="text-sm text-muted-foreground">{viewingDoc.comment}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(viewingDoc)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-auto flex items-center justify-center bg-muted/20">
                {isImage(viewingDoc.fileType) ? (
                  <img
                    src={viewingDoc.fileData}
                    alt={viewingDoc.label}
                    className="max-w-full max-h-[60vh] object-contain rounded"
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{viewingDoc.fileName}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleDownload(viewingDoc)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
