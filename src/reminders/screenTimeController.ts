import * as vscode from 'vscode';
import {
	defaultAnimationType,
	defaultMessageStyle,
	defaultSound,
	getSoundPreset,
	maximumDelayMinutes,
	screenTimeStorageKey
} from './options';
import type { ReminderFlight, ScreenTimeReminder } from './model';
import { pickReminderSound } from './soundPicker';
import { ScreenTimeScheduler } from './screenTimeScheduler';
import { ScreenTimeTreeItem, ScreenTimeTreeProvider } from './screenTimeTreeView';

const validateInterval = (value: string): string | undefined => {
	const minutes = Number(value);
	return Number.isFinite(minutes) && minutes > 0 && minutes <= maximumDelayMinutes
		? undefined
		: `Enter a number between 0 and ${maximumDelayMinutes}.`;
};

export class ScreenTimeController implements vscode.Disposable {
	private reminders: ScreenTimeReminder[];
	private readonly provider: ScreenTimeTreeProvider;
	private readonly scheduler: ScreenTimeScheduler;
	private readonly tree: vscode.TreeView<ScreenTimeTreeItem>;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly showReminder: (reminder: ReminderFlight) => void
	) {
		this.reminders = context.globalState.get<ScreenTimeReminder[]>(screenTimeStorageKey, []);
		this.provider = new ScreenTimeTreeProvider(this.reminders);
		this.scheduler = new ScreenTimeScheduler(
			() => this.reminders,
			reminder => {
				reminder.nextDueAt = Date.now() + reminder.intervalMinutes * 60_000;
				this.persist();
				this.showReminder({
					message: reminder.message,
					sound: getSoundPreset(reminder.sound).id,
					messageStyle: defaultMessageStyle,
					animationType: defaultAnimationType
				});
				this.scheduler.schedule(reminder);
			}
		);
		this.tree = vscode.window.createTreeView('pingMe.screenTime', { treeDataProvider: this.provider });

		context.subscriptions.push(
			this.tree,
			this.provider,
			vscode.commands.registerCommand('pingMe.addScreenTimeReminder', () => this.addReminder()),
			vscode.commands.registerCommand('pingMe.activateScreenTimeReminder', (item: ScreenTimeTreeItem) => this.setActive(item, true)),
			vscode.commands.registerCommand('pingMe.deactivateScreenTimeReminder', (item: ScreenTimeTreeItem) => this.setActive(item, false)),
			vscode.commands.registerCommand('pingMe.deleteScreenTimeReminder', (item: ScreenTimeTreeItem) => this.deleteReminder(item))
		);

		for (const reminder of this.reminders) {
			this.scheduler.schedule(reminder);
		}
	}

	private persist(): void {
		this.provider.refresh(this.reminders);
		void this.context.globalState.update(screenTimeStorageKey, this.reminders);
	}

	private async addReminder(): Promise<void> {
		const message = await vscode.window.showInputBox({
			prompt: 'What should PingMe remind you to do during your screen break?',
			placeHolder: 'Take a break: stretch and rest your eyes.',
			value: 'Take a break: stretch and rest your eyes.',
			validateInput: value => value.trim() ? undefined : 'Enter a reminder message.'
		});
		if (!message?.trim()) {
			return;
		}

		const intervalInput = await vscode.window.showInputBox({
			prompt: 'How often should this screen-time reminder repeat? (minutes)',
			placeHolder: '30',
			value: '30',
			validateInput: validateInterval
		});
		if (!intervalInput) {
			return;
		}

		const sound = await pickReminderSound(defaultSound);
		if (!sound) {
			return;
		}

		const intervalMinutes = Number(intervalInput);
		const reminder: ScreenTimeReminder = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
			message: message.trim(),
			intervalMinutes,
			nextDueAt: Date.now() + intervalMinutes * 60_000,
			active: true,
			sound
		};
		this.reminders = [...this.reminders, reminder];
		this.persist();
		this.scheduler.schedule(reminder);
	}

	private setActive(item: ScreenTimeTreeItem, active: boolean): void {
		const reminder = this.reminders.find(current => current.id === item?.reminder.id);
		if (!reminder) {
			return;
		}

		reminder.active = active;
		if (active && reminder.nextDueAt <= Date.now()) {
			reminder.nextDueAt = Date.now() + reminder.intervalMinutes * 60_000;
		}
		this.persist();
		this.scheduler.schedule(reminder);
	}

	private deleteReminder(item: ScreenTimeTreeItem): void {
		const reminder = this.reminders.find(current => current.id === item?.reminder.id);
		if (!reminder) {
			return;
		}
		this.scheduler.cancel(reminder.id);
		this.reminders = this.reminders.filter(current => current.id !== reminder.id);
		this.persist();
	}

	dispose(): void {
		this.scheduler.dispose();
	}
}
