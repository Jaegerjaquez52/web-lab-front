import { useEffect, useId, useRef, useState } from 'react';
import Input from './Input';

export interface SelectOption {
  id: number;
  label: string;
  description?: string;
}

interface SearchableMultiSelectProps {
  label: string;
  options: SelectOption[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
}

export default function SearchableMultiSelect({
  label,
  options,
  selectedIds,
  onChange,
  placeholder = 'Пошук...',
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const filteredOptions = options.filter((option) => (
    `${option.label} ${option.description ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  ));
  const selected = options.filter((option) => selectedIds.includes(option.id));

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  function toggle(id: number) {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id]);
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div className="relative">
        <Input
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${inputId}-options`}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearch(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
            if (event.key === 'Enter' && filteredOptions[0]) {
              event.preventDefault();
              toggle(filteredOptions[0].id);
            }
          }}
        />
        {open && (
          <ul
            id={`${inputId}-options`}
            role="listbox"
            aria-label={label}
            aria-multiselectable="true"
            className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {filteredOptions.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => toggle(option.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{option.label}</span>
                      {option.description && <span className="block truncate text-xs text-slate-500">{option.description}</span>}
                    </span>
                    <span aria-hidden="true" className={isSelected ? 'text-blue-600' : 'text-slate-300'}>
                      {isSelected ? '✓' : '+'}
                    </span>
                  </button>
                </li>
              );
            })}
            {!filteredOptions.length && <li role="presentation" className="px-3 py-2 text-sm text-slate-500">Нічого не знайдено</li>}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <ul aria-label="Обрані" className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300"
                aria-label={`Прибрати ${option.label}`}
                onClick={() => toggle(option.id)}
              >
                {option.label} ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
