import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { cn } from '../lib/utils';
import { Save } from 'lucide-react';

interface EditableContentProps {
  content: string | undefined;
  isEditMode: boolean;
  onUpdate: (val: string) => void;
  className?: string;
  previewClassName?: string;
}

export const EditableContent = ({ 
  content, 
  isEditMode, 
  onUpdate, 
  className,
  previewClassName 
}: EditableContentProps) => {
  const [localValue, setLocalValue] = React.useState(content || '');

  React.useEffect(() => {
    if (content !== undefined) setLocalValue(content);
  }, [content]);

  const processedContent = React.useMemo(() => {
    if (!localValue) return '';
    
    // Normalize newlines
    const normalized = localValue.replace(/\r\n/g, '\n');
    
    // If the user has already explicitly used double newlines, respect their formatting
    if (normalized.includes('\n\n')) return normalized;
    
    // Otherwise, convert single newlines to double newlines to ensure paragraph spacing
    // as requested by the user for readability
    return normalized.replace(/\n/g, '\n\n');
  }, [localValue]);

  if (isEditMode) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm" data-color-mode="light">
          <MDEditor
            value={localValue}
            onChange={(val) => setLocalValue(val || '')}
            preview="edit"
            hideToolbar={false}
            height={200}
            className="!border-none"
          />
        </div>
        <button
          onClick={() => onUpdate(localValue)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Save size={14} />
          Save Changes
        </button>
      </div>
    );
  }

  return (
    <div className={cn("prose prose-slate max-w-none text-[#64748b] text-[16px] leading-[1.6] prose-p:mb-6 last:prose-p:mb-0", previewClassName)}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
