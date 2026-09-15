# Agent Guidelines & Standing Instructions

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at: `backend/app/config.py`, `backend/app/tracing/prism.py`, `backend/app/ai/provider.py`, `backend/app/ai/recommender.py`, `backend/app/schemas/recommendation.py`, `backend/requirements.txt`, `backend/.env.example`

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it.
