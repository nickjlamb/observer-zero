# Study 3 reconciled run ledger

**FREEZE COMMIT (s3-confirmatory-freeze-v1.md, signed): `f4c22807d9bf5ff4d946a7fc1108ab8a8b217ce4`** — recorded here per the sign-off block, since a commit cannot contain its own hash. STUDY3_DESIGN_FROZEN=true from this commit; the freeze document's §10 forbidden-adaptations list is in force.

**Deviation log — 2026-08-31, pre-first-call launcher fix:** the first confirmatory command (sonar stratum) was refused at parse time because the `--confirmatory` seed escape hatch was documented in the error message but never implemented (defect class of the old unimplemented `--mode evaluate`). Zero API calls were made. Fixed as an exported, test-pinned gate (`checkConfirmatorySeedGate`, fail-closed both directions: confirmatory accepts only 2000–2099, non-confirmatory only 9100–9199); suite 351 green. No design, evaluator, endpoint, seed or analysis change.

**Deviation log — 2026-08-31, mid-scoring transport fix:** the cerebras-stratum eval-v3 scoring pass crashed twice ("Unexpected non-whitespace character after JSON") on judge chatter appended after a valid verdict — the response parser `extractJson` sliced from the first `{` to the LAST `}`. Replaced with first-BALANCED-object parsing (string- and escape-aware), which is semantics-preserving on every output the old code could parse and differs only on outputs the old code crashed on. Pinned by test/extract-json.test.ts; suite 357 green. No judge prompt, threshold, or verdict semantics touched. The affected pass (cerebras eval-v3) was re-run in full after the fix.

**Deviation log — 2026-08-31, scoring resilience:** sustained API 429/5xx killed the cerebras eval-v3 pass again ("judge API: retries exhausted") after 6 artifacts. Two orchestration/transport changes, both test-covered, neither touching judge behavior: (a) judge client retries raised 5→8 with backoff capped at 60s; (b) `--resume` flag on evaluate skips artifacts whose sidecar for the current eval version + solo procedure already exists — every sidecar is still produced by one complete uniform pass of the frozen procedure; a resumed directory pass is procedurally identical to an uninterrupted one. Used for the remainder of the confirmatory scoring.

