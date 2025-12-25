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
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground w-20">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((result, idx) => (
                  <tr key={result.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                    <td className="px-4 py-2 text-sm">{result.date}</td>
                    <td className="px-4 py-2 text-sm">{result.title}</td>
                    <td className="px-4 py-2 text-sm font-medium">{result.subject}</td>
                    <td className="px-4 py-2 text-sm font-bold">{result.grade || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
