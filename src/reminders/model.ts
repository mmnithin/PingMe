import type { AnimationTypeId, MessageStyleId, SoundId } from '../shared/model';

export interface Reminder {
	id: string;
	message: string;
	dueAt: number;
	active: boolean;
	sound?: SoundId;
	messageStyle?: MessageStyleId;
	animationType?: AnimationTypeId;
}
