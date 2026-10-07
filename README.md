# pingme README

This is the README for your extension "pingme". After writing up a brief description, we recommend including the following sections.

## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.
Create one-time reminders without leaving VS Code. Reminders are stored with your VS Code user data and restored when the extension starts.

Open the PingMe Activity Bar icon, select the add button, then enter a message, delay, sound, and animation type. Choose **No sound** to mute an individual reminder. Each reminder uses one combined visual type: Rocket airplane, Funny warning poster, or Hungry frog. Right-click an existing reminder and choose **PingMe: Customize Reminder** to change its animation, sound, or banner style. Sound choices include bird chirp, arcade fanfare, boing, and no sound; banner styles include classic, comic, and neon. Use the inline bell actions to activate or deactivate a reminder; delete removes it.

When a reminder is due, PingMe attempts to play its selected sound and runs its chosen animation in a temporary VS Code editor-area tab: the airplane tows a banner, the warning poster carries the reminder with a hard-coded joke, or the frog hops over and eats the reminder box. Use the visible **Play sound** button if VS Code blocks automatic playback; after playing, it becomes **Play again**. The reminder is then marked inactive. Reminders due together play one at a time. Reactivating an overdue reminder prompts for a new delay.

Use the separate **Screen Time** list to add recurring break reminders. Choose a message, interval in minutes, and sound; each active reminder repeats at its interval until paused or deleted. Use the inline pause and resume actions to control an interval.

Use **To-dos** for Jira-style task tracking. Add or edit a title and due date, set the current status using the **To do**, **In progress**, or **Done** radio buttons, and delete tasks when they are no longer needed. To-do data is stored separately from reminders.

The card closes automatically when its flight finishes. VS Code extensions cannot draw custom floating overlays on top of the editor, so the animation uses a temporary webview tab.

## Source structure

- `src/extension.ts` is the composition root; it registers the three list features and shared animation controller.
- `src/reminders/` contains the one-time reminder list, including its controller, scheduler, tree view, model, and reminder-specific options.
- `src/screenTime/` contains the recurring Screen Time list, including its controller, scheduler, tree view, model, and storage key.
- `src/todos/` contains the Jira-style To-dos list, including its controller, model, storage key, and webview.
- `src/shared/` contains code reused by multiple lists: sound selection, common sound/animation settings and types, and reminder animation infrastructure.
- `src/shared/animations/` manages the shared animation queue, renders reminder animation HTML, and includes the individual templates in `templates/`.
- `scripts/copy-animations.js` copies shared animation templates and the To-dos webview into the extension output during compilation.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
