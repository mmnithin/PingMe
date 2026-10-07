import * as vscode from 'vscode';
import { randomBytes } from 'node:crypto';
import { renderReminderAnimation } from './animationRenderer';
import { reminderFlightDuration } from '../options';
import type { ReminderFlight } from '../model';

export class ReminderAnimationController implements vscode.Disposable {
	private readonly queue: ReminderFlight[] = [];
	private panel: vscode.WebviewPanel | undefined;
	private closeTimer: NodeJS.Timeout | undefined;
	private isRendering = false;
	private isDisposed = false;

	show(reminder: ReminderFlight): void {
		this.queue.push(reminder);
		void this.showNext();
	}

	private async showNext(): Promise<void> {
		if (this.isDisposed || this.isRendering || this.queue.length === 0) {
			return;
		}

		const reminder = this.queue.shift()!;
		this.isRendering = true;
		let html: string;
		try {
			html = await renderReminderAnimation(reminder, randomBytes(16).toString('base64'));
		} catch (error) {
			this.isRendering = false;
			const message = error instanceof Error ? error.message : String(error);
			void vscode.window.showErrorMessage(`PingMe could not display this reminder. ${message}`);
			void this.showNext();
			return;
		}
		this.isRendering = false;
		if (this.isDisposed) {
			return;
		}

		let panel = this.panel;
		if (panel) {
			panel.reveal(undefined, true);
		} else {
			panel = vscode.window.createWebviewPanel(
				'pingMe.reminderFlight',
				'PingMe Reminder',
				{ viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
				{ enableScripts: true }
			);
			this.panel = panel;
			panel.onDidDispose(() => {
				if (this.panel !== panel) {
					return;
				}
				this.panel = undefined;
				this.clearCloseTimer();
			});
		}

		panel.webview.html = html;
		this.clearCloseTimer();
		this.closeTimer = setTimeout(() => panel.dispose(), reminderFlightDuration);
		void this.showNext();
	}

	private clearCloseTimer(): void {
		if (this.closeTimer) {
			clearTimeout(this.closeTimer);
			this.closeTimer = undefined;
		}
	}

	dispose(): void {
		this.isDisposed = true;
		this.queue.length = 0;
		this.clearCloseTimer();
		this.panel?.dispose();
		this.panel = undefined;
	}
}
