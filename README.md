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
| Расписание мастер-классов (даты, места, цены) | `src/content/ru/masterclasses.json` |
| Галерея, отзывы, мастера, FAQ | `src/content/ru/*.json` |
| Контакты, тарифы коворкинга, варианты в формах | `src/content/ru/settings.json` |
| Тексты секций и форм | `src/i18n/ru.ts` (`*текст*` — выделение маркером) |
| Фото | `public/images` |
| Дизайн-токены, кнопки, сетка секций | `src/app/globals.css` |
| Секции страницы | `src/components/sections` |
| Модальные окна и формы | `src/components/modals` |
| Приём заявок → email | `src/app/api/lead/route.ts` |

Все данные читаются через `getContent()` (`src/lib/content.ts`). При переходе на админку с БД меняется только эта функция.

Значения в квадратных скобках (`[телефон]`, `[улица, дом]` …) — заглушки, на сайте подсвечиваются. Пустые ссылки на мессенджеры ведут к блоку контактов.

## Модальные окна

У каждой модалки свой адрес — ссылку можно отправить клиенту:

- `/?book=masterclass&id=board` — запись на конкретный мастер-класс (`id` из `masterclasses.json`)
- `/?book=coworking&tariff=day` — бронь коворкинга с выбранным тарифом
- `/?book=certificate`, `/?book=corporate`, `/?book=family`

## Языки

Сейчас только `ru`. Для нового языка: скопировать `src/i18n/ru.ts` и `src/content/ru/`, перевести, добавить локаль в `src/i18n/index.ts` и `src/lib/content.ts`, затем вынести страницу в `app/[lang]/`.
