import assert from "node:assert/strict";
import test from "node:test";
import {
  getTryoutOptionLabel,
  stripTryoutOptionLabel,
} from "../lib/tryout-options.ts";

test("getTryoutOptionLabel converts stored order to UI letters", () => {
  assert.equal(getTryoutOptionLabel(1), "A");
  assert.equal(getTryoutOptionLabel(5), "E");
});

test("stripTryoutOptionLabel removes matching AI-generated prefixes", () => {
  assert.equal(stripTryoutOptionLabel("A. Pilihan pertama", 1), "Pilihan pertama");
  assert.equal(stripTryoutOptionLabel("(B) Pilihan kedua", 2), "Pilihan kedua");
  assert.equal(stripTryoutOptionLabel("C: Pilihan ketiga", 3), "Pilihan ketiga");
  assert.equal(stripTryoutOptionLabel("D - Pilihan keempat", 4), "Pilihan keempat");
  assert.equal(stripTryoutOptionLabel("**E.** Pilihan kelima", 5), "Pilihan kelima");
});

test("stripTryoutOptionLabel preserves text without the expected prefix", () => {
  assert.equal(stripTryoutOptionLabel("Analisis kebutuhan", 1), "Analisis kebutuhan");
  assert.equal(stripTryoutOptionLabel("B. J. Habibie", 1), "B. J. Habibie");
});
