"""Runs reference solutions through the same harness the browser uses.

Reads a JSON list of jobs from stdin:
    [{"id": str, "code": str, "spec": {...}, "tests": [...]}, ...]
and prints a JSON list of results:
    [{"id": str, "compileError": str|None, "results": [RawResult, ...]}, ...]
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "src", "lib", "runner"))

import harness  # noqa: E402

sys.setrecursionlimit(10_000)


def main():
    jobs = json.load(sys.stdin)
    out = []
    for job in jobs:
        prep = json.loads(harness.gym_prepare(job["code"], json.dumps(job["spec"])))
        if prep["error"]:
            out.append({"id": job["id"], "compileError": prep["error"], "results": []})
            continue
        results = [json.loads(harness.gym_run_one(json.dumps(t))) for t in job["tests"]]
        out.append({"id": job["id"], "compileError": None, "results": results})
    json.dump(out, sys.stdout)


if __name__ == "__main__":
    main()
