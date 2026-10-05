export type SoundId = 'chirp' | 'arcade' | 'boing' | 'silent';
export type MessageStyleId = 'classic' | 'comic' | 'neon';
export type AnimationTypeId = 'rocket' | 'poster' | 'frog';

export interface Reminder {
	id: string;
	message: string;
	dueAt: number;
	active: boolean;
	sound?: SoundId;
	messageStyle?: MessageStyleId;
	animationType?: AnimationTypeId;
}

export interface ReminderFlight {
	message: string;
	sound: SoundId;
	messageStyle: MessageStyleId;
	animationType: AnimationTypeId;
}
