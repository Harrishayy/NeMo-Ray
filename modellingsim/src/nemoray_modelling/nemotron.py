"""
Nemotron orchestration client.

Wraps the llama.cpp server (OpenAI-compatible API) serving the
Nemotron-3-Nano-Omni-30B-A3B-Reasoning model locally on the DGX Spark.

Start the server before using this module:

    /home/nvidia/llama.cpp/build/bin/llama-server \\
        --model /home/nvidia/unsloth/NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-GGUF/NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-UD-Q4_K_XL.gguf \\
        --port 8080 \\
        --n-gpu-layers 99 \\
        --ctx-size 8192
"""

import json
from typing import Any

import httpx

NEMOTRON_BASE_URL = "http://localhost:8080"

# System prompt primes Nemotron as the ESN resilience orchestrator.
# Its job: translate a plain-English network event into structured parameters
# that drive the Sionna RT sim and cuOpt COW-placement loop.
_SYSTEM_PROMPT = """\
You are the ESN (UK Emergency Services Network) resilience orchestrator for NeMo-Ray.

When given a network event (e.g. a tower outage, degraded signal, or planned maintenance),
analyse it and reply with ONLY a JSON object — no prose, no markdown fences.

The JSON must have exactly these keys and types:

{
  "affected_cells": ["<cell-id>", ...],
  "impacted_services": ["police" | "fire" | "ambulance", ...],
  "simulation_params": {
    "disabled_cells": ["<cell-id>", ...],
    "area_bbox": [min_lat, min_lon, max_lat, max_lon],
    "notes": "<any extra sim context>"
  },
  "cow_candidates": [
    {"location": "<human-readable address or coords>", "rationale": "<why here>", "priority": 1}
  ],
  "validation_checks": [
    {"site": "<location>", "checks": ["<LiDAR/terrain check>", ...]}
  ]
}
"""


def _strip_fences(text: str) -> str:
    """Remove ```json … ``` fences that reasoning models sometimes emit."""
    s = text.strip()
    if not s.startswith("```"):
        return s
    lines = s.splitlines()
    end = -1 if lines[-1].strip() == "```" else len(lines)
    return "\n".join(lines[1:end])


def chat(
    event: str,
    *,
    base_url: str = NEMOTRON_BASE_URL,
    temperature: float = 0.2,
    max_tokens: int = 2048,
    timeout: float = 120.0,
) -> dict[str, Any]:
    """
    Describe a network event in plain English; get back a structured dict.

    The returned dict has keys: affected_cells, impacted_services,
    simulation_params, cow_candidates, validation_checks.
    """
    payload = {
        "model": "nemotron",
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": event},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    with httpx.Client(base_url=base_url, timeout=timeout) as client:
        r = client.post("/v1/chat/completions", json=payload)
        r.raise_for_status()

    content = r.json()["choices"][0]["message"]["content"]
    return json.loads(_strip_fences(content))
