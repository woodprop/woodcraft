import "server-only";

import { sql } from "drizzle-orm";
import type { Context } from "grammy";
import { databaseUrl, getDb } from "@/lib/db/client";
import { botSessions, botUpdates } from "@/lib/db/schema";

/**
 * Шаг многошагового диалога: чего бот ждёт от админа следующим сообщением
 * и что уже введено. Хранится между запросами — функция на Vercel ничего не помнит.
 */
export type Flow =
  | { step: "sc.time"; k: string; date: string }
  | { step: "sc.seats"; k: string; start: string; end: string }
  | { step: "g.photo" }
  | { step: "g.cat"; src: string; title?: string }
  | { step: "g.title"; src: string; cat: string }
  | { step: "g.sub"; src: string; cat: string; title: string }
  | { step: "r.name" }
  | { step: "r.format"; name: string }
  | { step: "r.text"; name: string; format: string }
  | { step: "r.made"; name: string; format: string; text: string }
  | { step: "p.price"; what: "m" | "f" | "t" | "c"; r: string }
  | { step: "c.hours"; day: number }
  | { step: "c.reason"; date: string };

export type Step = Flow["step"];
export type FlowAt<S extends Step> = Extract<Flow, { step: S }>;

export type BotContext = Context & {
  flow: Flow | null;
  setFlow(flow: Flow | null): void;
};

/** Обработчики текста на шагах диалога */
export type Steps = { [S in Step]?: (ctx: BotContext, text: string, flow: FlowAt<S>) => Promise<void> };

export function flowAt<S extends Step>(ctx: BotContext, step: S): FlowAt<S> | null {
  return ctx.flow?.step === step ? (ctx.flow as FlowAt<S>) : null;
}

interface FlowStore {
  /**
   * Отметить сообщение обработанным и вернуть текущий шаг диалога.
   * undefined — это сообщение уже обрабатывали: Telegram повторяет его, если ответ задержался.
   * Номера сообщений помним сутки: сравнивать с последним нельзя — после недели тишины
   * Telegram начинает нумерацию со случайного числа.
   */
  claim(chatId: number, updateId: number): Promise<Flow | null | undefined>;
  save(chatId: number, flow: Flow | null): Promise<void>;
}

const dbStore: FlowStore = {
  async claim(chatId, updateId) {
    // заодно чистим старые номера; брошенный на полпути диалог забываем через сутки
    const res = await getDb().execute(sql`with
      purge as (delete from ${botUpdates} where created_at < now() - interval '1 day'),
      added as (insert into ${botUpdates} (update_id) values (${updateId}) on conflict do nothing returning update_id)
      select (select count(*) from added)::int as fresh,
        (select state from ${botSessions} where chat_id = ${chatId} and updated_at > now() - interval '1 day') as state`);
    // postgres.js отдаёт массив строк, другие драйверы — { rows }
    const [row] = (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as { fresh: number; state: Flow | null }[];
    return row.fresh ? (row.state ?? null) : undefined;
  },
  async save(chatId, flow) {
    await getDb()
      .insert(botSessions)
      .values({ chatId, state: flow })
      .onConflictDoUpdate({ target: botSessions.chatId, set: { state: flow, updatedAt: sql`now()` } });
  },
};

// демо-режим без базы — в памяти процесса
const g = globalThis as typeof globalThis & { __woodcraftBot?: { flows: Map<number, Flow | null>; seen: number[] } };
const memory = () => (g.__woodcraftBot ??= { flows: new Map(), seen: [] as number[] });

const memoryStore: FlowStore = {
  async claim(chatId, updateId) {
    const m = memory();
    if (m.seen.includes(updateId)) return undefined;
    m.seen = [...m.seen.slice(-200), updateId];
    return m.flows.get(chatId) ?? null;
  },
  async save(chatId, flow) {
    memory().flows.set(chatId, flow);
  },
};

export const flowStore = (): FlowStore => (databaseUrl() ? dbStore : memoryStore);
