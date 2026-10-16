// Меню команд бота. Без "server-only": нужен и скриптам scripts/bot-*.ts.

export const BOT_COMMANDS = [
  { command: "menu", description: "Главное меню" },
  { command: "schedule", description: "Расписание мастер-классов" },
  { command: "gallery", description: "Галерея работ" },
  { command: "reviews", description: "Отзывы" },
  { command: "prices", description: "Цены" },
  { command: "coworking", description: "Часы работы коворкинга" },
  { command: "undo", description: "Отменить последнее изменение" },
  { command: "cancel", description: "Прервать текущее действие" },
];
