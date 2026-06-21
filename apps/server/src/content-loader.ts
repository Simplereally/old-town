/**
 * Content loader for the server boot process. Loads the content directory, validates
 * every definition, and returns typed registries. If validation fails the server must
 * fail fast — no gameplay starts with invalid content.
 */
import { isAbsolute, resolve } from "node:path";
import { loadContentDir } from "@old-town/content-validator";
import { type ContentIssue, type ContentRegistries, validateContent } from "@old-town/shared";

export interface BootContentResult {
  readonly ok: boolean;
  readonly issues: ContentIssue[];
  readonly registries: ContentRegistries;
}

export async function loadContent(contentDir: string): Promise<BootContentResult> {
  const projectRoot = resolve(import.meta.dirname, "../../..");
  const absoluteDir = isAbsolute(contentDir) ? contentDir : resolve(projectRoot, contentDir);
  const { files, issues: loadIssues } = await loadContentDir(absoluteDir);
  const { ok, issues, registries } = validateContent(files);
  const allIssues = [...loadIssues, ...issues];
  return { ok, issues: allIssues, registries };
}
