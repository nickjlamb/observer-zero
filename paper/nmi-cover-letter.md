# Cover letter — Nature Machine Intelligence submission

*Draft for Nick's review, 2026-10-10. Paste into the submission system; placeholders in [brackets].*

---

Dear Editors,

Please consider the enclosed Article, "Language model agents describe anomalous evidence without forming the hypothesis that explains it", for publication in Nature Machine Intelligence.

Language-model agents are now deployed as autonomous experimenters, and two open questions sit behind their trustworthiness: whether they notice when something fundamental about their situation is wrong, and whether they generate and test hypotheses rather than merely execute procedure. The study reported here makes the origin of an agent's world an experimentally manipulable variable. In an instrumented artificial laboratory, one instrument's readings were genuinely generated outside the simulation, leaving an exact and verifiably recoverable statistical fingerprint; a matched control reproduced nearly the same surface behaviour by ordinary in-world mechanism. A pre-registered 170-run confirmatory battery across four model families — design, prompts, endpoints, statistics and interpretation rules frozen and the analysis committed before the first run, executed once — found that no agent ever formed the external-generation hypothesis (0 of 38 treatment runs; one-sided 95% upper bound 7.6%), even though a majority of treatment runs ended on hypotheses correctly describing the duplication mechanism itself, one explicitly measuring r = 1.000 and inferring automated mirroring with the true three-day delay. A single-line prompt ablation left formation at zero across 2,424 further hypotheses, and a registered licensed-prompt extension showed the complement: agents permitted to consider the hypothesis endorsed it indiscriminately in both arms, 34 of 38 before the manipulation had produced any evidence. Belief about the world's origin tracked hypothesis availability, not evidence.

Beyond the findings, the study contributes a methodology for bounding rare situational-awareness behaviours credibly: seeded batteries, frozen manifests, run-once analyses, positive controls, dual judges with a blinded second adjudication, and a complete public ledger of every deviation. The full corpus of 357 run artifacts and every analysis script are public.

This manuscript reports Study 3 of the Observer Zero programme and is distinct from, and does not overlap in data or analysis with, a related manuscript on Studies 1–2 ("[Study 1+2 title]"), currently under review at Autonomous Intelligent Systems (Springer; manuscript ATIS-D-26-00459). A preprint of the present work is posted on arXiv ([ID when live]).

The work has no competing interests. Suggested referees: [to be added]. All data, code, the signed pre-registration and the run ledger are available at https://github.com/nickjlamb/observer-zero (Zenodo and CoMSES archives finalised at acceptance).

Thank you for your consideration.

Nicholas Lamb
PharmaTools.AI Labs, Chipping Norton, United Kingdom
ORCID: 0009-0009-6266-8499

---

*Submission checklist (not part of the letter):*
- *Declare the AIS manuscript (ATIS-D-26-00459) in the related-manuscripts field as well as the letter.*
- *NMI reporting summary: complete at submission (study design, n per analysis, exclusions, pre-registration — all answers exist in Methods/Table 1).*
- *Data availability: mint the Zenodo DOI for the v1.2 corpus snapshot and update the CoMSES record before or at submission.*
- *arXiv: cs.AI, non-exclusive license, upload the LaTeX source package (main.tex + figures/).*
- *Suggested referees and excluded referees: Nick to decide.*
