import type { SoundId } from '../shared/model';

export interface ScreenTimeReminder {
	id: string;
	message: string;
	intervalMinutes: number;
	nextDueAt: number;
	active: boolean;
	sound?: SoundId;
}
