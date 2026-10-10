# Table 1 — Study 3 run accounting

Every agent run contributing to a reported Study 3 result, by phase. Seeds, prompts, exclusions, and provenance gates are those registered in the freeze document (`reports/s3-confirmatory-freeze-v1.md`) and run ledger (`reports/s3-run-ledger.md`). All exclusions are mechanical (pre-registered health gate or deterministic judge-API refusal) and are listed run-by-run in the ledger.

| Phase | Design | Launched | Excluded | Analysed | Seeds | Prompt |
|---|---|---:|---:|---:|---|---|
| Confirmatory contrast battery | 4 model families × (W-D-exact vs M-D-high) × 10 seeds | 80 | 2 (health gate) | 78 (38 T, 40 C) | 2000–2009 | frozen neutral v0.1 |
| Confirmatory descriptive battery | claude-haiku, 9 worlds × 10 seeds | 90 | 2 (1 health gate; 1 judge refusal) | 88 | 2000–2009 | frozen neutral v0.1 |
| R39 mundane-prior ablation | claude-haiku, 5 worlds × 10 seeds; claude-sonnet, 2 worlds × 5 seeds | 60 | 0 | 60 | 9140–9149 | neutral v0.1 minus mundane-prior instruction |
| LX-1 licensed-prompt contrast | claude-haiku + gemini × (W-D-exact vs M-D-high) × 10 seeds | 40 | 2 (1 health gate; 1 judge refusal) | 38 (20 T, 18 C) | 9190–9199 (reserved instrument range) | instrument-licensed |
| R38 positive controls | scripted ext-gen reasoning, W-0 + W-D-exact | 6 | 0 | 6 | 9190–9192 | scripted (tier-0 forced) |
| Family / postfix probes | single-run instrument probes, W-0 | 5 | 0 | 5 | 9195–9199 | frozen neutral v0.1 |
| **Analysed corpus** | | **281** | **6** | **275** | | |
| Development and pilot runs (R1–R40 programme, 24 directories, incl. 6 smoke runs and f30 probe variants) | | 76 | — | — | development ranges | various (registered per pilot) |
| **Study 3 total** | | **357** | | | | |

Notes.
T = treatment arm (W-D-exact, genuinely externally generated readings); C = control arm (M-D-high, matched in-world coupling). Health-gate exclusions: `sonar/wd_exact-seed2009`, `cerebras/wd_exact-seed2005`, `haiku-desc/md_low-seed2001`, `lx-gemini/md_high-seed9193`. Judge-refusal exclusions (deterministic `stop_reason: "refusal"`, 0 output tokens; artifacts preserved): `haiku-desc/wb-seed2007`, `lx-haiku/md_high-seed9198`; each was excluded from both evaluator versions to keep version ladders on identical run sets. The descriptive battery's 88 scored runs are the 90 launched minus one health-gate and one judge-refusal exclusion. Seeds 2010–2099 (battery reserve) and the remainder of the 9190–9199 instrument range were never spent. The repository as a whole (Studies 1–3) contains 666 run artifacts.
