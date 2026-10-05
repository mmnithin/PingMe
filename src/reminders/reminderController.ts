import * as vscode from 'vscode';
import {
	defaultAnimationType,
	defaultMessageStyle,
	defaultSound,
	getAnimationType,
	getMessageStyle,
	getSoundPreset,
	maximumDelayMinutes,
	messageStyles,
	reminderStorageKey,
	toReminderFlight
} from './options';
import type { Reminder, ReminderFlight } from './model';
import { pickAnimationType } from './animationPicker';
import { pickReminderSound } from './soundPicker';
import { ReminderScheduler } from './scheduler';
import { ReminderTreeItem, ReminderTreeProvider } from './reminderTreeView';

const validateDelay = (value: string): string | undefined => {
	const minutes = Number(value);
	return Number.isFinite(minutes) && minutes > 0 && minutes <= maximumDelayMinutes
		? undefined
		: `Enter a number between 0 and ${maximumDelayMinutes}.`;
};

export class ReminderController implements vscode.Disposable {
	private reminders: Reminder[];
	private readonly provider: ReminderTreeProvider;
	private readonly scheduler: ReminderScheduler;
	private readonly tree: vscode.TreeView<ReminderTreeItem>;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly showReminder: (reminder: ReminderFlight) => void
	) {
		this.reminders = context.globalState.get<Reminder[]>(reminderStorageKey, []);
		this.provider = new ReminderTreeProvider(this.reminders);
		this.scheduler = new ReminderScheduler(
			() => this.reminders,
			reminder => {
				reminder.active = false;
				this.persist();
				this.showReminder(toReminderFlight(reminder));
			}
		);
		this.tree = vscode.window.createTreeView('pingMe.reminders', { treeDataProvider: this.provider });

		context.subscriptions.push(
			this.tree,
			this.provider,
			vscode.commands.registerCommand('pingMe.addReminder', () => this.addReminder()),
			vscode.commands.registerCommand('pingMe.activateReminder', (item: ReminderTreeItem) => this.setActive(item, true)),
			vscode.commands.registerCommand('pingMe.deactivateReminder', (item: ReminderTreeItem) => this.setActive(item, false)),
			vscode.commands.registerCommand('pingMe.deleteReminder', (item: ReminderTreeItem) => this.deleteReminder(item)),
			vscode.commands.registerCommand('pingMe.customizeReminder', (item: ReminderTreeItem) => this.customizeReminder(item))
		);

		for (const reminder of this.reminders) {
			this.scheduler.schedule(reminder);
		}
	}

	private persist(): void {
		this.provider.refresh(this.reminders);
		void this.context.globalState.update(reminderStorageKey, this.reminders);
	}

	private async addReminder(): Promise<void> {
		const message = await vscode.window.showInputBox({
			prompt: 'What should PingMe remind you about?',
			placeHolder: 'Reminder message',
			validateInput: value => value.trim() ? undefined : 'Enter a reminder message.'
		});
		if (!message?.trim()) {
			return;
		}

		const minutesInput = await vscode.window.showInputBox({
			prompt: 'How many minutes from now?',
			placeHolder: '10',
			validateInput: validateDelay
		});
		if (!minutesInput) {
			return;
		}

		const sound = await pickReminderSound(defaultSound);
		if (!sound) {
			return;
		}
		const animationType = await pickAnimationType(defaultAnimationType);
		if (!animationType) {
			return;
		}

		const reminder: Reminder = {
			id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
			message: message.trim(),
			dueAt: Date.now() + Number(minutesInput) * 60_000,
			active: true,
			sound,
			messageStyle: defaultMessageStyle,
			animationType
		};
		this.reminders = [...this.reminders, reminder];
		this.persist();
		this.scheduler.schedule(reminder);
	}

	private async setActive(item: ReminderTreeItem, active: boolean): Promise<void> {
		const reminder = this.reminders.find(current => current.id === item?.reminder.id);
		if (!reminder) {
			return;
		}

		if (active && reminder.dueAt <= Date.now()) {
			const minutesInput = await vscode.window.showInputBox({
				prompt: 'This reminder is overdue. Set a new delay in minutes.',
				placeHolder: '10',
				validateInput: validateDelay
			});
			if (!minutesInput) {
				return;
			}
			reminder.dueAt = Date.now() + Number(minutesInput) * 60_000;
		}

		reminder.active = active;
		this.persist();
		this.scheduler.schedule(reminder);
	}

	private async customizeReminder(item: ReminderTreeItem): Promise<void> {
		const reminder = this.reminders.find(current => current.id === item?.reminder.id);
		if (!reminder) {
			return;
		}

		const property = await vscode.window.showQuickPick([
			{ label: 'Reminder sound', detail: `Current: ${getSoundPreset(reminder.sound).label}`, value: 'sound' as const },
			{ label: 'Message banner style', detail: `Current: ${getMessageStyle(reminder.messageStyle).label}`, value: 'style' as const },
			{ label: 'Animation type', detail: `Current: ${getAnimationType(reminder.animationType).label}`, value: 'animation' as const }
		], { placeHolder: 'Choose what to customize' });
		if (!property) {
			return;
		}

		if (property.value === 'sound') {
			const sound = await pickReminderSound(reminder.sound);
			if (!sound) {
				return;
			}
			reminder.sound = sound;
		} else if (property.value === 'style') {
			const style = await vscode.window.showQuickPick(messageStyles.map(option => ({
				label: option.label,
				description: option.description,
				value: option.id,
				picked: option.id === getMessageStyle(reminder.messageStyle).id
			})), { placeHolder: 'Choose this reminder’s banner style' });
			if (!style) {
				return;
			}
			reminder.messageStyle = style.value;
		} else {
			const animationType = await pickAnimationType(reminder.animationType);
			if (!animationType) {
				return;
			}
			reminder.animationType = animationType;
		}
		this.persist();
	}

	private deleteReminder(item: ReminderTreeItem): void {
		if (!item?.reminder) {
			return;
		}
		this.scheduler.cancel(item.reminder.id);
		this.reminders = this.reminders.filter(reminder => reminder.id !== item.reminder.id);
		this.persist();
	}

	dispose(): void {
		this.scheduler.dispose();
	}
}
