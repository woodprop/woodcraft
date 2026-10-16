# WoodCraft — сайт столярной мастерской

Лендинг на Next.js 16 (App Router, TypeScript, CSS Modules). Статическая страница + API-маршрут для заявок.

## Запуск

```bash
npm install
cp .env.example .env.local   # заполнить для отправки заявок
npm run dev                  # http://localhost:3000
npm run build && npm start   # продакшен
```

Без `RESEND_API_KEY` в режиме разработки заявки пишутся в консоль сервера; в продакшене форма покажет ошибку, пока почта не настроена.

## Где что лежит

| Что | Где |
| --- | --- |
| Мастер-классы, цены, коворкинг, галерея, отзывы, SEO | БД, редактируются в `/admin` (исходные данные — `src/content/ru/*.json`) |
| Мастера, FAQ | `src/content/ru/masters.json`, `faq.json` |
| Контакты, варианты в формах | `src/content/ru/settings.json` |
| Тексты секций и форм | `src/i18n/ru.ts` (`*текст*` — выделение маркером) |
| Фото | `public/images` |
| Дизайн-токены, кнопки, сетка секций | `src/app/globals.css` |
| Секции страницы | `src/components/sections` |
| Модальные окна и формы | `src/components/modals` |
| Приём заявок → email | `src/app/api/lead/route.ts` |

Все данные читаются через `getContent()` (`src/lib/content.ts`): редактируемые — из хранилища админки (`src/lib/admin`), остальные — из JSON. Результат кэшируется, сохранение в админке сбрасывает кэш.

Значения в квадратных скобках (`[телефон]`, `[улица, дом]` …) — заглушки, на сайте подсвечиваются. Пустые ссылки на мессенджеры ведут к блоку контактов.

## Админка и база данных

Админка — `/admin`, вход по паролю `ADMIN_PASSWORD`. Мероприятия, цены, расписание коворкинга, галерея, отзывы и SEO хранятся в Postgres (Supabase), загруженные фото — в Vercel Blob. Мастера, FAQ и контакты по-прежнему в `src/content/ru/*.json`.

Без `POSTGRES_URL` админка работает в демо-режиме: данные в памяти сервера, сбрасываются при перезапуске.

Подключение:

1. Создать проект в Supabase (регион Frankfurt) и подключить его к проекту Vercel через Marketplace — переменные `POSTGRES_URL*` пропишутся сами. Либо скопировать строки подключения в `.env.local` вручную (см. `.env.example`).
2. В Vercel → Storage создать **публичный** Blob store и подключить к проекту (вкладка store → Projects). Vercel задаст `BLOB_STORE_ID`, токен доступа SDK получает сам (OIDC); локально его даёт `vercel env pull` — он живёт около 12 часов, потом команду нужно повторить.
3. Создать таблицы и заполнить их исходными данными из JSON:

```bash
npm run db:migrate
npm run db:seed        # если база не пустая — ничего не делает; перезаписать: npm run db:seed -- --force
```

| Что | Где |
| --- | --- |
| Схема таблиц | `src/lib/db/schema.ts` |
| Миграции (SQL) | `drizzle/` — после изменения схемы: `npm run db:generate`, затем `npm run db:migrate` |
| Чтение и запись данных | `src/lib/admin/dbRepo.ts` |
| Загрузка фото | `src/lib/admin/storage.ts` |

После каждого сохранения в таблицу `snapshots` пишется копия всех данных (хранятся последние 30) — из неё можно восстановить данные после ошибки в админке.

Supabase Free ставит проект на паузу после недели без запросов к базе. Сайт при этом продолжает показывать последние данные из кэша, а админка — сообщение об ошибке. Разморозить: панель Supabase → проект → Resume project.

## Telegram-бот

Бот правит те же данные, что и `/admin`, с телефона: расписание мастер-классов (даты, свободные места, скрыть/показать), галерею (прислать фото → категория → название), отзывы, цены, часы работы коворкинга и закрытые даты. Команда `/undo` отменяет последнее изменение, в том числе сделанное в веб-админке. Тексты описаний, SEO, тарифы и категории галереи по-прежнему правятся в `/admin`.

Пускает только Telegram ID из `TELEGRAM_ADMIN_IDS`, права у всех одинаковые. Без базы (демо-режим) бот тоже работает, но и данные, и шаги диалога живут в памяти сервера — на Vercel так пользоваться нельзя.

Подключение боевого бота:

1. В @BotFather создать бота (`/newbot`), взять токен.
2. В Vercel → Settings → Environment Variables задать `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` и `TELEGRAM_ADMIN_IDS` (см. `.env.example`), передеплоить.
3. Применить миграцию с таблицами бота: `npm run db:migrate`.
4. Зарегистрировать webhook и меню команд — один раз после деплоя (и после смены адреса сайта или секрета):

```bash
# в PowerShell: $env:TELEGRAM_BOT_TOKEN="…"; $env:TELEGRAM_WEBHOOK_SECRET="…"
npm run bot:setup -- https://адрес-сайта
```

Переменные можно не задавать вручную, если они есть в `.env.production.local` (`vercel env pull .env.production.local --environment=production`).

Свой Telegram ID бот покажет сам: напишите ему, не будучи в списке админов.

Локальная разработка — с **отдельным** dev-ботом (боевой нельзя: он работает через webhook). Его токен, секрет и свой ID — в `.env.development.local` (Next.js читает его раньше `.env.local`). Чтобы не менять боевые данные, там же задайте пустые `POSTGRES_URL=`, `POSTGRES_URL_NON_POOLING=`, `BLOB_STORE_ID=`, `BLOB_READ_WRITE_TOKEN=` — сайт и бот уйдут в демо-режим. Затем в двух терминалах:

```bash
npm run dev
npm run bot:dev   # забирает сообщения dev-бота и пересылает их в http://localhost:3000/api/telegram
```

| Что | Где |
| --- | --- |
| Webhook | `src/app/api/telegram/route.ts` |
| Бот: меню и отмена (`menu.ts`), разделы (`schedule.ts`, `gallery.ts`, `reviews.ts`, `prices.ts`, `coworking.ts`) | `src/lib/bot/` |
| Шаг диалога и защита от повторов (таблицы `bot_sessions`, `bot_updates`) | `src/lib/bot/state.ts` |

## Модальные окна

У каждой модалки свой адрес — ссылку можно отправить клиенту:

- `/?book=masterclass&id=board` — запись на конкретный мастер-класс (`id` из `masterclasses.json`)
- `/?book=coworking&tariff=day` — бронь коворкинга с выбранным тарифом
- `/?book=certificate`, `/?book=corporate`, `/?book=family`

## Языки

Сейчас только `ru`. Для нового языка: скопировать `src/i18n/ru.ts` и `src/content/ru/`, перевести, добавить локаль в `src/i18n/index.ts` и `src/lib/content.ts`, затем вынести страницу в `app/[lang]/`.
