import type { Reminder } from './model';
import type { ReminderFlight } from '../shared/model';
import { getAnimationType, getMessageStyle, getSoundPreset } from '../shared/options';

export const reminderStorageKey = 'pingme.reminders';

export const toReminderFlight = (reminder: Reminder): ReminderFlight => ({
	message: reminder.message,
	sound: getSoundPreset(reminder.sound).id,
	messageStyle: getMessageStyle(reminder.messageStyle).id,
	animationType: getAnimationType(reminder.animationType).id
});
