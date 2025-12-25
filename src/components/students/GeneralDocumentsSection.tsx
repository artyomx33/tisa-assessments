import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Trash2, Image, File, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { StudentDocument } from '@/types';

const LABEL_OPTIONS = [
  'School Form',
  'Medical Certificate',
  'Permission Slip',
  'ID/Passport Copy',
  'Birth Certificate',
  'Report Card',
  'Other',
];

const MAX_FILE_SIZE = 200 * 1024; // 200KB

interface GeneralDocumentsSectionProps {
  studentId: string;
  studentName: string;
  documents: StudentDocument[];
  onAddDocument: (doc: Omit<StudentDocument, 'id'>) => void;
  onDeleteDocument: (id: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GeneralDocumentsSection({
  studentId,
  studentName,
  documents,
  onAddDocument,
  onDeleteDocument,
  isOpen,
  onOpenChange,
}: GeneralDocumentsSectionProps) {
  const [label, setLabel] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [comment, setComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generalDocs = documents.filter(
    (doc) => doc.studentId === studentId && doc.type === 'general'
  );

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 200KB.');
      return;
    }

    setSelectedFile(file);
    
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    const finalLabel = label === 'Other' ? customLabel : label;
    if (!finalLabel) {
      toast.error('Please select or enter a label');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      onAddDocument({
        studentId,
        type: 'general',
        label: finalLabel,
        comment: comment || undefined,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64,
        uploadedAt: new Date().toISOString(),
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl('');
      setLabel('');
      setCustomLabel('');
      setComment('');
      toast.success('Document uploaded');
    };
    reader.readAsDataURL(selectedFile);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            General Documents - {studentName}
          </DialogTitle>
          <DialogDescription>
            Upload school forms, certificates, and other documents (max 200KB each)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                      {getFileIcon(selectedFile.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Label & Comment */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Label</label>
                    <Select value={label} onValueChange={setLabel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select label" />
                      </SelectTrigger>
                      <SelectContent>
                        {LABEL_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {label === 'Other' && (
                      <Input
                        placeholder="Enter custom label"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comment (optional)</label>
                    <Textarea
                      placeholder="Add a note..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <Button onClick={handleUpload} className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop a file here, or
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>
            )}
          </div>

          {/* Documents List */}
          {generalDocs.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Uploaded Documents</h4>
              <AnimatePresence>
                {generalDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {doc.fileType.startsWith('image/') ? (
                      <img
                        src={doc.fileData}
                        alt={doc.label}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-background rounded border">
                        {getFileIcon(doc.fileType)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{doc.label}</p>
                        <Badge variant="outline" className="text-xs">
                          {doc.fileName.split('.').pop()?.toUpperCase()}
                        </Badge>
                      </div>
                      {doc.comment && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.comment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        onDeleteDocument(doc.id);
                        toast.success('Document deleted');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {generalDocs.length === 0 && !selectedFile && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No documents uploaded yet
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
