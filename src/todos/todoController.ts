import * as vscode from 'vscode';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { todoStorageKey } from './options';
import type { TodoItem, TodoStatus } from './model';

type TodoViewMessage =
	| { type: 'ready' }
	| { type: 'create'; title: string; status: TodoStatus; dueAt: number }
	| { type: 'update'; id: string; title: string; status: TodoStatus; dueAt: number }
	| { type: 'setStatus'; id: string; status: TodoStatus }
	| { type: 'delete'; id: string };

const isTodoStatus = (value: unknown): value is TodoStatus =>
	value === 'todo' || value === 'inProgress' || value === 'done';

const isTodoViewMessage = (value: unknown): value is TodoViewMessage => {
	if (!value || typeof value !== 'object' || !('type' in value)) {
		return false;
	}

	const message = value as Record<string, unknown>;
	switch (message.type) {
		case 'ready':
			return true;
		case 'create':
			return typeof message.title === 'string' && isTodoStatus(message.status) && typeof message.dueAt === 'number';
		case 'update':
			return typeof message.id === 'string' && typeof message.title === 'string'
				&& isTodoStatus(message.status) && typeof message.dueAt === 'number';
		case 'setStatus':
			return typeof message.id === 'string' && isTodoStatus(message.status);
		case 'delete':
			return typeof message.id === 'string';
		default:
			return false;
	}
};

export class TodoController implements vscode.WebviewViewProvider {
	private todos: TodoItem[];
	private view: vscode.WebviewView | undefined;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.todos = context.globalState.get<TodoItem[]>(todoStorageKey, []);
	}

	async resolveWebviewView(view: vscode.WebviewView): Promise<void> {
		this.view = view;
		view.webview.options = { enableScripts: true };
		view.webview.onDidReceiveMessage(message => this.handleMessage(message));
		view.onDidDispose(() => {
			if (this.view === view) {
				this.view = undefined;
			}
		});

		const templatePath = join(__dirname, 'todoView.html');
		try {
			const template = await readFile(templatePath, 'utf8');
			view.webview.html = template.replace(/\{\{nonce\}\}/g, randomBytes(16).toString('base64'));
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			const message = `PingMe could not load the To-dos view at ${templatePath}: ${reason}`;
			void vscode.window.showErrorMessage(message);
			throw new Error(message);
		}

		view.onDidChangeVisibility(() => {
			if (view.visible) {
				this.sendState();
			}
		});
	}

	private async handleMessage(value: unknown): Promise<void> {
		if (!isTodoViewMessage(value)) {
			this.sendError('The requested to-do action was invalid.');
			return;
		}

		try {
			switch (value.type) {
				case 'ready':
					this.sendState();
					break;
				case 'create':
					await this.createTodo(value.title, value.status, value.dueAt);
					break;
				case 'update':
					await this.updateTodo(value.id, value.title, value.status, value.dueAt);
					break;
				case 'setStatus':
					await this.setStatus(value.id, value.status);
					break;
				case 'delete':
					await this.deleteTodo(value.id);
					break;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.sendError(message);
		}
	}

	private async createTodo(title: string, status: TodoStatus, dueAt: number): Promise<void> {
		const normalizedTitle = title.trim();
		this.validateTodo(normalizedTitle, dueAt);
		const now = Date.now();
		const todo: TodoItem = {
			id: randomUUID(),
			title: normalizedTitle,
			status,
			dueAt,
			createdAt: now,
			updatedAt: now
		};
		await this.saveTodos([...this.todos, todo]);
	}

	private async updateTodo(id: string, title: string, status: TodoStatus, dueAt: number): Promise<void> {
		const existingTodo = this.todos.find(todo => todo.id === id);
		if (!existingTodo) {
			throw new Error('This to-do no longer exists. Refresh the view and try again.');
		}
		const normalizedTitle = title.trim();
		this.validateTodo(normalizedTitle, dueAt);
		const updatedTodo: TodoItem = {
			...existingTodo,
			title: normalizedTitle,
			status,
			dueAt,
			updatedAt: Date.now()
		};
		await this.saveTodos(this.todos.map(todo => todo.id === id ? updatedTodo : todo));
	}

	private async setStatus(id: string, status: TodoStatus): Promise<void> {
		const existingTodo = this.todos.find(todo => todo.id === id);
		if (!existingTodo) {
			throw new Error('This to-do no longer exists. Refresh the view and try again.');
		}
		const updatedTodo = { ...existingTodo, status, updatedAt: Date.now() };
		await this.saveTodos(this.todos.map(todo => todo.id === id ? updatedTodo : todo));
	}

	private async deleteTodo(id: string): Promise<void> {
		if (!this.todos.some(todo => todo.id === id)) {
			throw new Error('This to-do no longer exists. Refresh the view and try again.');
		}
		await this.saveTodos(this.todos.filter(todo => todo.id !== id));
	}

	private validateTodo(title: string, dueAt: number): void {
		if (!title) {
			throw new Error('Enter a to-do title.');
		}
		if (title.length > 200) {
			throw new Error('To-do titles must be 200 characters or fewer.');
		}
		if (!Number.isFinite(dueAt) || dueAt <= 0) {
			throw new Error('Choose a valid due date.');
		}
	}

	private async saveTodos(todos: TodoItem[]): Promise<void> {
		await this.context.globalState.update(todoStorageKey, todos);
		this.todos = todos;
		this.sendState();
	}

	private sendState(): void {
		if (this.view) {
			void this.view.webview.postMessage({ type: 'state', todos: this.todos });
		}
	}

	private sendError(message: string): void {
		if (this.view) {
			void this.view.webview.postMessage({ type: 'error', message });
		}
	}
}
