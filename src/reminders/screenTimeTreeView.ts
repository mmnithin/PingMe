import * as vscode from 'vscode';
import { getSoundPreset } from './options';
import type { ScreenTimeReminder } from './model';

export class ScreenTimeTreeItem extends vscode.TreeItem {
	constructor(readonly reminder: ScreenTimeReminder) {
		super(`🧘 ${reminder.message}`, vscode.TreeItemCollapsibleState.None);
		this.description = `${reminder.active ? 'Every' : 'Paused'} ${reminder.intervalMinutes} minute${reminder.intervalMinutes === 1 ? '' : 's'}${reminder.active ? ` - next ${new Date(reminder.nextDueAt).toLocaleTimeString()}` : ''}`;
		this.tooltip = `${reminder.message}\nRepeats every ${reminder.intervalMinutes} minutes\n${reminder.active ? `Next reminder ${new Date(reminder.nextDueAt).toLocaleString()}` : 'Paused'}\nSound: ${getSoundPreset(reminder.sound).label}`;
		this.contextValue = reminder.active ? 'screen-time-active' : 'screen-time-inactive';
		this.iconPath = new vscode.ThemeIcon(reminder.active ? 'watch' : 'circle-slash');
	}
}

export class ScreenTimeTreeProvider implements vscode.TreeDataProvider<ScreenTimeTreeItem>, vscode.Disposable {
	private readonly changeEmitter = new vscode.EventEmitter<ScreenTimeTreeItem | undefined>();
	readonly onDidChangeTreeData = this.changeEmitter.event;

	constructor(private reminders: ScreenTimeReminder[]) {}

	getTreeItem(item: ScreenTimeTreeItem): vscode.TreeItem {
		return item;
	}

	getChildren(): ScreenTimeTreeItem[] {
		return this.reminders.map(reminder => new ScreenTimeTreeItem(reminder));
	}

	refresh(reminders: ScreenTimeReminder[]): void {
		this.reminders = reminders;
		this.changeEmitter.fire(undefined);
	}

	dispose(): void {
		this.changeEmitter.dispose();
	}
}
