/**
 * Starts Trade Desk from the desktop shortcut.
 *
 * The development setup runs two things: the Vite page server on port 5176
 * and Electron. If Trade Desk is already running — perhaps hidden in the
 * tray, guarding a locked session — the server already holds that port and
 * starting another would fail without a word. So: if the server is up, start
 * only Electron, which hands over to the running app and brings its window
 * forward; otherwise start both.
 */

const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5176;
const appDir = path.resolve(__dirname, '..');

// Started from a tool that is itself built on Electron (an editor, say),
// this would make Electron run as plain Node and the app fail on launch.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

function run(command) {
  const child = spawn(command, { cwd: appDir, env, shell: true, stdio: 'ignore', windowsHide: true });
  child.on('exit', (code) => process.exit(code ?? 0));
}

const probe = net.connect({ port: PORT, host: '127.0.0.1' });
probe.setTimeout(1500);
probe.once('connect', () => {
  probe.destroy();
  run('npx electron .');
});
const startEverything = () => {
  probe.destroy();
  run('npm run electron-dev');
};
probe.once('error', startEverything);
probe.once('timeout', startEverything);
