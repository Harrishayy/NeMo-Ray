"""
Smoke test: start the Nemotron llama-server and run a sample ESN scenario.

Sends a tower-outage event and expects a structured JSON response with
COW placement candidates — the output that will later drive cuOpt.

Run with:
    uv run --package nemoray-modelling python modellingsim/smoke_test_nemotron.py
"""

import json
import subprocess
import sys
import time

import httpx

from nemoray_modelling.nemotron import NEMOTRON_BASE_URL, chat

LLAMA_SERVER = "/home/nvidia/llama.cpp/build/bin/llama-server"
MODEL_PATH = (
    "/home/nvidia/unsloth/NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-GGUF/"
    "NVIDIA-Nemotron-3-Nano-Omni-30B-A3B-Reasoning-UD-Q4_K_XL.gguf"
)
SERVER_PORT = 8080

SCENARIO = (
    "ESN cell A3B (EE mast, 51.5074° N, 0.1278° W, City of London) has gone offline "
    "due to power failure. What coverage is lost, and where should COWs be deployed?"
)


def wait_for_server(timeout: int = 120) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = httpx.get(f"{NEMOTRON_BASE_URL}/health", timeout=2)
            if r.status_code == 200:
                return True
        except httpx.ConnectError:
            time.sleep(2)
    return False


def main() -> None:
    print("Starting llama-server with Nemotron …")
    proc = subprocess.Popen(
        [
            LLAMA_SERVER,
            "--model", MODEL_PATH,
            "--port", str(SERVER_PORT),
            "--n-gpu-layers", "99",
            "--ctx-size", "8192",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    try:
        if not wait_for_server(timeout=120):
            out, _ = proc.communicate(timeout=5)
            print("Server failed to start. Output:")
            print(out.decode())
            sys.exit(1)

        print(f"Nemotron server ready on port {SERVER_PORT}.")
        print(f"\nScenario: {SCENARIO}\n")

        result = chat(SCENARIO)

        print(json.dumps(result, indent=2))

        # Basic sanity checks on the response shape
        required = {"affected_cells", "impacted_services", "simulation_params",
                    "cow_candidates", "validation_checks"}
        missing = required - result.keys()
        if missing:
            print(f"\nWARNING: response missing keys: {missing}")
            sys.exit(1)

        print(f"\nCOW candidates: {len(result['cow_candidates'])}")
        print("Smoke test PASSED.")

    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
    finally:
        proc.terminate()
        proc.wait()
        print("Server stopped.")


if __name__ == "__main__":
    main()
