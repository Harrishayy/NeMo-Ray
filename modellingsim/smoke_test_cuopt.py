"""
Smoke test: start the cuOpt server, solve a toy routing problem, stop it.

Frames a simple "visit all candidate mast sites" as a VRP so we have
something concrete to wire Sionna dead-zone output into later.

Run with:
    uv run --package nemoray-modelling python modellingsim/smoke_test_cuopt.py
"""

import subprocess
import sys
import time

import httpx

SERVER_PORT = 5000
SERVER_URL = f"http://localhost:{SERVER_PORT}"


def wait_for_server(timeout: int = 30) -> bool:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = httpx.get(f"{SERVER_URL}/cuopt/health", timeout=2)
            if r.status_code == 200:
                return True
        except httpx.ConnectError:
            time.sleep(1)
    return False


def poll_solution(req_id: str, timeout: int = 30) -> dict:
    """Poll GET /cuopt/solution/{id} until we get a real solution (not just an id)."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = httpx.get(f"{SERVER_URL}/cuopt/solution/{req_id}", timeout=5)
        r.raise_for_status()
        data = r.json()
        # If still pending, the server echoes back a reqId; a real solution has "response"
        if "response" in data:
            return data
        time.sleep(0.5)
    raise TimeoutError(f"Solution for {req_id} not ready within {timeout}s")


def run_mast_site_survey_vrp() -> dict:
    """
    Toy problem: survey 4 candidate mast sites with 2 vans, starting from depot.

    5 locations total: depot (0) + 4 candidate sites (1-4).
    This stands in for the real problem where Sionna outputs dead-zone patches
    and cuOpt schedules site-survey teams across them.
    """
    cost_matrix = [
        [0,  4,  8, 12,  6],
        [4,  0,  5,  9,  3],
        [8,  5,  0,  4,  6],
        [12, 9,  4,  0,  7],
        [6,  3,  6,  7,  0],
    ]

    payload = {
        "cost_matrix_data": {"data": {"0": cost_matrix}},
        "travel_time_matrix_data": {"data": {"0": cost_matrix}},
        "fleet_data": {
            "vehicle_locations": [[0, 0], [0, 0]],
            "vehicle_ids": ["van-1", "van-2"],
            "vehicle_time_windows": [[0, 100], [0, 100]],
        },
        "task_data": {
            "task_locations": [1, 2, 3, 4],
            "task_ids": ["site-A", "site-B", "site-C", "site-D"],
            "task_time_windows": [[0, 100], [0, 100], [0, 100], [0, 100]],
            "service_times": [1, 1, 1, 1],
        },
        "solver_config": {"time_limit": 5},
    }

    r = httpx.post(f"{SERVER_URL}/cuopt/request", json=payload, timeout=30)
    r.raise_for_status()
    return r.json()


def main() -> None:
    print("Starting cuOpt server …")
    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "cuopt_server.cuopt_service",
            "--port",
            str(SERVER_PORT),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    try:
        if not wait_for_server():
            out, _ = proc.communicate(timeout=5)
            print("Server failed to start. Output:")
            print(out.decode())
            sys.exit(1)

        print(f"Server ready on port {SERVER_PORT}.")
        print("\nSubmitting mast-site survey VRP …")

        submit = run_mast_site_survey_vrp()
        req_id = submit.get("reqId")
        if not req_id:
            raise RuntimeError(f"No reqId in response: {submit}")

        print(f"Request submitted, id={req_id}. Polling for solution …")
        result = poll_solution(req_id)

        sr = result.get("response", {}).get("solver_response", {})
        print(f"\nStatus : {sr.get('status')} (0 = optimal)")
        print(f"Cost   : {sr.get('solution_cost')}")
        print("\nRoutes:")
        for vid, vdata in sr.get("vehicle_data", {}).items():
            sites = vdata.get("task_id", [])
            print(f"  {vid}: {sites}")

        print("\nSmoke test PASSED.")

    finally:
        proc.terminate()
        proc.wait()
        print("Server stopped.")


if __name__ == "__main__":
    main()
