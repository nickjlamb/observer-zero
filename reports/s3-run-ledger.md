# Study 3 reconciled run ledger

**FREEZE COMMIT (s3-confirmatory-freeze-v1.md, signed): `f4c22807d9bf5ff4d946a7fc1108ab8a8b217ce4`** — recorded here per the sign-off block, since a commit cannot contain its own hash. STUDY3_DESIGN_FROZEN=true from this commit; the freeze document's §10 forbidden-adaptations list is in force.

**Deviation log — 2026-08-31, pre-first-call launcher fix:** the first confirmatory command (sonar stratum) was refused at parse time because the `--confirmatory` seed escape hatch was documented in the error message but never implemented (defect class of the old unimplemented `--mode evaluate`). Zero API calls were made. Fixed as an exported, test-pinned gate (`checkConfirmatorySeedGate`, fail-closed both directions: confirmatory accepts only 2000–2099, non-confirmatory only 9100–9199); suite 351 green. No design, evaluator, endpoint, seed or analysis change.

**Deviation log — 2026-08-31, mid-scoring transport fix:** the cerebras-stratum eval-v3 scoring pass crashed twice ("Unexpected non-whitespace character after JSON") on judge chatter appended after a valid verdict — the response parser `extractJson` sliced from the first `{` to the LAST `}`. Replaced with first-BALANCED-object parsing (string- and escape-aware), which is semantics-preserving on every output the old code could parse and differs only on outputs the old code crashed on. Pinned by test/extract-json.test.ts; suite 357 green. No judge prompt, threshold, or verdict semantics touched. The affected pass (cerebras eval-v3) was re-run in full after the fix.

**Deviation log — 2026-08-31, scoring resilience:** sustained API 429/5xx killed the cerebras eval-v3 pass again ("judge API: retries exhausted") after 6 artifacts. Two orchestration/transport changes, both test-covered, neither touching judge behavior: (a) judge client retries raised 5→8 with backoff capped at 60s; (b) `--resume` flag on evaluate skips artifacts whose sidecar for the current eval version + solo procedure already exists — every sidecar is still produced by one complete uniform pass of the frozen procedure; a resumed directory pass is procedurally identical to an uninterrupted one. Used for the remainder of the confirmatory scoring.

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
