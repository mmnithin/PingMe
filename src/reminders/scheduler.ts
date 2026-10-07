import type { Reminder } from './model';
import { maximumTimerDelay } from '../shared/options';

export class ReminderScheduler {
	private readonly timers = new Map<string, NodeJS.Timeout>();

	constructor(
		private readonly getReminders: () => Reminder[],
		private readonly onDue: (reminder: Reminder) => void
	) {}

	schedule(reminder: Reminder): void {
		this.cancel(reminder.id);
		if (!reminder.active) {
			return;
		}

		const delay = Math.max(0, reminder.dueAt - Date.now());
		this.timers.set(reminder.id, setTimeout(() => {
			const currentReminder = this.getReminders().find(item => item.id === reminder.id);
			if (!currentReminder?.active) {
				return;
			}
			if (currentReminder.dueAt > Date.now()) {
				this.schedule(currentReminder);
				return;
			}

			this.timers.delete(currentReminder.id);
			this.onDue(currentReminder);
		}, Math.min(delay, maximumTimerDelay)));
	}

	cancel(reminderId: string): void {
		const timer = this.timers.get(reminderId);
		if (timer) {
			clearTimeout(timer);
			this.timers.delete(reminderId);
		}
	}

	dispose(): void {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
	}
}
