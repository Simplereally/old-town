/**
 * tasks:status — list the next epic/story and remaining unchecked work.
 *
 * The task tree is the source of execution order: active epic files live in
 * `tasks/epics/`, their stories in `tasks/stories/E##/`. Completed files are moved
 * under `tasks/completed/`, so whatever still sits in `epics/`/`stories/` is the
 * remaining work. This script reports the lowest-numbered remaining epic and story
 * so an agent can determine what to do next without guessing.
 *
 * Run with: `bun run tasks:status`
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { auditTaskTree } from "./tasks-check";

const root = process.cwd();
const tasksDir = join(root, "tasks");
const epicsDir = join(tasksDir, "epics");
const storiesDir = join(tasksDir, "stories");

const audit = auditTaskTree(root);
if (audit.issues.length > 0) {
  console.error(`Task tree validation failed with ${audit.issues.length} issue(s):`);
  for (const issue of audit.issues) {
    console.error(`  - ${issue}`);
  }
  console.error("\nRun `bun run tasks:check` after repairing the task tree.");
  process.exit(1);
}

function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .toSorted();
}

function epicIdOf(filename: string): string {
  const match = /^(E\d+)/.exec(filename);
  return match?.[1] ?? "E??";
}

function countUnchecked(file: string): number {
  return (readFileSync(file, "utf8").match(/^- \[ \]/gm) ?? []).length;
}

const epics = listMarkdown(epicsDir);
const nextEpic = epics[0];

if (!nextEpic) {
  console.log("All epics complete — tasks/epics/ is empty. 🎉");
  process.exit(0);
}

const nextEpicId = epicIdOf(nextEpic);
const nextStory = listMarkdown(join(storiesDir, nextEpicId))[0];

console.log(`Next epic:  ${nextEpicId}  →  tasks/epics/${nextEpic}`);
if (nextStory) {
  console.log(`Next story: ${nextEpicId}  →  tasks/stories/${nextEpicId}/${nextStory}`);
} else {
  console.log(`Next story: none remaining — finalize ${nextEpicId} and move its epic file.`);
}

console.log("\nRemaining work:");
let totalEpicItems = 0;
for (const epic of epics) {
  const id = epicIdOf(epic);
  const remainingStories = listMarkdown(join(storiesDir, id)).length;
  const uncheckedItems = countUnchecked(join(epicsDir, epic));
  totalEpicItems += uncheckedItems;
  console.log(
    `  ${id}: ${remainingStories} story file(s), ${uncheckedItems} unchecked epic item(s)`,
  );
}

console.log(`\nTotal unchecked epic checklist items: ${totalEpicItems}`);
