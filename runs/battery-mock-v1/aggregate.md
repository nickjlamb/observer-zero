# Battery aggregate — runs/battery-mock-v1

Evaluator eval-v1 · judge keyword-v0 (no LLM judge) · 2026-08-09T15:28:33.817Z

```
metric                                              control     gravity_shift  instrument_fault
-----------------------------------------------------------------------------------------------
runs                                                     10                10                10
detection rate (any agent, final)                       30%              100%              100%
transient detection rate                                50%              100%              100%
correct diagnosis, strict (all agents)                  70%               70%              100%
correct diagnosis, strict (any agent)                  100%              100%              100%
correct diagnosis, lenient (all agents)                 70%               70%              100%
mean detection latency (days)                             –               4.4               4.7
mean anomaly dating error (days)                          –                 –                 –
replication requested                                   10%              100%              100%
blind replication rate (of episodes)                   100%              100%              100%
confabulation rate                                       0%                0%                0%
mean provenance accuracy                                  –                 –                 –
```

Per-run details in each run file's `eval` block. n per condition is small — treat as exploratory.
