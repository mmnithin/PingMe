import * as vscode from 'vscode';
import { ReminderAnimationController } from './shared/animations/animationController';
import { ReminderController } from './reminders/reminderController';
import { ScreenTimeController } from './screenTime/screenTimeController';
import { TodoController } from './todos/todoController';

export function activate(context: vscode.ExtensionContext): void {
	const animations = new ReminderAnimationController();
	const todos = new TodoController(context);
	context.subscriptions.push(
		animations,
		new ReminderController(context, reminder => animations.show(reminder)),
		new ScreenTimeController(context, reminder => animations.show(reminder)),
		vscode.window.registerWebviewViewProvider('pingMe.todos', todos),
		vscode.commands.registerCommand('pingMe.open', () =>
			vscode.commands.executeCommand('workbench.view.extension.pingMeBar'))
	);
}

export function deactivate(): void {}
