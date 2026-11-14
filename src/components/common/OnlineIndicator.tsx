interface OnlineIndicatorProps {
  online: boolean;
}

export default function OnlineIndicator({ online }: OnlineIndicatorProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
      {online ? 'У мережі' : 'Не в мережі'}
    </span>
  );
}
