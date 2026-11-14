export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Про продукт</p>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Плануйте роботу команди в одному просторі.</h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Task Manager допомагає організовувати проєкти, розподіляти завдання між учасниками та відстежувати перебіг роботи.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-900 dark:text-white">Зрозумілий процес</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Кожне завдання має проєкт, відповідального та актуальний статус.</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-semibold text-slate-900 dark:text-white">Спільна робота</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Коментарі, файли та сповіщення допомагають команді залишатися на зв’язку.</p>
        </article>
      </div>
    </section>
  );
}