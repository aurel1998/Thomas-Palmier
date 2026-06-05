import type { AgendaEvent } from "./agendaEvents";
import { mapAgendaRow } from "./dbMappers";
import { isMailerConfigured } from "./mailer";
import { sendAgendaReminder } from "./newsletter";
import { prisma } from "./prisma";

/** Délai cible avant l'événement (24 h). */
export const REMINDER_LEAD_HOURS = 24;

/** Fenêtre autour de 24 h (cron horaire IONOS : 23 h – 25 h). */
export const REMINDER_WINDOW_MS = 60 * 60 * 1000;

export type ReminderProcessResult = {
  configured: boolean;
  due: number;
  processed: number;
  emailsSent: number;
  emailsFailed: number;
  events: { id: string; title: string; sent: number; failed: number; marked: boolean }[];
};

export function getReminderDueWindow(now = new Date()): { from: Date; to: Date } {
  const targetMs = now.getTime() + REMINDER_LEAD_HOURS * 60 * 60 * 1000;
  return {
    from: new Date(targetMs - REMINDER_WINDOW_MS),
    to: new Date(targetMs + REMINDER_WINDOW_MS),
  };
}

/** Événements publiés dont le rappel 24 h doit partir maintenant. */
export async function findEventsDueForReminder(now = new Date()) {
  const { from, to } = getReminderDueWindow(now);
  return prisma.event.findMany({
    where: {
      status: "published",
      reminderEnabled: true,
      reminderSentAt: null,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
  });
}

/**
 * Envoie les rappels dus et marque reminder_sent_at si envoi réussi
 * (ou aucun abonné actif).
 */
export async function processEventReminders(now = new Date()): Promise<ReminderProcessResult> {
  const result: ReminderProcessResult = {
    configured: isMailerConfigured(),
    due: 0,
    processed: 0,
    emailsSent: 0,
    emailsFailed: 0,
    events: [],
  };

  if (!result.configured) return result;

  const rows = await findEventsDueForReminder(now);
  result.due = rows.length;

  for (const row of rows) {
    const event = mapAgendaRow(row) as AgendaEvent;
    const sendResult = await sendAgendaReminder(event);
    result.processed += 1;
    result.emailsSent += sendResult.sent;
    result.emailsFailed += sendResult.failed;

    const shouldMark = sendResult.total === 0 || sendResult.failed === 0;

    if (shouldMark) {
      await prisma.event.update({
        where: { id: row.id },
        data: { reminderSentAt: new Date() },
      });
    }

    result.events.push({
      id: event.id,
      title: event.title,
      sent: sendResult.sent,
      failed: sendResult.failed,
      marked: shouldMark,
    });
  }

  return result;
}
