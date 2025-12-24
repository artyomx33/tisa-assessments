import { useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarRating } from '@/components/ui/StarRating';
import type { ExamResult, Subject } from '@/types';

interface ExamResultsSectionProps {
  examResults: ExamResult[];
  onExamResultsChange: (results: ExamResult[]) => void;
  subjects: Subject[];
  availableTerms: string[];
}

export function ExamResultsSection({
  examResults,
  onExamResultsChange,
  subjects,
  availableTerms,
}: ExamResultsSectionProps) {
  const [newResult, setNewResult] = useState<Partial<ExamResult>>({
    term: availableTerms[0] || 'Term 1',
    date: '',
    title: 'Assessment of term skills',
    subject: '',
    grade: 3,
  });

  const addExamResult = () => {
    if (!newResult.subject || !newResult.date) return;

    const result: ExamResult = {
      id: crypto.randomUUID(),
      term: newResult.term || 'Term 1',
      date: newResult.date || '',
      title: newResult.title || 'Assessment of term skills',
      subject: newResult.subject || '',
      grade: newResult.grade ?? 3,
    };

    onExamResultsChange([...examResults, result]);
    setNewResult({
      term: newResult.term,
      date: '',
      title: 'Assessment of term skills',
      subject: '',
      grade: 3,
    });
  };

  const removeExamResult = (id: string) => {
    onExamResultsChange(examResults.filter((r) => r.id !== id));
  };

  const updateExamResult = (id: string, field: keyof ExamResult, value: string | number) => {
    onExamResultsChange(
      examResults.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Get unique subject names from the assessment subjects
  const subjectNames = [...new Set(subjects.map((s) => s.name.replace(/ - Term \d+/g, '').replace(/ \(.*\)/g, '')))];

  // Group results by term
  const groupedResults = examResults.reduce((acc, result) => {
    if (!acc[result.term]) acc[result.term] = [];
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, ExamResult[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Tests and Exams Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new result form */}
        <div className="grid grid-cols-5 gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Term</label>
            <Select
              value={newResult.term}
              onValueChange={(val) => setNewResult({ ...newResult, term: val })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTerms.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Date (MM/YYYY)</label>
            <Input
              className="h-9"
              placeholder="10/2025"
              value={newResult.date}
              onChange={(e) => setNewResult({ ...newResult, date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Title</label>
            <Input
              className="h-9"
              placeholder="Assessment of term skills"
              value={newResult.title}
              onChange={(e) => setNewResult({ ...newResult, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
            <Select
              value={newResult.subject}
              onValueChange={(val) => setNewResult({ ...newResult, subject: val })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {subjectNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" size="sm" onClick={addExamResult} className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Display grouped results */}
        {Object.keys(groupedResults).length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            {Object.entries(groupedResults).map(([term, results]) => (
              <div key={term}>
                <div className="bg-tisa-blue text-white px-3 py-1.5 text-sm font-semibold">
                  {term}
                </div>
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-[80px_1fr_120px_100px_40px] gap-2 px-3 py-1.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Date</span>
                    <span>Title</span>
                    <span>Subject</span>
                    <span>Grade</span>
                    <span></span>
                  </div>
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="grid grid-cols-[80px_1fr_120px_100px_40px] gap-2 px-3 py-2 items-center text-sm"
                    >
                      <span>{result.date}</span>
                      <span className="truncate">{result.title}</span>
                      <span className="truncate">{result.subject}</span>
                      <StarRating
                        value={result.grade}
                        max={3}
                        onChange={(val) => updateExamResult(result.id, 'grade', val)}
                        size="sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeExamResult(result.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {examResults.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
            No exam results added yet. Use the form above to add results.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
