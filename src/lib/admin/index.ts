import "server-only";

import { databaseUrl, getDb } from "@/lib/db/client";
import { createDbRepo } from "./dbRepo";
import { mockRepo } from "./mockRepo";
import type { ContentRepo } from "./repo";

/** Postgres, если задан POSTGRES_URL; иначе — демо-режим с данными в памяти */
export const repo: ContentRepo = databaseUrl() ? createDbRepo(getDb()) : mockRepo;
