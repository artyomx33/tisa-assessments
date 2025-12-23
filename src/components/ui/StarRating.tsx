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
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function StarRating({
  value,
  max = 4,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (readonly || !onChange) return;
    // Toggle: if clicking same star, reduce by 1, otherwise set to clicked star
    const newValue = index + 1 === value ? index : index + 1;
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const isFilled = index < value;
        
        return (
          <motion.button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(index)}
            whileHover={!readonly ? { scale: 1.15 } : undefined}
            whileTap={!readonly ? { scale: 0.95 } : undefined}
            className={cn(
              'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
              !readonly && 'cursor-pointer hover:opacity-80',
              readonly && 'cursor-default'
            )}
          >
            <motion.div
              initial={false}
              animate={isFilled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-200',
                  isFilled
                    ? 'fill-star-filled text-star-filled drop-shadow-sm'
                    : 'fill-transparent text-star-empty'
                )}
              />
            </motion.div>
          </motion.button>
        );
      })}
    </div>
  );
}
