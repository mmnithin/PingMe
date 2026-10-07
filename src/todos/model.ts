export type TodoStatus = 'todo' | 'inProgress' | 'done';

export interface TodoItem {
	id: string;
	title: string;
	status: TodoStatus;
	dueAt: number;
	createdAt: number;
	updatedAt: number;
}
