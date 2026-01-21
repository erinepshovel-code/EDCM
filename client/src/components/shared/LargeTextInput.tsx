import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';

interface LargeTextInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
}

export function LargeTextInput({ value, onChange, placeholder, label }: LargeTextInputProps) {
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onChange(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        {label && <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</label>}
        <div className="flex gap-2">
           <div className="relative">
             <input 
               type="file" 
               accept=".txt,.md,.json" 
               className="absolute inset-0 opacity-0 cursor-pointer" 
               onChange={handleFileUpload}
             />
             <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
               <Upload className="h-3 w-3" />
               Import
             </Button>
           </div>
           {value && (
             <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive" onClick={() => onChange('')}>
               <X className="h-3 w-3" />
               Clear
             </Button>
           )}
        </div>
      </div>
      
      <div className="relative group">
        <Textarea 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] font-mono text-sm leading-relaxed resize-y p-4 bg-card/50 hover:bg-card/80 transition-colors border-border/50 focus-visible:ring-primary/20"
        />
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/50 pointer-events-none">
          {wordCount} words
        </div>
      </div>
    </div>
  );
}
