import * as vscode from 'vscode';
import { getAnimationType, getMessageStyle, getSoundPreset } from '../shared/options';
import type { Reminder } from './model';

export class ReminderTreeItem extends vscode.TreeItem {
	constructor(readonly reminder: Reminder) {
		const animation = getAnimationType(reminder.animationType);
		super(`${animation.symbol} ${reminder.message}`, vscode.TreeItemCollapsibleState.None);
		this.description = `${reminder.active ? 'Active' : 'Inactive'} - ${new Date(reminder.dueAt).toLocaleString()}`;
		this.tooltip = `${reminder.message}\nDue ${new Date(reminder.dueAt).toLocaleString()}\nSound: ${getSoundPreset(reminder.sound).label}\nStyle: ${getMessageStyle(reminder.messageStyle).label}\nAnimation: ${animation.label}`;
		this.contextValue = reminder.active ? 'reminder-active' : 'reminder-inactive';
		this.iconPath = new vscode.ThemeIcon(reminder.active ? 'bell' : 'bell-slash');
	}
}

export class ReminderTreeProvider implements vscode.TreeDataProvider<ReminderTreeItem>, vscode.Disposable {
	private readonly changeEmitter = new vscode.EventEmitter<ReminderTreeItem | undefined>();
	readonly onDidChangeTreeData = this.changeEmitter.event;

	constructor(private reminders: Reminder[]) {}

	getTreeItem(item: ReminderTreeItem): vscode.TreeItem {
		return item;
	}

	getChildren(): ReminderTreeItem[] {
		return this.reminders.map(reminder => new ReminderTreeItem(reminder));
	}

	refresh(reminders: Reminder[]): void {
		this.reminders = reminders;
		this.changeEmitter.fire(undefined);
	}

	dispose(): void {
		this.changeEmitter.dispose();
	}
}
