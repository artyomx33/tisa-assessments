import { useState } from 'react';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { StarRating } from '@/components/ui/StarRating';
import type { ExamResult } from '@/types';

interface ExamResultsSectionProps {
  examResults: ExamResult[];
  onAdd: (result: Omit<ExamResult, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<ExamResult>) => void;
  onDelete: (id: string) => void;
  subjects: string[];
}

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];

export function ExamResultsSection({
  examResults,
  onAdd,
  onUpdate,
  onDelete,
  subjects,
}: ExamResultsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newResult, setNewResult] = useState<Omit<ExamResult, 'id'>>({
    term: 'Term 1',
    date: '',
    title: 'Assessment of term skills',
    subject: '',
    grade: 3,
  });

  const handleAdd = () => {
    if (!newResult.subject || !newResult.date) return;
    onAdd(newResult);
    setNewResult({
      term: newResult.term,
      date: newResult.date,
      title: 'Assessment of term skills',
      subject: '',
      grade: 3,
    });
  };

  const handleBulkAdd = () => {
    // Add all subjects at once for the selected term
    subjects.forEach((subject) => {
      onAdd({
        term: newResult.term,
        date: newResult.date || new Date().toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' }),
        title: 'Assessment of term skills',
        subject,
        grade: 3,
      });
    });
    setIsAdding(false);
  };

  // Group by term
  const groupedResults = examResults.reduce((acc, result) => {
    if (!acc[result.term]) acc[result.term] = [];
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, ExamResult[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Tests and Exams Results
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Results
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="border-dashed bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <Label>Term</Label>
                  <Select
                    value={newResult.term}
                    onValueChange={(val) => setNewResult({ ...newResult, term: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date (MM/YYYY)</Label>
                  <Input
                    placeholder="12/2025"
                    value={newResult.date}
                    onChange={(e) => setNewResult({ ...newResult, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Subject</Label>
                  <Select
                    value={newResult.subject}
                    onValueChange={(val) => setNewResult({ ...newResult, subject: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grade</Label>
                  <div className="mt-2">
                    <StarRating
                      value={newResult.grade}
                      max={3}
                      onChange={(val) => setNewResult({ ...newResult, grade: val })}
                      size="md"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={handleAdd} disabled={!newResult.subject}>
                  Add Single
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleBulkAdd}>
                  Add All Subjects ({subjects.length})
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {Object.entries(groupedResults).length > 0 ? (
          Object.entries(groupedResults)
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
                      <TableHead className="w-32">Grade</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="text-sm">{result.date}</TableCell>
                        <TableCell className="text-sm">{result.title}</TableCell>
                        <TableCell className="text-sm font-medium">{result.subject}</TableCell>
                        <TableCell>
                          <StarRating
                            value={result.grade}
                            max={3}
                            onChange={(val) => onUpdate(result.id, { grade: val })}
                            size="sm"
                            isNA={result.isNA}
                            onNAChange={(val) => onUpdate(result.id, { isNA: val })}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No exam results added yet. Click "Add Results" to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
