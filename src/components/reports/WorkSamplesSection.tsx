import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Pencil, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { StudentDocument } from '@/types';

const MAX_FILE_SIZE = 200 * 1024; // 200KB

const SUGGESTED_LABELS = [
  'Math Work',
  'Writing Sample',
  'Art Project',
  'Science Experiment',
  'Reading Assessment',
  'Homework',
  'Class Project',
];

interface WorkSamplesSectionProps {
  reportId: string;
  studentId: string;
  documents: StudentDocument[];
  onAddDocument: (doc: StudentDocument) => void;
  onUpdateDocument: (id: string, updates: Partial<StudentDocument>) => void;
  onDeleteDocument: (id: string) => void;
}

export function WorkSamplesSection({
  reportId,
  studentId,
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}: WorkSamplesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editComment, setEditComment] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large. Maximum size is 200KB.`);
        continue;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        
        const newDoc: StudentDocument = {
          id: crypto.randomUUID(),
          studentId,
          type: 'report',
          reportId,
          label: file.name.split('.')[0], // Use filename without extension as initial label
          comment: '',
          fileName: file.name,
          fileType: file.type,
          fileData: base64,
          uploadedAt: new Date().toISOString(),
        };

        onAddDocument(newDoc);
        toast.success(`${file.name} uploaded!`);
      };
      reader.onerror = () => {
        toast.error(`Failed to read ${file.name}`);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const startEditing = (doc: StudentDocument) => {
    setEditingId(doc.id);
    setEditLabel(doc.label);
    setEditComment(doc.comment || '');
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdateDocument(editingId, { label: editLabel, comment: editComment });
      setEditingId(null);
      toast.success('Document updated!');
    }
  };

  const applyLabel = (docId: string, label: string) => {
    onUpdateDocument(docId, { label });
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  const reportDocuments = documents.filter(d => d.reportId === reportId);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/30 hover:border-muted-foreground/50'
        }`}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop files here, or click to select
        </p>
        <p className="text-xs text-muted-foreground/70 mb-3">
          Maximum 200KB per file
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Choose Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Document List */}
      {reportDocuments.length > 0 && (
        <div className="space-y-3">
          {reportDocuments.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-lg p-3 bg-card"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded bg-muted overflow-hidden flex items-center justify-center">
                  {isImage(doc.fileType) ? (
                    <img
                      src={doc.fileData}
                      alt={doc.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  {editingId === doc.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Label"
                        className="h-8"
                      />
                      <Textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Comment (optional)"
                        className="min-h-[60px] text-sm"
                      />
                      <Button size="sm" onClick={saveEdit}>
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm truncate">{doc.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => startEditing(doc)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => onDeleteDocument(doc.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {doc.comment && (
                        <p className="text-xs text-muted-foreground mt-1">{doc.comment}</p>
                      )}
                      {/* Quick Labels */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {SUGGESTED_LABELS.slice(0, 4).map((label) => (
                          <Badge
                            key={label}
                            variant={doc.label === label ? "default" : "outline"}
                            className="text-xs cursor-pointer hover:bg-primary/10"
                            onClick={() => applyLabel(doc.id, label)}
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reportDocuments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No work samples uploaded yet
        </p>
      )}
    </div>
  );
}
