import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Image, File, X, Check, Eye, RefreshCw, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { StudentDocument, StudentReport } from '@/types';
import { GENERAL_DOC_SLOTS } from '@/types';

const MAX_FILE_SIZE = 200 * 1024; // 200KB

interface GeneralDocumentsSectionProps {
  studentId: string;
  studentName: string;
  documents: StudentDocument[];
  reports: StudentReport[];
  onAddDocument: (doc: Omit<StudentDocument, 'id'>) => void;
  onDeleteDocument: (id: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneralDocumentsSection({
  studentId,
  studentName,
  documents,
  reports,
  onAddDocument,
  onDeleteDocument,
  isOpen,
  onOpenChange,
}: GeneralDocumentsSectionProps) {
  const [uploadingSlotId, setUploadingSlotId] = useState<string | null>(null);
  const [otherComment, setOtherComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generalDocs = documents.filter(
    (doc) => doc.studentId === studentId && doc.type === 'general'
  );

  const reportDocs = documents.filter(
    (doc) => doc.studentId === studentId && doc.type === 'report'
  );

  // Group report docs by reportId
  const reportDocsGrouped = reportDocs.reduce((acc, doc) => {
    const reportId = doc.reportId || 'unknown';
    if (!acc[reportId]) acc[reportId] = [];
    acc[reportId].push(doc);
    return acc;
  }, {} as Record<string, StudentDocument[]>);

  const getDocForSlot = (slotId: string) => {
    return generalDocs.find((doc) => doc.label === slotId || doc.label === GENERAL_DOC_SLOTS.find(s => s.id === slotId)?.label);
  };

  const handleFileSelect = (file: File, slotId: string, slotLabel: string) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 200KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      // Delete existing doc for this slot if exists
      const existing = getDocForSlot(slotId);
      if (existing) {
        onDeleteDocument(existing.id);
      }

      onAddDocument({
        studentId,
        type: 'general',
        label: slotLabel,
        comment: slotId === 'other' ? otherComment : undefined,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        uploadedAt: new Date().toISOString(),
      });

      setUploadingSlotId(null);
      setOtherComment('');
      toast.success('Document uploaded');
    };
    reader.readAsDataURL(file);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getReportName = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    return report?.reportTitle || report?.term || 'Unknown Report';
  };

  const openFile = (doc: StudentDocument) => {
    const newWindow = window.open();
    if (newWindow) {
      if (doc.fileType.startsWith('image/')) {
        newWindow.document.write(`<img src="${doc.fileData}" alt="${doc.label}" style="max-width:100%;"/>`);
      } else {
        newWindow.document.write(`<iframe src="${doc.fileData}" style="width:100%;height:100vh;border:none;"></iframe>`);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Documents - {studentName}
          </DialogTitle>
          <DialogDescription>
            Manage student documents and view report work samples (max 200KB each)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Docs</TabsTrigger>
            <TabsTrigger value="reports">Report Work Samples</TabsTrigger>
          </TabsList>

          {/* General Docs Tab */}
          <TabsContent value="general" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload required school documents for this student.
            </p>
            
            {GENERAL_DOC_SLOTS.map((slot) => {
              const doc = getDocForSlot(slot.id);
              const isUploading = uploadingSlotId === slot.id;

              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  {/* Status indicator */}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    doc ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'
                  }`}>
                    {doc ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{slot.label}</p>
                      {slot.required && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                    </div>
                    {doc ? (
                      <p className="text-xs text-muted-foreground truncate">
                        {doc.fileName} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    )}
                  </div>

                  {/* Actions */}
                  {doc ? (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openFile(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setUploadingSlotId(slot.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          onDeleteDocument(doc.id);
                          toast.success('Document removed');
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUploadingSlotId(slot.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  )}
                </motion.div>
              );
            })}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadingSlotId) {
                  const slot = GENERAL_DOC_SLOTS.find((s) => s.id === uploadingSlotId);
                  if (slot) {
                    handleFileSelect(file, uploadingSlotId, slot.label);
                  }
                }
                e.target.value = '';
              }}
            />
          </TabsContent>

          {/* Report Work Samples Tab */}
          <TabsContent value="reports" className="space-y-4 mt-4">
            {Object.keys(reportDocsGrouped).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No work samples yet.</p>
                <p className="text-xs mt-1">Add them when creating reports on the Reports page.</p>
              </div>
            ) : (
              Object.entries(reportDocsGrouped).map(([reportId, docs]) => (
                <div key={reportId} className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {getReportName(reportId)}
                    <Badge variant="outline" className="text-xs">
                      {docs.length} {docs.length === 1 ? 'file' : 'files'}
                    </Badge>
                  </h4>
                  <div className="space-y-2 pl-6">
                    {docs.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                      >
                        {doc.fileType.startsWith('image/') ? (
                          <img
                            src={doc.fileData}
                            alt={doc.label}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 flex items-center justify-center bg-background rounded border">
                            {getFileIcon(doc.fileType)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.label}</p>
                          {doc.comment && (
                            <p className="text-xs text-muted-foreground truncate">{doc.comment}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => openFile(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
