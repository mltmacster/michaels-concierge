import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { parse } from "yaml";

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? walk(file)
      : file.endsWith(".md")
        ? [file]
        : [];
  });
}
const files = [
  "README.md",
  "HANDOFF.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  ...walk("docs"),
];
const ids = new Set();
let linkCount = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const front = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(front, `${file}: YAML front matter required`);
  const meta = parse(front[1]);
  for (const key of [
    "document_id",
    "version",
    "status",
    "owner",
    "maintainer",
    "created",
    "updated",
    "append_protocol",
  ]) {
    assert.ok(meta[key], `${file}: missing ${key}`);
  }
  assert.ok(!ids.has(meta.document_id), `${file}: duplicate document ID`);
  ids.add(meta.document_id);
  assert.ok(
    text.includes(`Document footer — ${meta.document_id} v${meta.version}`),
    `${file}: footer mismatch`
  );
  assert.ok(text.endsWith("\n"), `${file}: missing newline`);
  const body = text.replace(/```[\s\S]*?```/g, "");
  for (const match of body.matchAll(/!?\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const fileTarget = decodeURIComponent(target.split("#")[0]);
    assert.ok(
      fs.existsSync(path.resolve(path.dirname(file), fileTarget)),
      `${file}: missing link ${target}`
    );
    linkCount++;
  }
}
console.log(
  `PASS: ${files.length} controlled documents; metadata, unique IDs, footers, and ${linkCount} local links.`
);
