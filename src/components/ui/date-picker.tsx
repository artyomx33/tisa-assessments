import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ value, onChange, placeholder = "Select date", disabled, minDate, maxDate, className }, ref) => {
    return (
      <div className={cn("relative", className)}>
        <ReactDatePicker
          selected={value}
          onChange={onChange}
          dateFormat="dd-MM-yyyy"
          placeholderText={placeholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          yearDropdownItemNumber={30}
          scrollableYearDropdown
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10"
          )}
          wrapperClassName="w-full"
          calendarClassName="tisa-datepicker"
          popperClassName="z-50"
        />
        <CalendarDays className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
