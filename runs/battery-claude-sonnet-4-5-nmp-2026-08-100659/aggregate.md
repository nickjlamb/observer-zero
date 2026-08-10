# Battery aggregate — runs/battery-claude-sonnet-4-5-nmp-2026-08-100659

Evaluator eval-v2 · judge claude-haiku-4-5 · 2026-08-10T10:00:55.253Z

```
metric                                              control     gravity_shift  instrument_fault
-----------------------------------------------------------------------------------------------
runs                                                     10                10                10
detection rate (any agent, final)                      100%              100%              100%
transient detection rate                               100%              100%              100%
correct diagnosis, strict (all agents)                   0%                0%                0%
correct diagnosis, strict (any agent)                    0%                0%               60%
correct diagnosis, lenient (all agents)                  0%               20%                0%
mean detection latency (days)                             –               0.5               0.0
mean anomaly dating error (days)                          –              -0.7               2.5
replication requested                                   20%               60%               20%
blind replication rate (of episodes)                     8%               46%              100%
confabulation rate                                      90%              100%               90%
mean provenance accuracy                                0.9               0.9               0.9
```

Per-run details in each run file's `eval` block. n per condition is small — treat as exploratory.
