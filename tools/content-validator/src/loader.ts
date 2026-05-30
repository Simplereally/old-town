/**
 * Filesystem loader for the content directory. Recursively reads every `.json` file,
 * tags it with the content kind implied by its top-level directory, and returns the
 * parsed JSON for the pure validator in `@old-town/shared`.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { type ContentIssue, type LoadedContentFile, kindForContentDir } from "@old-town/shared";

export interface LoadResult {
  readonly files: LoadedContentFile[];
  readonly issues: ContentIssue[];
}

/** Recursively load and parse content JSON from `contentDir`. */
export function loadContentDir(contentDir: string): LoadResult {
  const files: LoadedContentFile[] = [];
  const issues: ContentIssue[] = [];

  const walk = (dir: string): void => {
    if (!existsSync(dir)) {
      // Directory does not exist (e.g. no content yet) — nothing to load.
      return;
    }
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".json")) {
        continue;
      }
      const rel = relative(contentDir, full);
      const topDir = rel.split(sep)[0];
      const kind = topDir ? kindForContentDir(topDir) : undefined;
      if (!kind) {
        issues.push({
          path: rel,
          message: `file is not under a known content directory (top-level "${topDir}")`,
        });
        continue;
      }
      let data: unknown;
      try {
        data = JSON.parse(readFileSync(full, "utf8"));
      } catch (error) {
        issues.push({ path: rel, message: `invalid JSON: ${(error as Error).message}` });
        continue;
      }
      files.push({ path: rel, kind, data });
    }
  };

  walk(contentDir);
  return { files, issues };
}
