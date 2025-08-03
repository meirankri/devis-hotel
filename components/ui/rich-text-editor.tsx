'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Écrivez votre description...',
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-2 rounded hover:bg-gray-100 transition-colors',
        isActive && 'bg-gray-200'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <div className="border-b bg-gray-50 p-2 flex items-center gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none [&_.ProseMirror]:min-h-[150px] [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  );
}