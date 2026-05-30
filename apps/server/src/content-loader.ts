/**
 * Content loader for the server boot process. Loads the content directory, validates
 * every definition, and returns typed registries. If validation fails the server must
 * fail fast — no gameplay starts with invalid content.
 */
import { resolve } from "node:path";
import { type ContentIssue, type ContentRegistries, validateContent } from "@old-town/shared";
import { loadContentDir } from "../../../tools/content-validator/src/loader";

export interface BootContentResult {
  readonly ok: boolean;
  readonly issues: ContentIssue[];
  readonly registries: ContentRegistries;
}

export function loadContent(contentDir: string): BootContentResult {
  const absoluteDir = resolve(process.cwd(), contentDir);
  const { files, issues: loadIssues } = loadContentDir(absoluteDir);
  const { ok, issues, registries } = validateContent(files);
  const allIssues = [...loadIssues, ...issues];
  return { ok, issues: allIssues, registries };
}
