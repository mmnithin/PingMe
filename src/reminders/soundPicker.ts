import * as vscode from 'vscode';
import { getSoundPreset, soundPresets } from './options';
import type { SoundId } from './model';

export async function pickReminderSound(currentSound: SoundId | undefined): Promise<SoundId | undefined> {
	const selection = await vscode.window.showQuickPick(soundPresets.map(option => ({
		label: option.label,
		description: option.description,
		value: option.id,
		picked: option.id === getSoundPreset(currentSound).id
	})), { placeHolder: 'Choose a reminder sound' });
	return selection?.value;
}
