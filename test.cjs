const { execSync } = require('child_process');
try {
  execSync('bun run lint', { stdio: 'pipe' });
  console.log("Success");
} catch (e) {
  console.log("Fail", e.status);
}
