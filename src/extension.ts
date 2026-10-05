import * as vscode from 'vscode';
import { ReminderAnimationController } from './reminders/animationController';
import { ReminderController } from './reminders/reminderController';
import { ScreenTimeController } from './reminders/screenTimeController';

export function activate(context: vscode.ExtensionContext): void {
	const animations = new ReminderAnimationController();
	context.subscriptions.push(
		animations,
		new ReminderController(context, reminder => animations.show(reminder)),
		new ScreenTimeController(context, reminder => animations.show(reminder)),
		vscode.commands.registerCommand('pingMe.open', () =>
			vscode.commands.executeCommand('workbench.view.extension.pingMeBar'))
	);
}

export function deactivate(): void {}
