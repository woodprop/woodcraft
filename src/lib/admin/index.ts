import "server-only";

import { mockRepo } from "./mockRepo";
import type { ContentRepo } from "./repo";

/** Текущая реализация хранилища. Подключение БД = замена этой строки. */
export const repo: ContentRepo = mockRepo;
