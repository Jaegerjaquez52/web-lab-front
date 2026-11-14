import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';

import api from '@/services/api';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import Tabs from '@/components/common/Tabs';
import type { PaginatedResponse } from '@/types/api.types';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { useAuthStore } from '@/stores/authStore';

interface Comment {
  id: number;
  text: string;
  taskId: number;
  createdAt: string;
  user: { id: number; name: string };
}

interface UploadedFile {
  id: number;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: number;
}

const ImageCropper = lazy(() => import('@/components/common/ImageCropper'));
const RichTextEditor = lazy(() => import('@/components/common/RichTextEditor'));

export default function TaskDetails({ taskId }: { taskId: number }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [activePreview, setActivePreview] = useState<{ file: UploadedFile; url: string } | null>(null);
  const [activeTab, setActiveTab] = useState('comments');
  const previewDialog = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, setValue } = useForm<{ text: string }>({ defaultValues: { text: '' } });
  const commentText = useWatch({ control, name: 'text' });
  const comments = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => (await api.get<PaginatedResponse<Comment>>('/comments', { params: { taskId, limit: 50 } })).data,
  });
  const files = useQuery({
    queryKey: ['files', taskId],
    queryFn: async () => (await api.get<PaginatedResponse<UploadedFile>>('/files', { params: { taskId, limit: 50 } })).data,
  });
  useSocketEvent('comment:created', (comment: Comment) => {
    if (comment.taskId === taskId) void queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
  });
  useSocketEvent('comment:deleted', (event: { taskId: number }) => {
    if (event.taskId === taskId) void queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
  });
  const comment = useMutation({
    mutationFn: (text: string) => api.post('/comments', { taskId, text }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      reset();
    },
    onError: () => toast.error('Не вдалося додати коментар'),
  });
  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      body.append('taskId', String(taskId));
      return api.post('/files/upload', body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['files', taskId] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error) => {
      const message = axios.isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined;
      toast.error(message || 'Не вдалося завантажити файл');
    },
  });
  const removeFile = useMutation({
    mutationFn: (id: number) => api.delete(`/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files', taskId] }),
    onError: () => toast.error('Не вдалося видалити файл'),
  });
  const openFile = useMutation({
    mutationFn: async (file: UploadedFile) => {
      const { data } = await api.get<Blob>(`/files/${file.id}`, { responseType: 'blob' });
      return { file, url: URL.createObjectURL(data) };
    },
    onSuccess: setActivePreview,
    onError: () => toast.error('Не вдалося відкрити файл'),
  });

  useEffect(() => {
    if (activePreview && previewDialog.current && !previewDialog.current.open) {
      previewDialog.current.showModal();
    }
  }, [activePreview]);

  useEffect(() => {
    if (!activePreview) return;
    return () => URL.revokeObjectURL(activePreview.url);
  }, [activePreview]);

  return (
    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
      <Tabs
        activeId={activeTab}
        onChange={setActiveTab}
        items={[
          {
            id: 'comments',
            label: 'Коментарі',
            content: (
              <section>
                <form className="mb-3 space-y-3" onSubmit={handleSubmit(({ text }) => {
                  const plainText = new DOMParser().parseFromString(text, 'text/html').body.textContent?.trim();
                  if (plainText) comment.mutate(text);
                })}>
                  <Suspense fallback={<div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}>
                    <RichTextEditor
                      label="Новий коментар"
                      value={commentText ?? ''}
                      onChange={(value) => setValue('text', value, { shouldValidate: true })}
                    />
                  </Suspense>
                  <div className="flex justify-end">
                    <Button type="submit" isLoading={comment.isPending} disabled={!commentText?.trim()}>Надіслати</Button>
                  </div>
                </form>
                {comments.isError && <p role="alert" className="mb-3 text-sm text-red-500">Не вдалося завантажити коментарі</p>}
                <ul className="space-y-2">
                  {comments.data?.data.map((item) => (
                    <li key={item.id} className="rounded bg-gray-50 p-3 text-sm dark:bg-gray-800">
                      <strong>{item.user.name}:</strong>
                      <div className="prose prose-sm mt-1 max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.text) }} />
                    </li>
                  ))}
                </ul>
              </section>
            ),
          },
          {
            id: 'files',
            label: 'Файли',
            content: (
              <section>
                <form className="mb-3 flex flex-wrap items-center gap-2" onSubmit={(event) => {
                  event.preventDefault();
                  if (selectedFile) upload.mutate(selectedFile);
                }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    aria-label="Вибрати файл для завантаження"
                    tabIndex={-1}
                    accept=".jpg,.jpeg,.png,.gif,.pdf,image/jpeg,image/png,image/gif,application/pdf"
                    onChange={(event) => {
                      setSelectedFile(event.target.files?.[0] ?? null);
                      setCropFile(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-500 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 dark:border-blue-500/60 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20"
                  >
                    <Icon name="plus" size={17} />
                    Додати файл
                  </button>
                  <span className="max-w-52 truncate text-sm text-slate-500 dark:text-slate-400" title={selectedFile?.name}>
                    {selectedFile?.name ?? 'Файл не вибрано'}
                  </span>
                  <Button type="submit" disabled={!selectedFile} isLoading={upload.isPending}>Завантажити</Button>
                  {selectedFile?.type.startsWith('image/') && (
                    <Button type="button" variant="secondary" disabled={upload.isPending} onClick={() => setCropFile(selectedFile)}>
                      Обрізати зображення
                    </Button>
                  )}
                </form>
                {cropFile && (
                  <div className="mb-4">
                    <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />}>
                      <ImageCropper
                        file={cropFile}
                        onCancel={() => setCropFile(null)}
                        onComplete={(blob) => {
                          const croppedFile = new File(
                            [blob],
                            `${cropFile.name.replace(/\.[^.]+$/, '')}-cropped.jpg`,
                            { type: 'image/jpeg' }
                          );
                          setCropFile(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          upload.mutate(croppedFile);
                        }}
                      />
                    </Suspense>
                  </div>
                )}
                <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Файли додаються до завдання, а не до окремого коментаря. Підтримуються JPG, PNG, GIF і PDF до 5 МБ.
                </p>
                {files.isError && <p role="alert" className="mb-3 text-sm text-red-500">Не вдалося завантажити список файлів</p>}
                <ul className="space-y-2">
                  {files.data?.data.map((file) => (
                    <li key={file.id} className="flex min-w-0 items-center gap-2 rounded bg-gray-50 p-2 text-sm dark:bg-gray-800">
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-primary-600 hover:underline disabled:opacity-50"
                        title={file.originalName}
                        disabled={openFile.isPending}
                        onClick={() => openFile.mutate(file)}
                      >
                        {file.originalName}
                      </button>
                      {(user?.role === 'ADMIN' || user?.id === file.uploadedBy) && (
                        <span className="shrink-0">
                          <Button size="sm" variant="danger" onClick={() => removeFile.mutate(file.id)}>Видалити</Button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          },
        ]}
      />
      {activePreview && (
        <dialog
          ref={previewDialog}
          aria-labelledby="file-preview-title"
          className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-5xl overflow-hidden rounded-xl border-0 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/70 dark:bg-gray-900 dark:text-gray-100"
          onClose={() => setActivePreview(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) event.currentTarget.close();
          }}
        >
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h2 id="file-preview-title" className="truncate font-semibold">{activePreview.file.originalName}</h2>
            <Button type="button" size="sm" onClick={() => previewDialog.current?.close()}>Закрити</Button>
          </div>
          <div className="max-h-[calc(90vh-4rem)] overflow-auto p-4">
            {activePreview.file.mimetype.startsWith('image/') ? (
              <img src={activePreview.url} alt={activePreview.file.originalName} className="mx-auto max-h-[calc(90vh-7rem)] max-w-full object-contain" />
            ) : activePreview.file.mimetype === 'application/pdf' ? (
              <iframe title={activePreview.file.originalName} src={activePreview.url} className="h-[75vh] w-full" />
            ) : (
              <p className="text-sm">
                Перегляд цього типу файлу недоступний.{' '}
                <a href={activePreview.url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                  Відкрити файл в окремій вкладці
                </a>
              </p>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}
