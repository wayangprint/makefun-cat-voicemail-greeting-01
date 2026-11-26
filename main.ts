// Funniest Cat Voicemail Greeting — entry runner (revised).
//
// What this program does, end to end:
//   1. Assemble the greeting from its three spoken beats (buildLine).
//   2. Check the assembled line against the competition's rules
//      (validateLine): at most 120 characters, ASCII only, and no
//      trailing newline, so the file byte count equals the character
//      count (113 here).
//   3. Pick where entry.txt goes (resolveOutputDir) and write the line
//      there with no trailing newline (writeLine).
//   4. Echo the same line to stdout so a human running it can read it.
//
// Determinism note: the greeting is a compile-time constant built from
// fixed string parts. Nothing reads the clock, the network, the
// environment (beyond the output-directory override), or any random
// source, so every run produces byte-identical output.
//
// Output-directory precedence:
//   - MAKEFUN_OUTPUT_DIR when set (the grading sandbox sets it to
//     /output; scratch dirs are used while verifying determinism),
//   - /output when that directory already exists (grading sandbox),
//   - otherwise the folder holding this script (local runs only).
// The script folder is never written while an output folder is
// available: the grading sandbox mounts the repository read-only, so
// a write there would throw and fail the run.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The three beats of the greeting, kept separate so the joke's shape
// is visible in the source: who answers, what the cat is doing, and
// what the caller must do next.
const GREETING_BEATS = [
  "You've reached Miso.",
  "I'm on your keyboard deleting your novel.",
  "Meow after the beep, and bring tuna as an apology.",
] as const;

// Competition ceiling for the entry, in characters.
const MAX_ENTRY_CHARS = 120;

// Join the beats with single spaces into the one line that is both
// printed and written to entry.txt.
function buildLine(beats: readonly string[]): string {
  return beats.join(" ");
}

// Enforce the competition's shape rules on the assembled line. Throws
// on the first violation so a bad edit fails loudly instead of
// submitting an entry the judges would reject.
function validateLine(line: string): void {
  if (line.length > MAX_ENTRY_CHARS) {
    throw new Error(
      `Greeting is ${line.length} characters, over the ${MAX_ENTRY_CHARS} limit.`,
    );
  }
  if (/[^\x00-\x7F]/.test(line)) {
    throw new Error("Greeting must be ASCII only.");
  }
  if (line.endsWith("\n")) {
    throw new Error("Greeting must not end with a newline.");
  }
}

// Decide the single directory that receives entry.txt, following the
// precedence documented at the top of this file.
function resolveOutputDir(): string {
  const override = (process.env.MAKEFUN_OUTPUT_DIR ?? "").trim();
  if (override.length > 0) {
    return override;
  }
  if (existsSync("/output")) {
    return "/output";
  }
  return new URL(".", import.meta.url).pathname;
}

// Write the line to entry.txt inside `dir`, creating the directory
// first, with no trailing newline — the file must contain exactly the
// greeting's bytes.
function writeLine(dir: string, line: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "entry.txt"), line, "utf8");
}

function main(): void {
  const line = buildLine(GREETING_BEATS);
  validateLine(line);
  writeLine(resolveOutputDir(), line);
  console.log(line);
}

main();
