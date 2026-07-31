import assert from "node:assert/strict";
import test from "node:test";
import { filterTableRows, normalizeTableValue, paginateTableRows, sortTableRows } from "../components/ui/table/data-table.utils.ts";
import { formatDateTime } from "../lib/date.ts";
import { getRelation } from "../lib/supabase/relations.ts";
import { buildCategoryPath, slugify } from "../lib/text.ts";
import { isRouteActive } from "../lib/navigation.ts";

test("slugify normalizes titles for routes", () => {
  assert.equal(slugify("  Strategi TI: Organisasi  "), "strategi-ti-organisasi");
});

test("buildCategoryPath ignores empty segments", () => {
  assert.equal(buildCategoryPath("IT", "Enterprise"), "IT > Enterprise");
  assert.equal(buildCategoryPath("IT", null), "IT");
});

test("getRelation normalizes Supabase singular relations", () => {
  assert.deepEqual(getRelation([{ id: "one" }]), { id: "one" });
  assert.equal(getRelation([]), null);
  assert.equal(getRelation(null), null);
});

test("isRouteActive handles dashboard root and nested routes", () => {
  assert.equal(isRouteActive("/dashboard", "/dashboard"), true);
  assert.equal(isRouteActive("/dashboard/course-management/1", "/dashboard/course-management"), true);
  assert.equal(isRouteActive("/dashboard-other", "/dashboard"), false);
});

test("formatDateTime returns the configured fallback for empty values", () => {
  assert.equal(formatDateTime(null), "-");
  assert.equal(formatDateTime(undefined, "N/A"), "N/A");
});

test("table utilities filter, sort, and paginate without mutating input", () => {
  const rows = [{ name: "Beta", score: 80 }, { name: "Alpha", score: 90 }];
  assert.equal(normalizeTableValue(true), "true");
  assert.deepEqual(filterTableRows(rows, ["name"], "alp"), [rows[1]]);
  assert.deepEqual(sortTableRows(rows, { key: "name", direction: "asc" }), [rows[1], rows[0]]);
  assert.deepEqual(rows.map((row) => row.name), ["Beta", "Alpha"]);
  assert.deepEqual(paginateTableRows(rows, 2, 1), [rows[1]]);
});
