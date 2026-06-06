import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

describe("jsdom in bun test", () => {
  it("can create a dom", () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
    expect(dom.window.document.getElementById("app")).toBeTruthy();
  });
});
