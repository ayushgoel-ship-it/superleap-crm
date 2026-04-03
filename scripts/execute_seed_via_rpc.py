#!/usr/bin/env python3
"""Execute seed SQL files via Supabase PostgREST RPC (exec_raw_sql function)."""
import os
import sys
import json
import glob
import urllib.request
import urllib.error

SUPABASE_URL = "https://fdmlyrgiktljuyuthgki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWx5cmdpa3RsanV5dXRoZ2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTYyMjQsImV4cCI6MjA4NjI3MjIyNH0.P6td3mqAoKYz6wdgPa9Bs2GytZH4x11n2vuTl6oVb3s"

SQL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_sql")

def execute_sql_via_rpc(sql_text: str) -> bool:
    """Execute SQL via the exec_raw_sql RPC function."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_raw_sql"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    body = json.dumps({"sql_text": sql_text}).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status in (200, 204)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"    HTTP {e.code}: {error_body[:200]}")
        return False
    except Exception as e:
        print(f"    Error: {e}")
        return False

def main():
    # Get optional prefix filter from args
    prefix_filter = sys.argv[1] if len(sys.argv) > 1 else None

    files = sorted(glob.glob(os.path.join(SQL_DIR, "*.sql")))
    if prefix_filter:
        files = [f for f in files if os.path.basename(f).startswith(prefix_filter)]

    print(f"Found {len(files)} SQL files to execute")

    success = 0
    failed = 0
    failed_files = []

    for i, filepath in enumerate(files):
        fname = os.path.basename(filepath)
        with open(filepath, "r") as fh:
            sql = fh.read()

        print(f"  [{i+1}/{len(files)}] {fname} ({len(sql)} bytes)...", end=" ", flush=True)

        if execute_sql_via_rpc(sql):
            success += 1
            print("OK")
        else:
            failed += 1
            failed_files.append(fname)
            print("FAILED")

    print(f"\nDone: {success} succeeded, {failed} failed out of {len(files)}")
    if failed_files:
        print(f"Failed files: {', '.join(failed_files)}")

    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
