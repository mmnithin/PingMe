import * as vscode from 'vscode';
import { animationTypes, getAnimationType } from './options';
import type { AnimationTypeId } from './model';

export async function pickAnimationType(currentType: AnimationTypeId | undefined): Promise<AnimationTypeId | undefined> {
	const selection = await vscode.window.showQuickPick(animationTypes.map(option => ({
		label: `${option.symbol} ${option.label}`,
		description: option.description,
		value: option.id,
		picked: option.id === getAnimationType(currentType).id
	})), { placeHolder: 'Choose how this reminder should appear' });
	return selection?.value;
}
