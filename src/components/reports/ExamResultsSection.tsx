import { useState } from 'react';
import { Pencil, GraduationCap, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ExamResult } from '@/types';

interface ExamResultsSectionProps {
  examResults: ExamResult[];
  onUpdate: (id: string, updates: Partial<ExamResult>) => void;
  onDelete: (id: string) => void;
}

const GRADE_OPTIONS = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];

export function ExamResultsSection({
  examResults,
  onUpdate,
  onDelete,
}: ExamResultsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Group by term
  const groupedResults = examResults.reduce((acc, result) => {
    if (!acc[result.term]) acc[result.term] = [];
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, ExamResult[]>);

  const handleEditGrade = (id: string, grade: string) => {
    onUpdate(id, { grade });
    setEditingId(null);
  };

  if (examResults.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Tests and Exams Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No exam results yet. Add grades in the Subject Comment section above.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Tests and Exams Results Summary
          </CardTitle>
          <Button
            type="button"
            variant={isEditing ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsEditing(!isEditing);
              setEditingId(null);
            }}
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Done
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedResults)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([term, results]) => (
            <div key={term} className="overflow-hidden rounded-lg border">
              <div className="bg-tisa-blue text-white px-4 py-2 font-semibold text-sm">
                {term}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-24">Grade</TableHead>
                    {isEditing && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="text-sm">{result.date}</TableCell>
                      <TableCell className="text-sm">{result.title}</TableCell>
                      <TableCell className="text-sm font-medium">{result.subject}</TableCell>
                      <TableCell>
                        {isEditing && editingId === result.id ? (
                          <Select
                            value={result.grade || ''}
                            onValueChange={(val) => handleEditGrade(result.id, val)}
                          >
                            <SelectTrigger className="w-[80px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`font-semibold ${isEditing ? 'cursor-pointer hover:text-primary' : ''}`}
                            onClick={() => isEditing && setEditingId(result.id)}
                          >
                            {result.grade || '-'}
                          </span>
                        )}
                      </TableCell>
                      {isEditing && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(result.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
