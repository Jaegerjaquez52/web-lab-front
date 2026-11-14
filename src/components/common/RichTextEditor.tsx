import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, protocols: ['http', 'https', 'mailto'] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        'aria-label': label,
        class: 'min-h-28 rounded-b-xl border border-t-0 border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return <div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />;

  return (
    <div className="overflow-hidden rounded-xl">
      <div role="toolbar" aria-label="Форматування тексту" className="flex flex-wrap gap-1 rounded-t-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
        <button type="button" aria-label="Напівжирний" aria-pressed={editor.isActive('bold')} className="rounded px-2 py-1 text-sm font-bold hover:bg-white dark:hover:bg-slate-700" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" aria-label="Курсив" aria-pressed={editor.isActive('italic')} className="rounded px-2 py-1 text-sm italic hover:bg-white dark:hover:bg-slate-700" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" aria-label="Список" aria-pressed={editor.isActive('bulletList')} className="rounded px-2 py-1 text-sm hover:bg-white dark:hover:bg-slate-700" onClick={() => editor.chain().focus().toggleBulletList().run()}>Список</button>
        <button
          type="button"
          aria-label="Додати посилання"
          className="rounded px-2 py-1 text-sm hover:bg-white dark:hover:bg-slate-700"
          onClick={() => {
            const current = editor.getAttributes('link').href as string | undefined;
            const href = window.prompt('Введіть адресу посилання', current ?? 'https://');
            if (href === null) return;
            if (!href.trim()) editor.chain().focus().unsetLink().run();
            else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
          }}
        >
          Посилання
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
