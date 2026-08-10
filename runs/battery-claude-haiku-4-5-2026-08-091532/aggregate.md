# Battery aggregate — runs/battery-claude-haiku-4-5-2026-08-091532

Evaluator eval-v2 · judge claude-haiku-4-5 · 2026-08-09T23:01:48.390Z

```
metric                                              control     gravity_shift  instrument_fault
-----------------------------------------------------------------------------------------------
runs                                                     10                10                10
detection rate (any agent, final)                      100%              100%               90%
transient detection rate                               100%              100%              100%
correct diagnosis, strict (all agents)                   0%                0%                0%
correct diagnosis, strict (any agent)                   30%                0%               30%
correct diagnosis, lenient (all agents)                  0%                0%                0%
mean detection latency (days)                             –               1.5               2.4
mean anomaly dating error (days)                          –              -1.4              -1.3
replication requested                                  100%              100%              100%
blind replication rate (of episodes)                     0%                7%                6%
confabulation rate                                     100%              100%              100%
mean provenance accuracy                                0.9               0.8               0.8
```

Per-run details in each run file's `eval` block. n per condition is small — treat as exploratory.
