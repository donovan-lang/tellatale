// Side-effect import: must be the first import so env is set before src/lib modules read it
// (ES imports are hoisted above top-level code, so an inline loader runs too late).
import * as fs from "fs";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
