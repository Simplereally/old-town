/**
 * Filesystem loader for the content directory. Recursively reads every `.json` file,
 * tags it with the content kind implied by its top-level directory, and returns the
 * parsed JSON for the pure validator in `@old-town/shared`.
 */
import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { type ContentIssue, type LoadedContentFile, kindForContentDir } from "@old-town/shared";

export interface LoadResult {
  readonly files: LoadedContentFile[];
  readonly issues: ContentIssue[];
}

interface PendingFile {
  readonly rel: string;
  readonly kind: NonNullable<ReturnType<typeof kindForContentDir>>;
  readonly full: string;
}

/** Recursively load and parse content JSON from `contentDir`. */
export async function loadContentDir(contentDir: string): Promise<LoadResult> {
  const pending: PendingFile[] = [];
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
      pending.push({ rel, kind, full });
    }
  };

  walk(contentDir);

  const files = await Promise.all(
    pending.map(async ({ rel, kind, full }): Promise<LoadedContentFile[]> => {
      try {
        const text = await readFile(full, "utf8");
        const data = JSON.parse(text) as unknown;
        return [{ path: rel, kind, data }];
      } catch (error) {
        issues.push({ path: rel, message: `invalid JSON: ${(error as Error).message}` });
        return [];
      }
    }),
  );

  return { files: files.flat(), issues };
}
