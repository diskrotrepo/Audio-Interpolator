# Agent Guidelines for Audio-Interpolator

- **Regression tests required:** Every change to the codebase must include corresponding regression tests that exercise the new or modified behavior.
- **Bugs signal testing gaps:** A user-reported bug means both the code and our tests failed. When fixing bugs, generalize the scenario into new tests and document the lesson here.
- **Living document:** Use this file to capture strategies that improve overall testing coverage. Update it whenever we discover gaps or directional errors so future contributors avoid repeating them.
- **Keep the app file-friendly:** The audio averaging page should work when opened directly from the filesystem. Avoid module imports or other features that require a web server, and add tests to guard against regressions.
