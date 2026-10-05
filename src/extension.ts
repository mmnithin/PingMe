// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import {
	defaultAnimationType,
	defaultMessageStyle,
	defaultSound,
	getAnimationType,
	getMessageStyle,
	getSoundPreset,
	maximumDelayMinutes,
	messageStyles,
	reminderFlightDuration,
	reminderStorageKey,
	toReminderFlight
} from './reminders/options';
import type { Reminder, ReminderFlight } from './reminders/model';
import { pickAnimationType } from './reminders/animationPicker';
import { renderReminderAnimation } from './reminders/animationRenderer';
import { ReminderScheduler } from './reminders/scheduler';
import { pickReminderSound } from './reminders/soundPicker';
import { ReminderTreeItem, ReminderTreeProvider } from './reminders/treeView';

export function activate(context: vscode.ExtensionContext): void {
	let reminders = context.globalState.get<Reminder[]>(reminderStorageKey, []);
	const provider = new ReminderTreeProvider(reminders);
	const reminderFlightQueue: ReminderFlight[] = [];
	let reminderFlightPanel: vscode.WebviewPanel | undefined;
	let reminderFlightTimer: NodeJS.Timeout | undefined;
	let isLoadingReminderFlight = false;
	let isDisposed = false;

	const showNextReminderFlight = async (): Promise<void> => {
		if (isDisposed || isLoadingReminderFlight || reminderFlightPanel || reminderFlightQueue.length === 0) {
			return;
		}

		const reminder = reminderFlightQueue.shift()!;
		isLoadingReminderFlight = true;
		let html: string;
		try {
			html = await renderReminderAnimation(reminder, randomBytes(16).toString('base64'));
		} catch (error) {
			isLoadingReminderFlight = false;
			const message = error instanceof Error ? error.message : String(error);
			void vscode.window.showErrorMessage(`PingMe could not display this reminder. ${message}`);
			await showNextReminderFlight();
			return;
		}
		isLoadingReminderFlight = false;
		if (isDisposed) {
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'pingMe.reminderFlight',
			'PingMe Reminder',
			{ viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
			{ enableScripts: true }
		);
		reminderFlightPanel = panel;
		panel.webview.html = html;
		panel.onDidDispose(() => {
			if (reminderFlightPanel !== panel) {
				return;
			}
			reminderFlightPanel = undefined;
			if (reminderFlightTimer) {
				clearTimeout(reminderFlightTimer);
				reminderFlightTimer = undefined;
			}
			void showNextReminderFlight();
		});
		reminderFlightTimer = setTimeout(() => panel.dispose(), reminderFlightDuration);
	};

	const showReminderFlight = (reminder: Reminder): void => {
		reminderFlightQueue.push(toReminderFlight(reminder));
		void showNextReminderFlight();
	};

	const persist = (): void => {
		provider.refresh(reminders);
		void context.globalState.update(reminderStorageKey, reminders);
	};

	const scheduler = new ReminderScheduler(
		() => reminders,
		reminder => {
			reminder.active = false;
			persist();
			showReminderFlight(reminder);
		}
	);

	const validateDelay = (value: string): string | undefined => {
		const minutes = Number(value);
		return Number.isFinite(minutes) && minutes > 0 && minutes <= maximumDelayMinutes
			? undefined
			: `Enter a number between 0 and ${maximumDelayMinutes}.`;
	};
	const setReminderActive = async (item: ReminderTreeItem, active: boolean): Promise<void> => {
		const reminder = reminders.find(current => current.id === item?.reminder.id);
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
		persist();
		scheduler.schedule(reminder);
	};

	const tree = vscode.window.createTreeView('pingMe.reminders', { treeDataProvider: provider });
	context.subscriptions.push(tree, provider);
	context.subscriptions.push({
		dispose: () => {
			isDisposed = true;
			scheduler.dispose();
			reminderFlightQueue.length = 0;
			if (reminderFlightTimer) {
				clearTimeout(reminderFlightTimer);
			}
			reminderFlightPanel?.dispose();
		}
	});
	context.subscriptions.push(vscode.commands.registerCommand('pingMe.open', () =>
		vscode.commands.executeCommand('workbench.view.extension.pingMeBar')));
	context.subscriptions.push(vscode.commands.registerCommand('pingMe.addReminder', async () => {
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
		reminders = [...reminders, reminder];
		persist();
		scheduler.schedule(reminder);
	}));
	context.subscriptions.push(vscode.commands.registerCommand('pingMe.customizeReminder', async (item: ReminderTreeItem) => {
		const reminder = reminders.find(current => current.id === item?.reminder.id);
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

		persist();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('pingMe.activateReminder', (item: ReminderTreeItem) =>
		setReminderActive(item, true)));
	context.subscriptions.push(vscode.commands.registerCommand('pingMe.deactivateReminder', (item: ReminderTreeItem) =>
		setReminderActive(item, false)));
	context.subscriptions.push(vscode.commands.registerCommand('pingMe.deleteReminder', (item: ReminderTreeItem) => {
		if (!item?.reminder) {
			return;
		}
		scheduler.cancel(item.reminder.id);
		reminders = reminders.filter(reminder => reminder.id !== item.reminder.id);
		persist();
	}));

	for (const reminder of reminders) {
		if (reminder.active) {
			scheduler.schedule(reminder);
		}
	}
}

export function deactivate(): void {}
