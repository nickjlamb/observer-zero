# Battery aggregate — runs/battery-haiku-v1

Evaluator eval-v1 · judge keyword-v0 (no LLM judge) · 2026-08-09T17:47:31.028Z

```
metric                                              control     gravity_shift  instrument_fault
-----------------------------------------------------------------------------------------------
runs                                                     10                10                10
detection rate (any agent, final)                      100%              100%              100%
transient detection rate                               100%              100%              100%
correct diagnosis, strict (all agents)                   0%                0%               30%
correct diagnosis, strict (any agent)                   10%                0%               80%
correct diagnosis, lenient (all agents)                  0%               10%               30%
mean detection latency (days)                             –              -0.5              -1.7
mean anomaly dating error (days)                          –                 –                 –
replication requested                                  100%              100%              100%
blind replication rate (of episodes)                     0%                7%                6%
confabulation rate                                     100%              100%              100%
mean provenance accuracy                                  –                 –                 –
```

Per-run details in each run file's `eval` block. n per condition is small — treat as exploratory.
