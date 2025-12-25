import { Star } from 'lucide-react';
import type { ExamResult } from '@/types';

interface ExamResultsDisplayProps {
  examResults: ExamResult[];
}

export function ExamResultsDisplay({ examResults }: ExamResultsDisplayProps) {
  if (!examResults || examResults.length === 0) return null;

  // Group by term
  const groupedResults = examResults.reduce((acc, result) => {
    if (!acc[result.term]) acc[result.term] = [];
    acc[result.term].push(result);
    return acc;
  }, {} as Record<string, ExamResult[]>);

  const renderStars = (count: number, max: number = 3, isNA?: boolean) => {
    if (isNA) {
      return <span className="text-sm text-muted-foreground font-medium">N/A</span>;
    }
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < count
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="bg-tisa-purple text-white px-4 py-2 font-semibold text-sm uppercase tracking-wide">
        Tests and Exams Results
      </div>
      
      {Object.entries(groupedResults)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([term, results]) => (
          <div key={term}>
            <div className="bg-tisa-blue text-white px-4 py-1.5 text-sm font-medium">
              {term}
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 text-sm">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-24">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Subject</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-28">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((result, idx) => (
                  <tr key={result.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                    <td className="px-4 py-2 text-sm">{result.date}</td>
                    <td className="px-4 py-2 text-sm">{result.title}</td>
                    <td className="px-4 py-2 text-sm font-medium">{result.subject}</td>
                    <td className="px-4 py-2">{renderStars(result.grade, 3, result.isNA)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
