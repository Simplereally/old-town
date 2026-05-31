/**
 * Content validator CLI. Loads the content directory, validates every definition against
 * its schema, checks cross-references and duplicate ids, and reports problems with file
 * path and id context. Exits non-zero on any failure so it can gate CI.
 *
 * Usage: `bun run content:validate [contentDir]`  (defaults to ./content)
 */
import { resolve } from "node:path";
import { validateContent } from "@old-town/shared";
import { loadContentDir } from "./loader";

export { loadContentDir } from "./loader";

async function main(): Promise<void> {
  const contentDir = resolve(process.cwd(), process.argv[2] ?? "content");
  const { files, issues: loadIssues } = await loadContentDir(contentDir);
  const { ok, issues, registries } = validateContent(files);
  const allIssues = [...loadIssues, ...issues];

  if (allIssues.length > 0 || !ok) {
    console.error(`✖ Content validation failed — ${allIssues.length} issue(s):`);
    for (const issue of allIssues) {
      const where = issue.path ?? "(unknown file)";
      const id = issue.id ? ` [${issue.id}]` : "";
      console.error(`  - ${where}${id}: ${issue.message}`);
    }
    process.exit(1);
  }

  const counts = Object.entries(registries)
    .filter(([, registry]) => (registry as ReadonlyMap<string, unknown>).size > 0)
    .map(([kind, registry]) => `${kind}=${(registry as ReadonlyMap<string, unknown>).size}`)
    .join(", ");
  console.log(
    `✔ Content valid — ${files.length} file(s)${counts ? `. Registries: ${counts}` : " (no content yet)"}`,
  );
  process.exit(0);
}

if (import.meta.main) {
  main();
}
