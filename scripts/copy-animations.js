const fs = require('node:fs');
const path = require('node:path');

const sourceDirectory = path.join(__dirname, '..', 'src', 'reminders', 'animations');
const destinationDirectory = path.join(__dirname, '..', 'out', 'reminders', 'animations');

fs.mkdirSync(destinationDirectory, { recursive: true });

for (const fileName of fs.readdirSync(sourceDirectory)) {
	if (fileName.endsWith('.html')) {
		fs.copyFileSync(
			path.join(sourceDirectory, fileName),
			path.join(destinationDirectory, fileName)
		);
	}
}
