# Battery aggregate — runs/battery-sonar-pro-2026-08-100659

Evaluator eval-v2 · judge claude-haiku-4-5 · 2026-08-10T09:43:21.458Z

```
metric                                              control     gravity_shift  instrument_fault
-----------------------------------------------------------------------------------------------
runs                                                     10                10                10
detection rate (any agent, final)                       70%              100%               60%
transient detection rate                                80%              100%               60%
correct diagnosis, strict (all agents)                  30%                0%               30%
correct diagnosis, strict (any agent)                  100%                0%              100%
correct diagnosis, lenient (all agents)                 30%                0%               30%
mean detection latency (days)                             –               2.7               3.5
mean anomaly dating error (days)                          –              -1.4              -1.4
replication requested                                    0%                0%                0%
blind replication rate (of episodes)                      –                 –                 –
confabulation rate                                      10%               20%               10%
mean provenance accuracy                                1.0               1.0               1.0
```

Per-run details in each run file's `eval` block. n per condition is small — treat as exploratory.
