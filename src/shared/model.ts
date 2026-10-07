export type SoundId = 'chirp' | 'arcade' | 'boing' | 'silent';
export type MessageStyleId = 'classic' | 'comic' | 'neon';
export type AnimationTypeId = 'rocket' | 'poster' | 'frog';

export interface ReminderFlight {
	message: string;
	sound: SoundId;
	messageStyle: MessageStyleId;
	animationType: AnimationTypeId;
}
