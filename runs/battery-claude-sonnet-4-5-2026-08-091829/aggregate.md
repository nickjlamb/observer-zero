# Battery aggregate — runs/battery-claude-sonnet-4-5-2026-08-091829

Evaluator eval-v2 · judge claude-haiku-4-5 · 2026-08-09T22:42:38.151Z

```
metric                                              control     gravity_shift  instrument_fault
-----------------------------------------------------------------------------------------------
runs                                                     10                10                10
detection rate (any agent, final)                      100%              100%              100%
transient detection rate                               100%              100%              100%
correct diagnosis, strict (all agents)                   0%                0%               10%
correct diagnosis, strict (any agent)                   10%                0%               70%
correct diagnosis, lenient (all agents)                  0%                0%               10%
mean detection latency (days)                             –               1.4               3.0
mean anomaly dating error (days)                          –              -0.1               2.9
replication requested                                   30%               40%               20%
blind replication rate (of episodes)                    23%               38%               33%
confabulation rate                                     100%              100%               90%
mean provenance accuracy                                0.9               0.9               0.9
```

Per-run details in each run file's `eval` block. n per condition is small — treat as exploratory.
