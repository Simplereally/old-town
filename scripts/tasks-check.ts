/**
 * Validate that the task manifest, filesystem, and parent epic checklists agree.
 *
 * The E56-E65 proposal document is intentionally outside the active/completed
 * task-tree directories, so it is not part of this audit.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

interface ManifestEntry {
  id: string;
  title: string;
  file: string;
}

interface ManifestEpic extends ManifestEntry {
  stories: ManifestEntry[];
}

interface TaskManifest {
  epics: ManifestEpic[];
}

export interface TaskTreeAudit {
  epicCount: number;
  issues: string[];
  storyCount: number;
}

function isManifestEntry(value: unknown): value is ManifestEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.title === "string" &&
    typeof entry.file === "string"
  );
}

function isManifestEpic(value: unknown): value is ManifestEpic {
  if (!isManifestEntry(value)) {
    return false;
  }

  const epic = value as unknown as Record<string, unknown>;
  return Array.isArray(epic.stories) && epic.stories.every(isManifestEntry);
}

function listMarkdownFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(path);
      }
      return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
    })
    .toSorted();
}

function toTaskRelativePath(tasksDirectory: string, path: string): string {
  return relative(tasksDirectory, path).split(sep).join("/");
}

function idFromFilename(path: string, kind: "epic" | "story"): string | undefined {
  const pattern = kind === "epic" ? /^(E\d{2})_.+\.md$/ : /^(E\d{2}-S\d{2})_.+\.md$/;
  return pattern.exec(basename(path))?.[1];
}

function reportDuplicates(
  entries: Array<{ id: string; file: string }>,
  label: string,
  issues: string[],
): void {
  const owners = new Map<string, string>();
  for (const entry of entries) {
    const previous = owners.get(entry.id);
    if (previous) {
      issues.push(`${label} id ${entry.id} is duplicated by ${previous} and ${entry.file}`);
    } else {
      owners.set(entry.id, entry.file);
    }
  }
}

function reportOrdering(ids: string[], label: string, issues: string[]): void {
  const sorted = ids.toSorted();
  if (ids.some((id, index) => id !== sorted[index])) {
    issues.push(`${label} entries are not in id order: ${ids.join(", ")}`);
  }
}

function readManifest(manifestPath: string, issues: string[]): TaskManifest | undefined {
  let value: unknown;
  try {
    value = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    issues.push(
      `TASK_MANIFEST.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    return undefined;
  }

  if (typeof value !== "object" || value === null) {
    issues.push("TASK_MANIFEST.json must contain an object");
    return undefined;
  }

  const epics = (value as Record<string, unknown>).epics;
  if (!Array.isArray(epics) || !epics.every(isManifestEpic)) {
    issues.push("TASK_MANIFEST.json must contain an epics array with valid epic and story entries");
    return undefined;
  }

  return { epics };
}

function checkHeading(tasksDirectory: string, entry: ManifestEntry, issues: string[]): void {
  const absolutePath = resolve(tasksDirectory, entry.file);
  if (!existsSync(absolutePath)) {
    return;
  }

  const firstLine = readFileSync(absolutePath, "utf8").split(/\r?\n/, 1)[0];
  const heading = /^# (E\d{2}(?:-S\d{2})?) (?:—|-) (.+)$/.exec(firstLine);
  if (!heading) {
    issues.push(`${entry.file} must start with a heading containing its id and title`);
    return;
  }
  if (heading[1] !== entry.id) {
    issues.push(`${entry.file} heading id ${heading[1]} does not match manifest id ${entry.id}`);
  }
  if (heading[2] !== entry.title) {
    issues.push(
      `${entry.file} heading title ${JSON.stringify(heading[2])} does not match manifest title ${JSON.stringify(entry.title)}`,
    );
  }
}

function checkEpicChecklist(tasksDirectory: string, epic: ManifestEpic, issues: string[]): void {
  const epicPath = resolve(tasksDirectory, epic.file);
  if (!existsSync(epicPath)) {
    return;
  }

  const text = readFileSync(epicPath, "utf8");
  const rows = [...text.matchAll(/^- \[([ Xx])\][^\n]*`(E\d{2}-S\d{2})`[^\n]*$/gm)];
  const expectedStoryIds = new Set(epic.stories.map((story) => story.id));

  for (const row of rows) {
    const storyId = row[2];
    if (!expectedStoryIds.has(storyId)) {
      issues.push(`${epic.file} lists ${storyId}, but the manifest does not`);
    }
  }

  for (const story of epic.stories) {
    const matchingRows = rows.filter((row) => row[2] === story.id);
    if (matchingRows.length !== 1) {
      issues.push(
        `${epic.file} must contain exactly one ordered-story row for ${story.id}; found ${matchingRows.length}`,
      );
      continue;
    }

    const row = matchingRows[0];
    const isChecked = row[1].toUpperCase() === "X";
    const isCompleted = story.file.startsWith("completed/stories/");
    if (isChecked !== isCompleted) {
      issues.push(
        `${epic.file} marks ${story.id} ${isChecked ? "complete" : "incomplete"}, but its manifest path is ${story.file}`,
      );
    }

    const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(row[0]);
    if (!link) {
      issues.push(`${epic.file} ordered-story row for ${story.id} must contain a Markdown link`);
      continue;
    }
    if (link[1] !== story.title) {
      issues.push(
        `${epic.file} labels ${story.id} ${JSON.stringify(link[1])}, but the manifest title is ${JSON.stringify(story.title)}`,
      );
    }

    const linkedPath = resolve(dirname(epicPath), link[2]);
    const expectedPath = resolve(tasksDirectory, story.file);
    if (linkedPath !== expectedPath) {
      issues.push(
        `${epic.file} links ${story.id} to ${link[2]}, but the manifest points to ${story.file}`,
      );
    }
  }
}

export function auditTaskTree(root = process.cwd()): TaskTreeAudit {
  const tasksDirectory = join(root, "tasks");
  const issues: string[] = [];
  const manifest = readManifest(join(tasksDirectory, "TASK_MANIFEST.json"), issues);

  const epicFiles = [
    ...listMarkdownFiles(join(tasksDirectory, "epics")),
    ...listMarkdownFiles(join(tasksDirectory, "completed", "epics")),
  ];
  const storyFiles = [
    ...listMarkdownFiles(join(tasksDirectory, "stories")),
    ...listMarkdownFiles(join(tasksDirectory, "completed", "stories")),
  ];

  const filesystemEpics = epicFiles.flatMap((file) => {
    const id = idFromFilename(file, "epic");
    if (!id) {
      issues.push(
        `${toTaskRelativePath(tasksDirectory, file)} does not follow the epic filename convention`,
      );
      return [];
    }
    return [{ id, file: toTaskRelativePath(tasksDirectory, file) }];
  });
  const filesystemStories = storyFiles.flatMap((file) => {
    const id = idFromFilename(file, "story");
    if (!id) {
      issues.push(
        `${toTaskRelativePath(tasksDirectory, file)} does not follow the story filename convention`,
      );
      return [];
    }
    return [{ id, file: toTaskRelativePath(tasksDirectory, file) }];
  });

  reportDuplicates(filesystemEpics, "Filesystem epic", issues);
  reportDuplicates(filesystemStories, "Filesystem story", issues);

  if (!manifest) {
    return {
      epicCount: filesystemEpics.length,
      issues,
      storyCount: filesystemStories.length,
    };
  }

  const manifestEpics = manifest.epics.map(({ id, file }) => ({ id, file }));
  const manifestStories = manifest.epics.flatMap((epic) =>
    epic.stories.map(({ id, file }) => ({ id, file })),
  );
  reportDuplicates(manifestEpics, "Manifest epic", issues);
  reportDuplicates(manifestStories, "Manifest story", issues);
  reportOrdering(
    manifest.epics.map((epic) => epic.id),
    "Manifest epic",
    issues,
  );

  const filesystemEpicPaths = new Set(filesystemEpics.map((entry) => entry.file));
  const filesystemStoryPaths = new Set(filesystemStories.map((entry) => entry.file));
  const manifestEpicPaths = new Set(manifestEpics.map((entry) => entry.file));
  const manifestStoryPaths = new Set(manifestStories.map((entry) => entry.file));

  for (const entry of filesystemEpics) {
    if (!manifestEpicPaths.has(entry.file)) {
      issues.push(`Filesystem epic ${entry.file} is missing from TASK_MANIFEST.json`);
    }
  }
  for (const entry of filesystemStories) {
    if (!manifestStoryPaths.has(entry.file)) {
      issues.push(`Filesystem story ${entry.file} is missing from TASK_MANIFEST.json`);
    }
  }
  for (const entry of manifestEpics) {
    if (!filesystemEpicPaths.has(entry.file)) {
      issues.push(`Manifest epic ${entry.id} points to missing file ${entry.file}`);
    }
    const fileId = idFromFilename(entry.file, "epic");
    if (fileId !== entry.id) {
      issues.push(`Manifest epic id ${entry.id} does not match filename ${entry.file}`);
    }
  }
  for (const entry of manifestStories) {
    if (!filesystemStoryPaths.has(entry.file)) {
      issues.push(`Manifest story ${entry.id} points to missing file ${entry.file}`);
    }
    const fileId = idFromFilename(entry.file, "story");
    if (fileId !== entry.id) {
      issues.push(`Manifest story id ${entry.id} does not match filename ${entry.file}`);
    }
  }

  for (const epic of manifest.epics) {
    reportOrdering(
      epic.stories.map((story) => story.id),
      `Manifest ${epic.id} story`,
      issues,
    );
    for (const story of epic.stories) {
      if (!story.id.startsWith(`${epic.id}-S`)) {
        issues.push(`Manifest ${epic.id} contains story with mismatched id ${story.id}`);
      }
    }

    if (
      epic.file.startsWith("completed/epics/") &&
      epic.stories.some((story) => !story.file.startsWith("completed/stories/"))
    ) {
      issues.push(`Completed epic ${epic.id} still contains active story paths`);
    }

    checkHeading(tasksDirectory, epic, issues);
    for (const story of epic.stories) {
      checkHeading(tasksDirectory, story, issues);
    }
    checkEpicChecklist(tasksDirectory, epic, issues);
  }

  return {
    epicCount: filesystemEpics.length,
    issues,
    storyCount: filesystemStories.length,
  };
}

if (import.meta.main) {
  const audit = auditTaskTree();
  if (audit.issues.length > 0) {
    console.error(`ERROR task tree has ${audit.issues.length} issue(s):`);
    for (const issue of audit.issues) {
      console.error(`  - ${issue}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      `OK task tree valid - ${audit.epicCount} epics, ${audit.storyCount} stories, manifest and parent links agree.`,
    );
  }
}
