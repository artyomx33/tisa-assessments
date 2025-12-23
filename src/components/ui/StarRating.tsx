import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
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

export function StarRating({
  value,
  max = 4,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const handleClick = () => {
    if (readonly || !onChange) return;
    // Click reduces by 1 until 1, then resets to max
    const newValue = value <= 1 ? max : value - 1;
    onChange(newValue);
  };

  // Display value - if 0 (unset), show as max (starts full)
  const displayValue = value === 0 ? max : value;

  return (
    <motion.button
      type="button"
      disabled={readonly}
      onClick={handleClick}
      whileHover={!readonly ? { scale: 1.05 } : undefined}
      whileTap={!readonly ? { scale: 0.95 } : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full transition-all duration-200',
        'font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sizeClasses[size],
        !readonly && 'cursor-pointer',
        readonly && 'cursor-default',
        // Button styling based on star count
        displayValue === max && 'bg-star-filled/20 text-star-filled border border-star-filled/30',
        displayValue === max - 1 && 'bg-primary/15 text-primary border border-primary/30',
        displayValue === max - 2 && 'bg-accent/15 text-accent border border-accent/30',
        displayValue <= max - 3 && 'bg-muted text-muted-foreground border border-border',
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
              animate={isFilled ? { scale: [1, 1.15, 1] } : { scale: 1 }}
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
  );
}
