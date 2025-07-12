import * as React from "react"

import { cn } from "@/lib/utils"
import { Upload } from "lucide-react";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-background/50 backdrop-blur-sm px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

interface CustomFileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const CustomFileInput: React.FC<CustomFileInputProps> = ({ label = "Choose File", className, id, ...props }) => {
  const [fileName, setFileName] = React.useState<string>("");
  const autoId = React.useId();
  const inputId = id || autoId;

  return (
    <div className="flex items-center gap-3">
      <input
        id={inputId}
        type="file"
        className="hidden"
        onChange={e => {
          setFileName(e.target.files?.[0]?.name || "");
          props.onChange?.(e);
        }}
        {...props}
      />
      <label
        htmlFor={inputId}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium cursor-pointer shadow hover:bg-blue-700 transition-colors duration-150"
        style={{ userSelect: 'none' }}
      >
        <Upload className="w-5 h-5" />
        <span>{label}</span>
      </label>
      <span className="text-sm text-white/80 truncate max-w-[180px]">{fileName}</span>
    </div>
  );
};

export { Input }
