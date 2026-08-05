1. **Optimize `activeForGear.find`**: Run `run_in_bash_session` to replace `activeForGear.find((w) => w.champion)` with the already evaluated `champWarrior` in `src/engine/ai/workers/rosterWorker.ts`. Then `cat src/engine/ai/workers/rosterWorker.ts | grep "champWarrior"` to verify.
    - Command: `sed -i 's/activeForGear.find((w) => w.champion) ??/champWarrior ??/g' src/engine/ai/workers/rosterWorker.ts`
2. **Run test suite**: Run the test suite using `bun run lint` and `bun run test` to verify that the optimization has not introduced any regressions.
3. **Run Pre-Commit Checks**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Submit PR**: Submit the optimized code with Bolt PR format using `submit`. The PR title format is `⚡ Bolt: [performance improvement]` and the description sections are `💡 What:`, `🎯 Why:`, `📊 Impact:`, `🔬 Measurement:`.
