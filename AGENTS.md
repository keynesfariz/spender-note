<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Package Manager

- Always use `bun` and `bunx` over `npm` and `npx` for installing dependencies, running scripts, and executing packages.

- **CRITICAL**: To prevent the `CouldntReadCurrentDirectory` error in the macOS sandbox, ALWAYS prefix `bun` and `bunx` commands with `HOME=$PWD` (e.g., `HOME=$PWD bun install` or `HOME=$PWD bunx ...`). This stops Bun from traversing into restricted ancestor directories like `~/.bunfig.toml`.
