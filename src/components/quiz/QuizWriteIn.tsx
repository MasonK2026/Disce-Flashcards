import { useState, useRef, useEffect } from 'react';
import { CornerDownLeft } from 'lucide-react';

interface QuizWriteInProps {
  isAnswered: boolean;
  onSubmit: (answer: string) => void;
}

export function QuizWriteIn({ isAnswered, onSubmit }: QuizWriteInProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    if (!isAnswered) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isAnswered]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!value.trim() || isAnswered) return;
    onSubmit(value.trim());
  };

  const handleInsertMacron = (char: string) => {
    if (isAnswered) return;
    const input = inputRef.current;
    if (!input) {
      setValue(prev => prev + char);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = value.substring(0, start) + char + value.substring(end);
    setValue(newValue);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    }, 10);
  };

  const macrons = ['ā', 'ē', 'ī', 'ō', 'ū'];

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          disabled={isAnswered}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full px-4 py-3.5 pr-24 rounded-xl border bg-background text-foreground text-lg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition shadow-inner disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={!value.trim() || isAnswered}
          className="absolute right-2.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center space-x-1 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
        >
          <span>Submit</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Macron quick-type toolbar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span className="text-[11px] font-medium">Quick macrons:</span>
        <div className="flex items-center space-x-1.5">
          {macrons.map((m) => (
            <button
              key={m}
              type="button"
              disabled={isAnswered}
              onClick={() => handleInsertMacron(m)}
              className="w-7 h-7 rounded-md border bg-card hover:bg-muted text-foreground font-bold flex items-center justify-center transition disabled:opacity-50"
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
