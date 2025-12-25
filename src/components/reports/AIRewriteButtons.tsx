import { motion } from 'framer-motion';
import { Sparkles, Star, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AIRewriteButtonsProps {
  sourceText: string;
  aiRewrittenText: string;
  loadingKey: string;
  studentName: string;
  onRewrite: (
    text: string,
    key: string,
    callback: (result: string) => void,
    mode: 'quick' | 'tisa',
    name: string
  ) => void;
  onRewriteComplete: (result: string) => void;
  onAccept: () => void;
  isLoading: { [key: string]: boolean };
  aiTextareaClassName?: string;
  showAITextarea?: boolean;
  onAITextChange?: (text: string) => void;
}

export function AIRewriteButtons({
  sourceText,
  aiRewrittenText,
  loadingKey,
  studentName,
  onRewrite,
  onRewriteComplete,
  onAccept,
  isLoading,
  aiTextareaClassName = 'min-h-[60px]',
  showAITextarea = true,
  onAITextChange,
}: AIRewriteButtonsProps) {
  const quickKey = loadingKey;
  const tisaKey = `${loadingKey}-tisa`;
  const isQuickLoading = isLoading[quickKey];
  const isTisaLoading = isLoading[tisaKey];
  const isAnyLoading = isQuickLoading || isTisaLoading;

  if (!sourceText) return null;

  return (
    <>
      {/* Rewrite Buttons */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isAnyLoading}
          onClick={() => onRewrite(sourceText, quickKey, onRewriteComplete, 'quick', studentName)}
        >
          {isQuickLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          )}
          {isQuickLoading ? 'Rewriting...' : 'Quick'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-tisa-purple/30 hover:bg-tisa-purple/10"
          disabled={isAnyLoading}
          onClick={() => onRewrite(sourceText, tisaKey, onRewriteComplete, 'tisa', studentName)}
        >
          {isTisaLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className="h-3.5 w-3.5 text-tisa-purple" />
          )}
          {isTisaLoading ? 'Rewriting...' : 'TISA'}
        </Button>
      </div>

      {/* AI Result with Accept */}
      {aiRewrittenText && showAITextarea && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <label className="mb-1.5 flex items-center gap-2 text-sm">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI Polished
          </label>
          <Textarea
            className={`bg-accent/5 border-accent/20 ${aiTextareaClassName}`}
            value={aiRewrittenText}
            onChange={(e) => onAITextChange?.(e.target.value)}
          />
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2"
            onClick={onAccept}
          >
            <Check className="h-3.5 w-3.5" />
            Accept AI Version
          </Button>
        </motion.div>
      )}
    </>
  );
}
