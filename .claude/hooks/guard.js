// Blocks secrets access and protected-branch pushes before Claude runs a tool.
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  const { tool_name, tool_input = {} } = JSON.parse(raw || "{}");
  const block = (msg) => { console.error(`BLOCKED by guard hook: ${msg}`); process.exit(2); };

  const file = tool_input.file_path || "";
  if (/(^|[\\/])\.env(\.(?!example$)[^\\/]*)?$/.test(file)) {
    block("secrets files (.env) are off-limits. Use .env.example.");
  }

  if (tool_name === "Bash") {
    const cmd = tool_input.command || "";
    if (/git\s+push\b.*\b(main|staging)\b/.test(cmd)) block("pushing to main/staging is human-only.");
    if (/git\s+push\b.*(--force|-f\b)/.test(cmd)) block("force push is not allowed.");
    if (/git\s+merge\b/.test(cmd) && /\b(main|staging)\b/.test(cmd)) block("merging main/staging is human-only.");
    if (/\bcat\b.*\.env\b(?!\.example)/.test(cmd)) block("reading .env is not allowed.");
  }
  process.exit(0);
});