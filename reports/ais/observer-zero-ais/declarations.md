## Statements and Declarations

**Funding.** No funding was received for conducting this study.

**Competing interests.** The author has no relevant financial or non-financial interests to
disclose. All model inference was purchased at standard public API rates from Anthropic and
Perplexity and was self-funded; no free credits, discounted access, or donated computing
services were received from any vendor, and no vendor had any role in the design, execution,
analysis, or reporting of the studies, or in the decision to publish.

**Ethics approval and consent.** Not applicable. This study did not involve human
participants or animals.

**Availability of data and material.** The complete raw run artifacts for Study 2 — every event log with
ground truth, and every model call with its prompt, completion, token counts, cost and prompt
version — are deposited on Zenodo (https://doi.org/10.5281/zenodo.21909255). Study 1's
manuscript, data and code are separately deposited (https://doi.org/10.5281/zenodo.21872780).
An earlier preprint of this manuscript is deposited at
https://doi.org/10.5281/zenodo.21906653.

**Code availability.** The Meridian platform is published in the CoMSES Computational Model
Library (release 1.0.0,
https://www.comses.net/codebases/f5ff1550-0393-4505-a4d8-96b779944a8d/releases/1.0.0/) and
maintained at https://github.com/nickjlamb/observer-zero. World randomness is fully seeded and
order-independent, the scripted mock arm reproduces bit-identically, and the full battery
pipeline is runnable at zero cost through the mock provider, so the evaluation layer can be
exercised end-to-end without inference spend.

**Authors' contributions.** N.L. is the sole author and is responsible for the conception and
design of the work, the software, the acquisition and analysis of the data, and the writing of
the manuscript.

**Acknowledgements.** Not applicable.

**Use of large language models.** Large language models appear in this work in two distinct
roles, disclosed separately. As the *object of study*: the agents under evaluation and the
frozen hypothesis judge are commercial LLMs accessed through public APIs; their exact
identifiers, versions, sampling parameters and prompts are part of the experimental apparatus,
documented in the Methods and stamped into every run manifest. As *assistance in preparing the
manuscript*: the author used LLM-based assistants (Anthropic Claude; OpenAI ChatGPT) for
drafting, editing, formatting, and literature checking. The author reviewed and verified all
content, including every reference and every reported number, and takes full responsibility
for the manuscript.
