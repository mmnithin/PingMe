import type { ScreenTimeReminder } from './model';
import { maximumTimerDelay } from './options';

export class ScreenTimeScheduler {
	private readonly timers = new Map<string, NodeJS.Timeout>();

	constructor(
		private readonly getReminders: () => ScreenTimeReminder[],
		private readonly onInterval: (reminder: ScreenTimeReminder) => void
	) {}

	schedule(reminder: ScreenTimeReminder): void {
		this.cancel(reminder.id);
		if (!reminder.active) {
			return;
		}

		const delay = Math.max(0, reminder.nextDueAt - Date.now());
		this.timers.set(reminder.id, setTimeout(() => {
			const currentReminder = this.getReminders().find(item => item.id === reminder.id);
			if (!currentReminder?.active) {
				return;
			}
			if (currentReminder.nextDueAt > Date.now()) {
				this.schedule(currentReminder);
				return;
			}

			this.timers.delete(currentReminder.id);
			this.onInterval(currentReminder);
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
