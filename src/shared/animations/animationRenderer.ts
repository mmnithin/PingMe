import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { reminderFlightDuration } from '../options';
import type { ReminderFlight } from '../model';

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, character => {
	switch (character) {
		case '&': return '&amp;';
		case '<': return '&lt;';
		case '>': return '&gt;';
		case '"': return '&quot;';
		case "'": return '&#39;';
		default: return character;
	}
});

export async function renderReminderAnimation(reminder: ReminderFlight, nonce: string): Promise<string> {
	const templatePath = join(__dirname, 'templates', `${reminder.animationType}.html`);
	let template: string;
	try {
		template = await readFile(templatePath, 'utf8');
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to load the "${reminder.animationType}" reminder animation at ${templatePath}: ${reason}`);
	}

	const replacements: Record<string, string> = {
		nonce,
		duration: String(reminderFlightDuration),
		message: escapeHtml(reminder.message),
		messageStyle: reminder.messageStyle,
		sound: JSON.stringify(reminder.sound)
	};
	return template.replace(/\{\{(nonce|duration|message|messageStyle|sound)\}\}/g, (placeholder, key: string) => {
		const replacement = replacements[key];
		if (replacement === undefined) {
			throw new Error(`No replacement was provided for animation template placeholder "${placeholder}".`);
		}
		return replacement;
	});
}