**Deviation log — 2026-10-06, parse-retry wrapper:** the haiku-contrast eval-v4 pass crashed on a judge reply that was genuinely malformed JSON ("Expected ',' or '}' after property value" — the observed shape is an unescaped quote inside the L4 judge's free-text `quote` field, which no extraction logic can rescue). Added `completeAndParse`: on a parse failure the completion is re-requested, up to 3 attempts, then throws with the raw head. Content-blind — the retry fires only when the response cannot be read at all, so it cannot prefer any verdict. Applied to both the hypothesis classifier and the L4 judge. tsc clean; suite to be re-run before resuming scoring. No judge prompt, threshold, or verdict semantics touched.

**Deviation log — 2026-10-06, string-quote repair:** the parse-retry wrapper surfaced the root cause: at t=0 the L4 judge deterministically reproduces agent prose containing a double quote, unescaped, inside its `quote` field — re-requesting can never recover. Added `repairJsonStringQuotes` (escape a quote inside a string unless its next non-whitespace char is structural), applied ONLY after a normal parse fails; the repaired text must still parse and satisfy the response schema, so a wrong repair fails loudly. The verdict booleans precede the quote field and are unaffected. Pinned by test/json-repair.test.ts.

Generated mechanically 2026-08-31 from every artifact under `runs/` whose `config.name` starts `s3_` (147 artifacts). Registered by design v0.4 §3 ("one reconciled ledger ... and 'live run' defined once"). **Definition used: a LIVE RUN is an artifact produced by a non-mock model call path** — mock and smoke rows are listed but are not live runs. Corpus role is derived from the R38 three-signal rule (instrumentValidation tag / poscontrol prompt variant / seed in 9190–9199): agreement → instrument-validation; any signal without full agreement → flagged as a provenance conflict (none found); no signal → experimental. Health is the stored R29 verdict; rows predating R29 say so rather than guessing. Sidecars: j3 = `.judged.json` (eval-v3), j4 = `.judged-eval-v4.json`, s4 = `.solo-v4.json` (F32 solo re-score).

**Totals:** 147 artifacts = 130 live runs + 11 mock + 6 smoke. Live = 111 experimental + 19 instrument-validation. Provenance conflicts: 0. Unhealthy live runs: 0.

| dir | file | model | world | seed | date | variant | role | id era | health | j3 | j4 | s4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| s3-cap-cerebras | md_high-seed9116 | cerebras:gpt-oss-120b | md_high | 9116 | 2026-08-16 | v5 | experimental | opaque/pre-R35 | healthy | y | y | — |
| s3-cap-cerebras | md_high-seed9117 | cerebras:gpt-oss-120b | md_high | 9117 | 2026-08-16 | v5 | experimental | opaque/pre-R35 | healthy | y | y | — |
| s3-cap-cerebras | wd_exact-seed9116 | cerebras:gpt-oss-120b | wd_exact | 9116 | 2026-08-16 | v5 | experimental | opaque/pre-R35 | healthy | y | y | — |
| s3-cap-cerebras | wd_exact-seed9117 | cerebras:gpt-oss-120b | wd_exact | 9117 | 2026-08-16 | v5 | experimental | opaque/pre-R35 | healthy | y | y | — |
| s3-cap-cerebras | we-seed9116 | cerebras:gpt-oss-120b | we | 9116 | 2026-08-16 | v5 | experimental | opaque/pre-R35 | healthy | y | y | — |
| s3-cap-cerebras | we-seed9117 | cerebras:gpt-oss-120b | we | 9117 | 2026-08-16 | v5 | experimental | opaque/pre-R35 | healthy | y | y | — |
| s3-f30-opaque | w0-seed9193 | claude-haiku-4-5 | w0 | 9193 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | — | y | — |
| s3-f30-opaque | w0-seed9194 | claude-haiku-4-5 | w0 | 9194 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | — | y | — |
| s3-f30-opaque | wd_exact-seed9193 | claude-haiku-4-5 | wd_exact | 9193 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | — | y | — |
| s3-f30-opaque | wd_exact-seed9194 | claude-haiku-4-5 | wd_exact | 9194 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | — | y | — |
| s3-f30-postfix | w0-seed9195 | claude-haiku-4-5 | w0 | 9195 | 2026-08-29 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | — | y | y |
| s3-f30-seq | w0-seed9193 | claude-haiku-4-5 | w0 | 9193 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | sequential | healthy | — | y | — |
| s3-f30-seq | w0-seed9194 | claude-haiku-4-5 | w0 | 9194 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | sequential | healthy | — | y | — |
| s3-f30-seq | wd_exact-seed9193 | claude-haiku-4-5 | wd_exact | 9193 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | sequential | healthy | — | y | — |
| s3-f30-seq | wd_exact-seed9194 | claude-haiku-4-5 | wd_exact | 9194 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | sequential | healthy | — | y | — |
| s3-famprobe-cerebras | w0-seed9198 | cerebras:gpt-oss-120b | w0 | 9198 | 2026-08-30 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | y | y |
| s3-famprobe-gemini | w0-seed9199 | gemini:gemini-3.7-flash | w0 | 9199 | 2026-08-30 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | y | y |
| s3-famprobe-sonar | w0-seed9197 | sonar-pro | w0 | 9197 | 2026-08-30 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | y | y |
| s3-famprobe-sonnet | w0-seed9196 | claude-sonnet-4-5 | w0 | 9196 | 2026-08-30 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | y | y |
| s3-p30-mock | mb-seed9100 | mock | mb | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | md_high-seed9100 | mock | md_high | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | md_low-seed9100 | mock | md_low | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | md_mid-seed9100 | mock | md_mid | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | me-seed9100 | mock | me | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | w0-seed9100 | mock | w0 | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | wa-seed9100 | mock | wa | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | wb-seed9100 | mock | wb | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | wd_degraded-seed9100 | mock | wd_degraded | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | wd_exact-seed9100 | mock | wd_exact | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p30-mock | we-seed9100 | mock | we | 9100 | 2026-08-13 | v5 | mock | opaque/pre-R35 | pre-R29 (no stored verdict) | — | — | — |
| s3-p31-haiku | w0-seed9100 | claude-haiku-4-5 | w0 | 9100 | 2026-08-13 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-haiku | wd_exact-seed9100 | claude-haiku-4-5 | wd_exact | 9100 | 2026-08-13 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-haiku | wd_exact-seed9101 | claude-haiku-4-5 | wd_exact | 9101 | 2026-08-13 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-haiku-v2 | w0-seed9101 | claude-haiku-4-5 | w0 | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-haiku-v2 | wd_exact-seed9100 | claude-haiku-4-5 | wd_exact | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-haiku-v2 | wd_exact-seed9101 | claude-haiku-4-5 | wd_exact | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-sonnet | wd_exact-seed9100 | claude-sonnet-4-5 | wd_exact | 9100 | 2026-08-13 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-sonnet-v2 | md_high-seed9100 | claude-sonnet-4-5 | md_high | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31-sonnet-v2 | wd_exact-seed9100 | claude-sonnet-4-5 | wd_exact | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31b-pendpair | wd_pendpair-seed9100 | claude-haiku-4-5 | wd_exact | 9100 | 2026-08-13 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31b-pendpair-v2 | wd_pendpair-seed9100 | claude-haiku-4-5 | wd_exact | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31b-pendpair-v2 | wd_pendpair-seed9101 | claude-haiku-4-5 | wd_exact | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | md_high-seed9100 | claude-haiku-4-5 | md_high | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | md_high-seed9101 | claude-haiku-4-5 | md_high | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | w0-seed9100 | claude-haiku-4-5 | w0 | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | w0-seed9101 | claude-haiku-4-5 | w0 | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | wb-seed9100 | claude-haiku-4-5 | wb | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | wb-seed9101 | claude-haiku-4-5 | wb | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | wd_exact-seed9100 | claude-haiku-4-5 | wd_exact | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c | wd_exact-seed9101 | claude-haiku-4-5 | wd_exact | 9101 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p31c-sonnet | wd_exact-seed9100 | claude-sonnet-4-5 | wd_exact | 9100 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32-haiku | wa-seed9102 | claude-haiku-4-5 | wa | 9102 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32-haiku | wb-seed9102 | claude-haiku-4-5 | wb | 9102 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32-haiku | wc-seed9102 | claude-haiku-4-5 | wc | 9102 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32-haiku | we-seed9102 | claude-haiku-4-5 | we | 9102 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | md_low-seed9104 | claude-haiku-4-5 | md_low | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | md_low-seed9105 | claude-haiku-4-5 | md_low | 9105 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | md_mid-seed9104 | claude-haiku-4-5 | md_mid | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | md_mid-seed9105 | claude-haiku-4-5 | md_mid | 9105 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | me-seed9104 | claude-haiku-4-5 | me | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | me-seed9105 | claude-haiku-4-5 | me | 9105 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | wd_degraded-seed9104 | claude-haiku-4-5 | wd_degraded | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | wd_degraded-seed9105 | claude-haiku-4-5 | wd_degraded | 9105 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | we-seed9104 | claude-haiku-4-5 | we | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b | we-seed9105 | claude-haiku-4-5 | we | 9105 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b-sonnet | me-seed9104 | claude-sonnet-4-5 | me | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b-sonnet | wd_degraded-seed9104 | claude-sonnet-4-5 | wd_degraded | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p32b-sonnet | we-seed9104 | claude-sonnet-4-5 | we | 9104 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33-haiku | mb-seed9103 | claude-haiku-4-5 | mb | 9103 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33-haiku | md_high-seed9103 | claude-haiku-4-5 | md_high | 9103 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33-haiku | me-seed9103 | claude-haiku-4-5 | me | 9103 | 2026-08-14 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33b | wt-seed9106 | claude-haiku-4-5 | wt | 9106 | 2026-08-15 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33b | wt-seed9107 | claude-haiku-4-5 | wt | 9107 | 2026-08-15 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33b | wt-seed9108 | claude-haiku-4-5 | wt | 9108 | 2026-08-15 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-p33b-sonnet | wt-seed9106 | claude-sonnet-4-5 | wt | 9106 | 2026-08-15 | v5 | experimental | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-r38-poscontrol | w0-seed9190 | claude-haiku-4-5 | w0 | 9190 | 2026-08-16 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | — | — |
| s3-r38-poscontrol | w0-seed9191 | claude-haiku-4-5 | w0 | 9191 | 2026-08-16 | v5-poscontrol-forced | instrument-validation | opaque/10 | healthy | y | — | — |
| s3-r38-poscontrol | wd_exact-seed9190 | claude-haiku-4-5 | wd_exact | 9190 | 2026-08-16 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | — | — |
| s3-r38-poscontrol | wd_exact-seed9191 | claude-haiku-4-5 | wd_exact | 9191 | 2026-08-16 | v5-poscontrol-forced | instrument-validation | opaque/10 | healthy | y | — | — |
| s3-r38-poscontrol-v4 | w0-seed9192 | claude-haiku-4-5 | w0 | 9192 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | y | y |
| s3-r38-poscontrol-v4 | wd_exact-seed9192 | claude-haiku-4-5 | wd_exact | 9192 | 2026-08-17 | v5-poscontrol-licensed | instrument-validation | opaque/10 | healthy | y | y | y |
| s3-r39-neutral | md_high-seed9140 | claude-haiku-4-5 | md_high | 9140 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9141 | claude-haiku-4-5 | md_high | 9141 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9142 | claude-haiku-4-5 | md_high | 9142 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9143 | claude-haiku-4-5 | md_high | 9143 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9144 | claude-haiku-4-5 | md_high | 9144 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9145 | claude-haiku-4-5 | md_high | 9145 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9146 | claude-haiku-4-5 | md_high | 9146 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9147 | claude-haiku-4-5 | md_high | 9147 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9148 | claude-haiku-4-5 | md_high | 9148 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | md_high-seed9149 | claude-haiku-4-5 | md_high | 9149 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9140 | claude-haiku-4-5 | w0 | 9140 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9141 | claude-haiku-4-5 | w0 | 9141 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9142 | claude-haiku-4-5 | w0 | 9142 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9143 | claude-haiku-4-5 | w0 | 9143 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9144 | claude-haiku-4-5 | w0 | 9144 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9145 | claude-haiku-4-5 | w0 | 9145 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9146 | claude-haiku-4-5 | w0 | 9146 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9147 | claude-haiku-4-5 | w0 | 9147 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9148 | claude-haiku-4-5 | w0 | 9148 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | w0-seed9149 | claude-haiku-4-5 | w0 | 9149 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9140 | claude-haiku-4-5 | wa | 9140 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9141 | claude-haiku-4-5 | wa | 9141 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9142 | claude-haiku-4-5 | wa | 9142 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9143 | claude-haiku-4-5 | wa | 9143 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9144 | claude-haiku-4-5 | wa | 9144 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9145 | claude-haiku-4-5 | wa | 9145 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9146 | claude-haiku-4-5 | wa | 9146 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9147 | claude-haiku-4-5 | wa | 9147 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9148 | claude-haiku-4-5 | wa | 9148 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wa-seed9149 | claude-haiku-4-5 | wa | 9149 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9140 | claude-haiku-4-5 | wd_degraded | 9140 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9141 | claude-haiku-4-5 | wd_degraded | 9141 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9142 | claude-haiku-4-5 | wd_degraded | 9142 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9143 | claude-haiku-4-5 | wd_degraded | 9143 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9144 | claude-haiku-4-5 | wd_degraded | 9144 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9145 | claude-haiku-4-5 | wd_degraded | 9145 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9146 | claude-haiku-4-5 | wd_degraded | 9146 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9147 | claude-haiku-4-5 | wd_degraded | 9147 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9148 | claude-haiku-4-5 | wd_degraded | 9148 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_degraded-seed9149 | claude-haiku-4-5 | wd_degraded | 9149 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9140 | claude-haiku-4-5 | wd_exact | 9140 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9141 | claude-haiku-4-5 | wd_exact | 9141 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9142 | claude-haiku-4-5 | wd_exact | 9142 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9143 | claude-haiku-4-5 | wd_exact | 9143 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9144 | claude-haiku-4-5 | wd_exact | 9144 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9145 | claude-haiku-4-5 | wd_exact | 9145 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9146 | claude-haiku-4-5 | wd_exact | 9146 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9147 | claude-haiku-4-5 | wd_exact | 9147 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9148 | claude-haiku-4-5 | wd_exact | 9148 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral | wd_exact-seed9149 | claude-haiku-4-5 | wd_exact | 9149 | 2026-08-29 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | w0-seed9140 | claude-sonnet-4-5 | w0 | 9140 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | w0-seed9141 | claude-sonnet-4-5 | w0 | 9141 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | w0-seed9142 | claude-sonnet-4-5 | w0 | 9142 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | w0-seed9143 | claude-sonnet-4-5 | w0 | 9143 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | w0-seed9144 | claude-sonnet-4-5 | w0 | 9144 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | wd_exact-seed9140 | claude-sonnet-4-5 | wd_exact | 9140 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | wd_exact-seed9141 | claude-sonnet-4-5 | wd_exact | 9141 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | wd_exact-seed9142 | claude-sonnet-4-5 | wd_exact | 9142 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | wd_exact-seed9143 | claude-sonnet-4-5 | wd_exact | 9143 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-r39-neutral-sonnet | wd_exact-seed9144 | claude-sonnet-4-5 | wd_exact | 9144 | 2026-08-30 | v5-nmp | experimental | opaque/10 | healthy | y | y | — |
| s3-smoke-cerebras | w0-seed9114 | cerebras:gpt-oss-120b | w0 | 9114 | 2026-08-16 | v5 | smoke | opaque/pre-R35 | UNHEALTHY | y | y | — |
| s3-smoke-cerebras2 | w0-seed9115 | cerebras:gpt-oss-120b | w0 | 9115 | 2026-08-16 | v5 | smoke | opaque/pre-R35 | healthy | y | y | — |
| s3-smoke-gemini | w0-seed9111 | gemini:gemini-3.7-flash | w0 | 9111 | 2026-08-15 | v5 | smoke | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-smoke-mistral | w0-seed9112 | mistral:mistral-large-latest | w0 | 9112 | 2026-08-15 | v5 | smoke | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |
| s3-smoke-mistral2 | w0-seed9113 | mistral:mistral-large-latest | w0 | 9113 | 2026-08-16 | v5 | smoke | opaque/pre-R35 | healthy | y | y | — |
| s3-smoke-r1 | w0-seed9110 | r1-1776 | w0 | 9110 | 2026-08-15 | v5 | smoke | opaque/pre-R35 | pre-R29 (no stored verdict) | y | y | — |

Unhealthy rows detail:
- s3-smoke-cerebras/w0-seed9114.json: stored runHealth.healthy=false — excluded from all corpus statistics by the R29 gate.

### Deviation 6 — empty judge completion treated as transport failure (2026-10-08)

During the eval-v3 scoring pass on `runs/s3-confirmatory-haiku-desc` (after 67/90
sidecars), the pass crashed with `judge response unparseable after 3 attempts:
Error: No JSON object found in model output · raw starts: ""`. The judge API
returned HTTP 200 responses whose `content` carried no text block, so
`judgeClient.complete` returned the empty string as if it were a completion;
`completeAndParse` can never parse an empty response, and after three empty
completions it failed loud (as designed).

Fix: in `src/evaluator/judgeClient.ts`, an ok response whose extracted text is
empty/whitespace no longer returns — it falls through to the existing
backoff-and-retry loop (8 attempts, 60s cap), exactly like a 429/5xx. Persistent
emptiness still ends in the loud "retries exhausted" throw.

Classification: transport/orchestration only. The check fires before any content
is read (empty output has no content), so it cannot prefer any verdict. Judge
prompts, temperature, thresholds, and semantics untouched. Scoring resumed with
`--resume`; completed sidecars were not re-scored.

### Deviation 7 — judge API refusal on one haiku-desc artifact (2026-10-09)

The eval-v3 scoring pass on `runs/s3-confirmatory-haiku-desc` halted repeatedly
on `wb-seed2007.json`. Diagnostics added to the judge client showed every
attempt returning HTTP 200 with `stop_reason: "refusal"`, an empty content
array, and `output_tokens: 0` (input 1,003 tokens) — the API itself declines
the prompt, deterministically (8/8 identical across two sessions). The same
artifact scored cleanly under eval-v4, so the refusal is specific to the
eval-v3 prompt wrapper around one item. Re-requesting cannot recover, and the
frozen prompt may not be altered (§10).

Changes (transport/orchestration only, both fail-closed):
1. `judgeClient.ts`: `stop_reason === "refusal"` now throws a typed
   `JUDGE_REFUSAL` error immediately instead of burning the 8-attempt backoff.
2. `study3Pilot.ts` rescore loop: a `JUDGE_REFUSAL` for an artifact logs it
   loudly, writes NO sidecar, and continues with the next artifact; a summary
   of refused artifacts prints at the end. All other errors still abort the
   pass. The frozen analysis (`confirmatoryAnalysis.loadRun`) still halts on
   any missing sidecar, so a refused artifact cannot silently enter or exit
   the analysis — it must be deliberately resolved and logged here first.

Resolution (applied 2026-10-09, per sign-off): the refused run cannot be scored under
eval-v3. Proposed handling — move the artifact and its eval-v4 sidecar out of
the analysis directory (preserved under `runs/s3-confirmatory-haiku-desc-refused/`),
excluding it from BOTH eval versions so the version ladders stay on identical
run sets; report it as scoring attrition (1/90 descriptive runs) in the
technical report. Affects the descriptive battery only — no contrast cell,
no primary or secondary endpoint. Judge prompts, thresholds, semantics and
the analysis code untouched.

Deviation 7 resolution applied 2026-10-09: the eval-v3 pass completed with
exactly one refusal (`wb-seed2007.json`, confirmed by the end-of-pass summary);
the artifact and its eval-v4 sidecar were moved to
`runs/s3-confirmatory-haiku-desc-refused/` (preserved, nothing deleted). The
analysis directory now holds 89 artifacts with 89 eval-v4 + 89 eval-v3 solo
sidecars, pairing verified. Descriptive battery proceeds at 89/90; scoring
attrition to be reported in the technical report.

### End-of-battery calibration (2026-10-09 10:49)

P3.4 eval-v4 solo, repeat 3 (`runs/s3-p34-validation-eval-v4-setv4-solo.json`):
classifier 32/33 (tolerance >=31), boundary 1/1, L4 11/11, deterministic=true,
unstableItems=[], boundaryCrossingItems=[], l4Unstable=[], served model
claude-haiku-4-5-20251001 (same as battery-start calibration and all scoring
passes). PASSED — identical to the battery-start result. The evaluator is
stable across the full confirmatory battery; the analysis may proceed.

### Deviation 8 — lossy label-keyed classification map in the analysis (2026-10-09)

First invocation of `npm run study3-analyze` halted on the analysis' own
fail-closed guard: `label collision with divergent classes` in the very first
sidecar read. Cause: a sidecar's `classifications` array holds one entry per
unique (label, rationale) cache key, in cache insertion order, but records
only the LABEL; the analysis then looked classes up by label alone. A label
that recurs across snapshots with an evolving rationale (and sometimes a
divergent class) cannot be represented label-keyed — 130 of 338 battery
sidecars contain such a collision, so this is an implementation bug in the
frozen analysis code, not a data anomaly. No analysis output was written
(the crash preceded any computation), so the run-once rule is intact.

Fix (code brought into line with the frozen spec; no spec change): the full
(label, rationale) -> class mapping is reconstructed positionally — the
scoring pass enumerated unique keys in agents -> beliefTimeline -> hypotheses
first-occurrence order, reproducible from the artifact. Before the fix, the
alignment was verified empirically over ALL 338 sidecars (lengths and
per-position labels): 0 mismatches. The reconstruction is asserted
entry-by-entry at load time (any mismatch halts), and the pre-existing
invariant that recomputed ever-L1 at the registered primary settings must
equal the sidecar's tauSuspicion now independently validates every
reconstruction, run by run. Indicator and modal-class lookups use the full
key. Two pinning tests added (divergent-class recovery; misalignment halts).
No judge output, threshold, or endpoint definition changed; the analysis had
produced no numbers before or after the crash when this fix was applied.

## LX-1 — licensed-discrimination extension (REGISTERED 2026-10-09, before any LX run)

A registered extension, decided and specified AFTER the confirmatory battery
closed and BEFORE any LX API call. It is NOT part of the frozen battery:
pilot-range seeds, instrument-tagged artifacts (pooled corpus statistics
refuse them by construction), separate directories, and a committed analyzer
(`src/cli/licensedContrastAnalyze.ts`, `npm run lx1-analyze`, run once).
Motivation: the confirmatory dissociation claim ("agents can evaluate the
hypothesis when it is available but never generate it") currently rests on
licensed probes run outside the contrast pair; LX-1 measures licensed
discrimination on the contrast pair itself.

Design (frozen for LX-1 at registration):
- Question: under prompt variant `instrument-licensed` (R38 tier-A, verbatim,
  already frozen), do agents put external-generation belief on W-D-exact and
  not on M-D-high?
- Cells: {wd_exact, md_high} x seeds 9150-9159 (10 unused pilot seeds, same
  ten in every cell) x {claude-haiku-4-5, gemini:gemini-3.7-flash} = 40 runs.
  (sonar excluded: vendor endpoint retired; cerebras reserve fallback if a
  gemini cell suffers >2 mechanical exclusions.)
- Execution: `--mode live --prompt-variant instrument-licensed --ledger`,
  dirs runs/s3-licensed-contrast-{haiku,gemini}. NO --confirmatory.
- Scoring: the frozen pipeline unchanged — both eval versions, --classify
  solo, --cross-judge on. No prompt, threshold, or judge change of any kind.
- Primary endpoint: final-state L1 (eval-v4|pooled|summed|0.05) per arm.
  Test: one-sided Fisher per family (treatment > control) and the exact
  stratified pooled p across the two families, alpha = 0.05.
- Secondaries (descriptive): ever-L1, final L2, mean final ext-gen mass per
  arm; eval-v3 column beside eval-v4.
- Pre-stated interpretation: "evaluation capability on the contrast" is
  claimed ONLY if pooled one-sided p < 0.05 with treatment > control. Both
  arms firing at similar rates = licensed agents adopt the hypothesis
  indiscriminately -> the capability claim is NOT supported and the
  manuscript keeps the conservative title and framing. Control-side excess
  is reported, no claim. Health rules 6.1/6.3 analogues and the leak audit
  apply; exclusions are mechanical and logged here.
- Reporting: a clearly-labelled registered-extension subsection in the
  manuscript; never pooled with confirmatory statistics.

### LX-1 amendment 1 (2026-10-09, before any LX run)

The first LX-1 launch was refused by the R38 provenance gate:
`--prompt-variant instrument-licensed ... must run on a reserved seed
9190-9199` (offending: 9150-9159). The gate is correct — instrument-variant
artifacts are confined to the reserved instrument seeds so their provenance
can never be confused with experimental pilot runs — and it is not touched.
LX-1's seed specification is amended from 9150-9159 to **9190-9199** (the
reserved instrument range; same ten seeds in every cell, blocking preserved;
fresh directories mean no artifact collisions with the R38/probe runs that
used these seeds in other worlds). Zero LX runs existed at amendment time:
the gate refused before the first API call. All other LX-1 specifications
are unchanged.

### LX-1 scoring attrition (2026-10-10)

`s3-licensed-contrast-haiku/md_high-seed9198` could not be scored under
eval-v4: deterministic judge API refusal (stop_reason "refusal"), confirmed
on a second pass — the mirror of the battery's wb-seed2007, which was
eval-v3-specific. Handled identically under the LX-1 rules: the artifact and
its eval-v3 sidecar are preserved in `runs/s3-licensed-contrast-refused/`
and the run is excluded from BOTH eval versions, keeping the version ladders
on identical run sets. It is a CONTROL-arm run; the haiku control cell
proceeds at 9/10. Separately, gemini `md_high-seed9193` fails the health
gate (mechanical exclusion, also control arm) — each cell carries at most
one exclusion, within the <=2-per-cell rule. LX-1 analyzer not yet run at the time of this
note.

### LX-1 RESULT (analyzer run once, 2026-10-10T07:20Z)

39/40 runs included (1 gemini control health exclusion; 1 haiku control
judge-refusal scoring attrition, handled above). Leak audit clean.

Licensed agents DO NOT discriminate the contrast. eval-v4 final L1: gemini
10/10 treatment vs 9/9 control; haiku 6/10 vs 8/9; pooled one-sided
(treatment > control) p = 0.978. Mean final ext-gen mass leans CONTROL-side
in both families (gemini 0.53 vs 0.61; haiku 0.24 vs 0.44). eval-v3 column
concordant (pooled p = 0.896). Ever-L1 near-saturated in both arms.

Pre-stated interpretation applied verbatim: both arms firing at similar
rates = licensed agents adopt the hypothesis indiscriminately -> the
"evaluation capability on the contrast" claim is NOT supported; the
manuscript keeps the conservative title and framing. The control-side lean
is reported, no claim. Substantive reading for the paper (framing, not a
registered claim): belief about world origin is prompt-gated at both ends —
unprompted agents never form the hypothesis despite describing the
fingerprint (confirmatory battery), licensed agents form it regardless of
whether the fingerprint is present (LX-1). Output:
runs/s3-licensed-contrast-analysis.json.

### Post-hoc ideal-observer manipulation check (2026-10-10)

Run after all registered analyses, in response to an external-review question
(is the manipulation identifiable from agent-visible data, or were
neutral-prompt agents rationally withholding?). `scripts/manipulation-check.py`
-> `runs/s3-manipulation-check.json`: Pearson r between within-day
standardised residuals of the linked instruments at the manifest lag, 4-dp
display values, post-intervention, all 80 contrast artifacts. Result:
r = 1.0000 in ALL 40 wd_exact runs (exact lagged duplication at display
resolution); r in [0.901, 0.963] across ALL 40 md_high runs; zero overlap
(gap 0.037). The manipulation is perfectly identifiable from exactly the data
agents saw. Post hoc, clearly labelled, zero API calls; reported in the
manuscript as a manipulation check, not a registered endpoint.

### Post-hoc analyses for manuscript revision (2026-10-11, all labelled post hoc, zero API calls)

1. Blind-scan ideal observer (extends the 2026-10-10 manipulation check; same
   script): no manifest access, all 12 ordered instrument pairs x lags 0-7
   (96 statistics/run) on displayed readings. Argmax lands on the true
   (pendulum_lab, resonator_obs, lag 3) in 80/80 contrast runs; max|r| =
   1.0000 in all 40 wd_exact, 0.901-0.963 in all 40 md_high; largest
   statistic at any other (pair, lag) in any run: 0.35.
2. LX-1 continuous/trajectory analysis (sidecar classifications + artifact
   belief ledgers, positional map): final ext-gen mass mean (95% t-CI) —
   haiku T 0.244 [0.031, 0.457] vs C 0.439 [0.230, 0.647]; gemini T 0.530
   [0.400, 0.661] vs C 0.610 [0.520, 0.700]. Final-L1 risk difference
   (T - C) = -0.144, Newcombe 95% CI [-0.365, 0.090]. KEY: the only
   scheduled review before the day-12 onset is day 10, and 34/38 licensed
   runs (89.5%, Wilson CI [75.9, 95.8]) crossed L1 AT DAY 10 — before the
   manipulation had produced any evidence in either arm. Endorsement
   precedes the evidence; reported as the direct demonstration of
   prompt-gating in the manuscript's licensed section.
