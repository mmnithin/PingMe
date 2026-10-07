import type { AnimationTypeId, MessageStyleId, SoundId } from './model';

export const maximumTimerDelay = 2_147_000_000;
export const maximumDelayMinutes = 525_600;
export const reminderFlightDuration = 20_000;

export const soundPresets: { id: SoundId; label: string; description: string }[] = [
	{ id: 'chirp', label: 'Bird chirp', description: 'A couple of bright, high notes' },
	{ id: 'arcade', label: 'Arcade fanfare', description: 'A playful rising game tune' },
	{ id: 'boing', label: 'Boing', description: 'A bouncy spring-like sound' },
	{ id: 'silent', label: 'No sound', description: 'Show the reminder without playing a sound' }
];

export const messageStyles: { id: MessageStyleId; label: string; description: string }[] = [
	{ id: 'classic', label: 'Classic banner', description: 'A cheerful fabric banner' },
	{ id: 'comic', label: 'Comic strip', description: 'A bold comic-book banner' },
	{ id: 'neon', label: 'Neon night', description: 'A glowing banner for night owls' }
];

export const animationTypes: { id: AnimationTypeId; label: string; symbol: string; description: string }[] = [
	{ id: 'rocket', label: 'Rocket airplane', symbol: '✈️', description: 'The airplane tows your reminder from left to right' },
	{ id: 'poster', label: 'Funny warning poster', symbol: '⚠️', description: 'A playful warning poster flies across the screen' },
	{ id: 'frog', label: 'Hungry frog', symbol: '🐸', description: 'A jumping frog catches and eats your reminder' }
];

export const defaultSound: SoundId = 'arcade';
export const defaultMessageStyle: MessageStyleId = 'classic';
export const defaultAnimationType: AnimationTypeId = 'rocket';

export const getSoundPreset = (id: SoundId | undefined) =>
	soundPresets.find(sound => sound.id === id) ?? soundPresets.find(sound => sound.id === defaultSound)!;

export const getMessageStyle = (id: MessageStyleId | undefined) =>
	messageStyles.find(style => style.id === id) ?? messageStyles.find(style => style.id === defaultMessageStyle)!;

export const getAnimationType = (id: AnimationTypeId | undefined) =>
	animationTypes.find(type => type.id === id) ?? animationTypes.find(type => type.id === defaultAnimationType)!;
