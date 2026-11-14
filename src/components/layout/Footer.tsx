export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 px-4 py-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <p>© {new Date().getFullYear()} Task Manager <span className="mx-1.5">·</span> Командний простір <span className="mx-1.5">·</span> Контакти: info@example.com</p>
    </footer>
  );
}