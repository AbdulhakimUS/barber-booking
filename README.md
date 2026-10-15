# barber-booking

Сайт барбершопа **ЦЕХ**: онлайн-запись, личный кабинет клиента, панель барбера и админка.

Админка: `/admin`

## Локально

```bash
npm install --prefix client
npm install --prefix server
```

В `server/.env` — ключи Supabase (см. `server/.env.example`).

В SQL Editor Supabase по очереди:

1. `supabase/schema.sql`
2. `supabase/translations.sql`

Затем:

```bash
npm run seed
npm run dev
```
