import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { cn } from '../lib/utils';
import { Save } from 'lucide-react';

interface EditableContentProps {
  content: string | undefined;
  defaultText?: string;
  isEditMode: boolean;
  onUpdate: (val: string) => void;
  onReset?: () => void;
  className?: string;
  previewClassName?: string;
}

export const EditableContent = ({ 
  content, 
  defaultText,
  isEditMode, 
  onUpdate, 
  onReset,
  className,
  previewClassName 
}: EditableContentProps) => {
  const [localValue, setLocalValue] = React.useState(content || '');

  React.useEffect(() => {
    if (content !== undefined) setLocalValue(content);
  }, [content]);

  const processedContent = React.useMemo(() => {
    if (!localValue) return '';
    
    const normalized = localValue.replace(/\r\n/g, '\n');
    if (normalized.includes('\n\n')) return normalized;
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
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onUpdate(localValue)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Save size={14} />
            Update Section
          </button>
          
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold hover:bg-gray-200 transition-all border border-gray-200"
            >
              Back to Default
            </button>
          )}
        </div>
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
