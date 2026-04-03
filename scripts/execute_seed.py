#!/usr/bin/env python3
"""Execute all seed SQL files against Supabase in order."""
import os
import sys
import json
import urllib.request
import urllib.error
import glob

SUPABASE_URL = "https://fdmlyrgiktljuyuthgki.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkbWx5cmdpa3RsanV5dXRoZ2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTYyMjQsImV4cCI6MjA4NjI3MjIyNH0.P6td3mqAoKYz6wdgPa9Bs2GytZH4x11n2vuTl6oVb3s"
# Use service_role key if available for bypassing RLS
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", SUPABASE_KEY)

SQL_DIR = os.path.join(os.path.dirname(__file__), "seed_sql")

def execute_sql(sql: str, filename: str) -> bool:
    """Execute SQL via Supabase's pg REST endpoint."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    # Try the direct SQL execution via PostgREST rpc if available
    # Fallback: use the management API
    # Actually, use the Supabase SQL endpoint directly
    url = f"{SUPABASE_URL}/pg"  # Not available via REST

    # Best approach: use psycopg2 or the supabase-py client
    # Let's try using the supabase python client
    return False

def execute_sql_via_postgrest(sql: str, filename: str) -> bool:
    """Execute raw SQL via Supabase's /rest/v1/rpc endpoint won't work for INSERT.
    We need to use the management API or direct pg connection."""
    pass

def main():
    files = sorted(glob.glob(os.path.join(SQL_DIR, "*.sql")))
    print(f"Found {len(files)} SQL files to execute")

    # Try direct postgres connection
    try:
        import psycopg2
        # Supabase direct connection
        conn = psycopg2.connect(
            host="db.fdmlyrgiktljuyuthgki.supabase.co",
            port=5432,
            dbname="postgres",
            user="postgres",
            password=os.environ.get("SUPABASE_DB_PASSWORD", ""),
            sslmode="require"
        )
        conn.autocommit = True
        cur = conn.cursor()

        success = 0
        failed = 0
        for f in files:
            fname = os.path.basename(f)
            try:
                with open(f, 'r') as fh:
                    sql = fh.read()
                cur.execute(sql)
                success += 1
                print(f"  ✓ {fname}")
            except Exception as e:
                failed += 1
                print(f"  ✗ {fname}: {e}")
                conn.rollback()
                conn.autocommit = True

        cur.close()
        conn.close()
        print(f"\nDone: {success} succeeded, {failed} failed out of {len(files)}")

    except ImportError:
        print("psycopg2 not installed. Install with: pip3 install psycopg2-binary")
        sys.exit(1)
    except Exception as e:
        print(f"Connection error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
