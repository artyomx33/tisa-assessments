import { Star, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isNA?: boolean;
  onNAChange?: (isNA: boolean) => void;
}

const sizeClasses = {
  sm: 'h-6 px-2 text-xs',
  md: 'h-8 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
};

const starSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const naBtnSizeClasses = {
  sm: 'h-6 px-2 text-xs',
  md: 'h-8 px-2.5 text-xs',
  lg: 'h-10 px-3 text-sm',
};

export function StarRating({
  value,
  max = 4,
  onChange,
  readonly = false,
  size = 'md',
  isNA = false,
  onNAChange,
}: StarRatingProps) {
  const handleClick = () => {
    if (readonly || !onChange || isNA) return;
    // Click reduces by 1 until 1, then resets to max
    const newValue = value <= 1 ? max : value - 1;
    onChange(newValue);
  };

  const handleNAToggle = () => {
    if (readonly || !onNAChange) return;
    onNAChange(!isNA);
  };

  // Display value - if 0 (unset), show as max (starts full)
  const displayValue = value === 0 ? max : value;

  // In readonly mode with N/A, show just the text
  if (readonly && isNA) {
    return (
      <span className={cn(
        'inline-flex items-center font-medium text-muted-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        size === 'lg' && 'text-base',
      )}>
        N/A
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* N/A Toggle Button - only show in edit mode */}
      {!readonly && onNAChange && (
        <motion.button
          type="button"
          onClick={handleNAToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'inline-flex items-center justify-center rounded-md border transition-all duration-200',
            'font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            naBtnSizeClasses[size],
            isNA
              ? 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30'
              : 'bg-muted/50 text-muted-foreground/60 border-border hover:bg-muted hover:text-muted-foreground',
          )}
          title={isNA ? 'Click to enable rating' : 'Mark as N/A'}
        >
          <Ban className={cn(starSizeClasses[size], 'mr-1')} />
          N/A
        </motion.button>
      )}

      {/* Star Rating Button */}
      <motion.button
        type="button"
        disabled={readonly || isNA}
        onClick={handleClick}
        whileHover={!readonly && !isNA ? { scale: 1.05 } : undefined}
        whileTap={!readonly && !isNA ? { scale: 0.95 } : undefined}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full transition-all duration-200',
          'font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          sizeClasses[size],
          !readonly && !isNA && 'cursor-pointer',
          (readonly || isNA) && 'cursor-default',
          // Disabled/NA state
          isNA && 'opacity-40 grayscale',
          // Button styling based on star count
          !isNA && displayValue === max && 'bg-star-filled/20 text-star-filled border border-star-filled/30',
          !isNA && displayValue === max - 1 && 'bg-primary/15 text-primary border border-primary/30',
          !isNA && displayValue === max - 2 && 'bg-accent/15 text-accent border border-accent/30',
          !isNA && displayValue <= max - 3 && 'bg-muted text-muted-foreground border border-border',
          isNA && 'bg-muted text-muted-foreground border border-border',
        )}
      >
        {/* Stars display */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: max }).map((_, index) => {
            const isFilled = index < displayValue;
            return (
              <motion.div
                key={index}
                initial={false}
                animate={isFilled && !isNA ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
              >
                <Star
                  className={cn(
                    starSizeClasses[size],
                    'transition-colors duration-150',
                    isFilled
                      ? 'fill-current'
                      : 'fill-transparent opacity-30'
                  )}
                />
              </motion.div>
            );
          })}
        </div>
        {/* Count label */}
        <span className="font-semibold tabular-nums">
          {displayValue}/{max}
        </span>
      </motion.button>
    </div>
  );
}