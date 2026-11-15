# Task Manager

> Повнофункціональний вебзастосунок для керування командною роботою на React, TypeScript і Node.js.

## Опис проєкту

Task Manager допомагає командам організовувати роботу з проєктами та завданнями. Користувачі можуть створювати команди, керувати учасниками й проєктами, призначати себе виконавцями завдань, обговорювати роботу в коментарях, додавати файли та отримувати сповіщення. Зміни завдань, коментарі й статуси присутності передаються клієнтам у реальному часі.

Застосунок складається з окремих backend- і frontend-репозиторіїв:

- [Backend](https://github.com/Jaegerjaquez52/web-lab)
- [Frontend](https://github.com/Jaegerjaquez52/web-lab-front)

## Функціональність

### Серверна частина

- REST API на Express.js із шарами маршрутів, контролерів і сервісів.
- PostgreSQL та Prisma ORM; версіонування структури БД міграціями.
- Реєстрація та вхід, Argon2id-хешування паролів, JWT access/refresh-токени з ротацією.
- Авторизація маршрутів і ролей.
- CRUD для користувачів, команд, проєктів і завдань; контроль доступу до командних ресурсів.
- Пошук, фільтрування та пагінація завдань.
- Завантаження й видалення файлів із перевіркою типу та розміру.
- Коментарі та персональні сповіщення.
- Socket.IO для подій завдань, коментарів, сповіщень і статусу присутності.
- Swagger UI для документації API.
- Helmet, CORS і обмеження частоти запитів.

### Клієнтська частина

- Реєстрація, вхід, захищені маршрути та профіль користувача.
- Інтерфейси для користувачів, команд, проєктів і завдань.
- Коментарі, файли, сповіщення та live-оновлення через Socket.IO.
- Форми з React Hook Form; Zod-валідація підключена до форм автентифікації та користувачів.
- Zustand для стану автентифікації та TanStack Query для серверних даних.
- Пошук, пагінація, фільтрування завдань і skeleton loaders.
- Drag-and-drop для локального порядку завдань, діаграми станів і календар активності.
- Нескінченне прокручування сповіщень, обрізання зображень і rich-text редактор коментарів.
- Адаптивний інтерфейс, анімації переходів і відкладене завантаження сторінок.
- PWA зі service worker, кешуванням статичних ресурсів і офлайн-сторінкою.

**Поточні обмеження інтерфейсу:** повне редагування завдання ще не реалізовано (доступна зміна статусу та терміну виконання); Zod-схеми не підключені до форм проєктів і завдань. Порядок завдань після перетягування зберігається локально в браузері.

## Технології

| Backend | Frontend |
| --- | --- |
| Node.js 24 LTS, Express 5 | React 19, TypeScript |
| PostgreSQL, Prisma 7 | Vite, Tailwind CSS 4 |
| Socket.IO | React Router 8, Axios, Socket.IO Client |
| JWT, Argon2id | Zustand, TanStack Query |
| Multer, Swagger, Helmet | React Hook Form, Zod, dnd-kit |

## Розгортання

- **Frontend (Vercel):** [web-lab-front-pi.vercel.app](https://web-lab-front-pi.vercel.app/)
- **Backend (Render):** `https://web-lab-6k6v.onrender.com`
- **Swagger UI:** [web-lab-6k6v.onrender.com/api/docs](https://web-lab-6k6v.onrender.com/api/docs)

Безкоштовний екземпляр backend на Render може засинати після періоду неактивності, тому перший запит після паузи може виконуватися довше.

Для production-конфігурації на backend задайте `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`, `FRONTEND_URL`, `API_URL`, `RATE_LIMIT`, `MAX_FILE_SIZE` і `UPLOAD_DIR`. На frontend задайте `VITE_API_URL=https://web-lab-6k6v.onrender.com/api`, `VITE_SOCKET_URL=https://web-lab-6k6v.onrender.com` та, за потреби, `VITE_APP_NAME`.

## Локальне встановлення та запуск

### Вимоги

- Node.js 24 LTS
- npm
- PostgreSQL 14 або новіший

Клонуйте обидва репозиторії:

```bash
git clone https://github.com/Jaegerjaquez52/web-lab.git
git clone https://github.com/Jaegerjaquez52/web-lab-front.git
```

### Backend

```bash
cd web-lab
npm ci
```

Скопіюйте `.env.example` у `.env` і задайте власні значення.

```dotenv
PORT=3000
DATABASE_URL=<рядок-підключення-до-PostgreSQL>
JWT_SECRET=<випадковий-секрет-щонайменше-32-символи>
REFRESH_TOKEN_SECRET=<окремий-випадковий-секрет>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000
RATE_LIMIT=100
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads
```

Застосуйте незастосовані міграції та запустіть сервер:

```bash
npm run db:migrate
npm run dev
```

Інтерактивна документація API буде доступна за адресою `http://localhost:3000/api/docs`.

### Frontend

В іншому терміналі:

```bash
cd web-lab-front
npm ci
```

Скопіюйте `.env.example` у `.env`. Для локального backend залиште або задайте такі значення:

```dotenv
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=Task Manager
```

Запустіть клієнт:

```bash
npm run dev
```

Для підключення до розгорнутого backend використовуйте його адресу з `/api` у `VITE_API_URL` та адресу без `/api` у `VITE_SOCKET_URL`. На backend значення `FRONTEND_URL` має дозволяти origin клієнта.

## Команди перевірки

Backend:

```bash
npm test
npm run db:generate
npm run db:migrate
```

Frontend:

```bash
npm run lint
npm test
npm run build
npm run analyze
```

`npm run analyze` створює звіт складу збірки у `dist/bundle-report.html`.

## Скриншоти

### Розгортання та автентифікація

![Розгортання](./screenshots/00-DEPLOYMENT.png)

![Вхід](./screenshots/01-LOGIN.png)

![Реєстрація](./screenshots/02-REGISTRATION.png)

### Головна сторінка, проєкти та команди

![Головна сторінка](./screenshots/03-MAIN-PAGE.png)

![Проєкти](./screenshots/05-PROJECTS-2.png)

![Команди](./screenshots/06-TEAMS-1.png)

### Користувачі

![Список користувачів](./screenshots/08-USERS.png)

![Сторінка користувача](./screenshots/09-USER-PAGE.png)

![Редагування користувача](./screenshots/10-USER-EDIT.png)

### Сповіщення, завдання та пошук

![Сповіщення](./screenshots/11-NOTIFICATIONS-1.png)

![Список сповіщень](./screenshots/12-NOTIFICATIONS-2.png)

![Завдання](./screenshots/13-TASK-1.png)

![Деталі завдання](./screenshots/14-TASK-2.png)

![Пошук](./screenshots/15-SEARCH.png)

![Фільтрування](./screenshots/16-FILTER.png)

### Мобільна версія

<p align="center">
  <img src="./screenshots/17-MOBILE-LOGIN.jpg" alt="Вхід на мобільному пристрої" width="160" />
  <img src="./screenshots/18-MOBILE-MAIN.jpg" alt="Головна сторінка на мобільному пристрої" width="160" />
  <img src="./screenshots/19-MOBILE-SIDE.jpg" alt="Бічне меню на мобільному пристрої" width="160" />
</p>

### Коментарі, файли та інші можливості

![Коментарі](./screenshots/23-COMMENTS.png)

![Файли](./screenshots/24-FILES.png)

![Попередній перегляд файлу](./screenshots/25-FILES-PREVIEW.png)

![Редагування файлу](./screenshots/26-FILE-EDIT.png)

![Підтвердження видалення](./screenshots/27-DELETE.png)

### Офлайн-сторінка

![Офлайн-сторінка](./screenshots/28-OFFLINE.jpg)

### Тести

![Результати тестів](./screenshots/29-TESTS.png)

## Продуктивність

Lighthouse запущено для [розгорнутої версії](https://web-lab-front-pi.vercel.app/) у **mobile-профілі**. Оцінки, LCP і CLS — середні значення трьох запусків у режимі Navigation. INP виміряно окремо в режимі Timespan під час взаємодії із сайтом.

- Performance / Accessibility / Best Practices / SEO: **98 / 100 / 100 / 100**
- Початкові JS і CSS ресурси (gzip): **154 136 байтів (150,5 KiB)**
- LCP: **2.3с**, CLS: **0.004**
- INP: **50 мс** (Timespan).

`npm run analyze` створює окремий звіт складу збірки у `dist/bundle-report.html`.

## Безпека

- Паролі зберігаються у вигляді Argon2id-хешів.
- Access- і refresh-токени мають обмежений термін дії; refresh-токени ротуються та можуть бути відкликані.
- Сервер перевіряє автентифікацію, ролі та доступ до ресурсів.
- Вхідні дані та завантаження файлів перевіряються на сервері.
- Prisma ORM використовує параметризовані запити.
- Helmet, CORS і rate limiting налаштовані на backend.
- Rich-text вміст очищується перед відображенням; токен клієнта зберігається у localStorage, що слід враховувати при оцінюванні ризиків XSS.

## Тестові дані

Email: user1@x.com
Password: 12341234

## Автор

**Андрій Поліщук**

Група: **ІПЗ-42**

GitHub: [@Jaegerjaquez52](https://github.com/Jaegerjaquez52)
