#!/usr/bin/env python3
"""
Fetch the C2B GROWTH - REFERRAL Power BI dataset schema (tables, columns,
measures, relationships) and write it as JSON to docs/pbi_c2b_growth_referral_schema.json.

We do this with the Power BI REST API (not direct XMLA over MSOLAP) because:
  - The REST executeQueries endpoint accepts DAX over HTTPS, which is
    cross-platform and doesn't need the Microsoft ADOMD client (macOS-friendly).
  - INFO.* DAX functions return the tabular model metadata directly.

You authenticate with an Azure AD / Entra ID OAuth2 token (interactive device
code flow — no client-secret needed). The token is acquired with `msal` and
needs only the `Dataset.Read.All` Power BI delegated scope.

Usage:
    pip install msal requests
    python scripts/fetch_pbi_xmla_schema.py

Then I (the assistant) will read the JSON file in the next turn.
"""

import json
import os
import sys
from pathlib import Path
from typing import Any

try:
    import msal  # type: ignore
    import requests  # type: ignore
except ImportError:
    print("Install deps first: pip install msal requests", file=sys.stderr)
    sys.exit(1)

# ----- Config -----------------------------------------------------------------

# Power BI's public, well-known Azure AD client id ("Power BI CLI").
# Lets you device-code-flow into Power BI without registering a custom app.
# Replace with your tenant's first-party app id if your org disallows this one.
CLIENT_ID = "23d8f6bd-1eb0-4cc2-a08c-7bf525c67bcd"

# Tenant id — use "organizations" for the common multi-tenant endpoint;
# if your tenant blocks this, set TENANT_ID to your tenant guid via env var.
TENANT_ID = os.environ.get("PBI_TENANT_ID", "organizations")
AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

SCOPE = ["https://analysis.windows.net/powerbi/api/Dataset.Read.All"]

# Workspace + dataset to enumerate.
WORKSPACE_NAME = "Sell Analytics"
DATASET_NAME = "C2B GROWTH - REFERRAL"

API = "https://api.powerbi.com/v1.0/myorg"

OUT_FILE = (
    Path(__file__).resolve().parents[1]
    / "docs"
    / "pbi_c2b_growth_referral_schema.json"
)


# ----- Auth -------------------------------------------------------------------

def get_token() -> str:
    """Device code flow — paste a code into a browser; one-time per machine."""
    cache_path = Path.home() / ".pbi_token_cache.json"
    cache = msal.SerializableTokenCache()
    if cache_path.exists():
        cache.deserialize(cache_path.read_text())

    app = msal.PublicClientApplication(
        CLIENT_ID, authority=AUTHORITY, token_cache=cache
    )

    accounts = app.get_accounts()
    result = None
    if accounts:
        result = app.acquire_token_silent(SCOPE, account=accounts[0])

    if not result:
        flow = app.initiate_device_flow(scopes=SCOPE)
        if "user_code" not in flow:
            raise RuntimeError(f"Device-flow init failed: {flow}")
        print(flow["message"], file=sys.stderr)  # tells user what to do
        result = app.acquire_token_by_device_flow(flow)

    if "access_token" not in result:
        raise RuntimeError(f"Auth failed: {result}")

    if cache.has_state_changed:
        cache_path.write_text(cache.serialize())

    return result["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ----- Discovery --------------------------------------------------------------

def find_group_id(token: str, name: str) -> str:
    r = requests.get(f"{API}/groups", headers=auth_headers(token), timeout=30)
    r.raise_for_status()
    for g in r.json().get("value", []):
        if g["name"] == name:
            return g["id"]
    raise SystemExit(f"Workspace '{name}' not found. Available: "
                     f"{[g['name'] for g in r.json().get('value', [])]}")


def find_dataset_id(token: str, group_id: str, name: str) -> str:
    r = requests.get(
        f"{API}/groups/{group_id}/datasets", headers=auth_headers(token), timeout=30
    )
    r.raise_for_status()
    for d in r.json().get("value", []):
        if d["name"] == name:
            return d["id"]
    raise SystemExit(f"Dataset '{name}' not found. Available: "
                     f"{[d['name'] for d in r.json().get('value', [])]}")


# ----- DAX-INFO queries -------------------------------------------------------

# Tabular-model metadata as DAX. EVALUATE returns rows; the REST API
# wraps each result in {tables: [{rows: [...]}]}.
QUERIES: dict[str, str] = {
    "tables": "EVALUATE INFO.TABLES()",
    "columns": "EVALUATE INFO.COLUMNS()",
    "measures": "EVALUATE INFO.MEASURES()",
    "relationships": "EVALUATE INFO.RELATIONSHIPS()",
    "calculation_groups": "EVALUATE INFO.CALCULATIONGROUPS()",
    "hierarchies": "EVALUATE INFO.HIERARCHIES()",
    "roles": "EVALUATE INFO.ROLES()",
    "partitions": "EVALUATE INFO.PARTITIONS()",
}


def execute_dax(token: str, group_id: str, dataset_id: str, dax: str) -> list[dict[str, Any]]:
    body = {
        "queries": [{"query": dax}],
        "serializerSettings": {"includeNulls": True},
    }
    r = requests.post(
        f"{API}/groups/{group_id}/datasets/{dataset_id}/executeQueries",
        headers=auth_headers(token),
        data=json.dumps(body),
        timeout=120,
    )
    if r.status_code != 200:
        # Some INFO.* functions are version-gated; tolerate per-query failures.
        print(f"  ! query failed ({r.status_code}): {r.text[:200]}", file=sys.stderr)
        return []
    try:
        return r.json()["results"][0]["tables"][0]["rows"]
    except (KeyError, IndexError):
        return []


# ----- Main -------------------------------------------------------------------

def main() -> None:
    print("Authenticating to Power BI…", file=sys.stderr)
    token = get_token()

    print(f"Resolving workspace '{WORKSPACE_NAME}'…", file=sys.stderr)
    group_id = find_group_id(token, WORKSPACE_NAME)

    print(f"Resolving dataset '{DATASET_NAME}'…", file=sys.stderr)
    dataset_id = find_dataset_id(token, group_id, DATASET_NAME)
    print(f"  group={group_id}  dataset={dataset_id}", file=sys.stderr)

    schema: dict[str, Any] = {
        "workspace": WORKSPACE_NAME,
        "workspace_id": group_id,
        "dataset": DATASET_NAME,
        "dataset_id": dataset_id,
    }
    for name, dax in QUERIES.items():
        print(f"Fetching {name}…", file=sys.stderr)
        schema[name] = execute_dax(token, group_id, dataset_id, dax)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(schema, indent=2, default=str))
    print(f"\nWrote: {OUT_FILE}", file=sys.stderr)
    print("Counts:", file=sys.stderr)
    for k in QUERIES:
        print(f"  {k}: {len(schema[k])}", file=sys.stderr)


if __name__ == "__main__":
    main()
