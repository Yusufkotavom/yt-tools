import { spawn } from 'child_process';
import path from 'path';

const backendDir = path.resolve(__dirname, '../packages/backend');
const server = spawn('npx', ['tsx', 'src/index.ts'], {
  cwd: backendDir,
  env: { ...process.env, PORT: '6788' }
});

server.stdout.on('data', (data) => {
  console.log(`STDOUT: ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`STDERR: ${data}`);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

process.on('SIGINT', () => {
  server.kill();
  process.exit();
});

setTimeout(() => {
  console.log('Stopping server after 60s');
  server.kill();
  process.exit();
}, 60000);
