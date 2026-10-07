const fs = require('node:fs');
const path = require('node:path');

const sourceDirectory = path.join(__dirname, '..', 'src', 'shared', 'animations', 'templates');
const destinationDirectory = path.join(__dirname, '..', 'out', 'shared', 'animations', 'templates');
const todoViewSource = path.join(__dirname, '..', 'src', 'todos', 'todoView.html');
const todoViewDestination = path.join(__dirname, '..', 'out', 'todos', 'todoView.html');

fs.mkdirSync(destinationDirectory, { recursive: true });

for (const fileName of fs.readdirSync(sourceDirectory)) {
	if (fileName.endsWith('.html')) {
		fs.copyFileSync(
			path.join(sourceDirectory, fileName),
			path.join(destinationDirectory, fileName)
		);
	}
}

fs.mkdirSync(path.dirname(todoViewDestination), { recursive: true });
fs.copyFileSync(todoViewSource, todoViewDestination);
