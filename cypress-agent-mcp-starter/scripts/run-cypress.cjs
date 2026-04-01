const { spawnSync } = require('node:child_process');

const mode = process.argv[2] === 'open' ? 'open' : 'run';
const env = { ...process.env };

delete env.ELECTRON_RUN_AS_NODE;

const result = spawnSync('npx', ['cypress', mode], {
  stdio: 'inherit',
  shell: true,
  env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
