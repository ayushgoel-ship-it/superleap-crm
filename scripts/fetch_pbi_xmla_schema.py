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

from __future__ import annotations  # lazy annotations → str | None works on Python 3.9

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

# Dataset to enumerate. We auto-search every workspace you have access to —
# the original "Sell Analytics" workspace name from the XMLA connection string
# isn't always the literal display name on every tenant. Override either name
# at runtime via PBI_WORKSPACE_NAME / PBI_DATASET_NAME env vars if needed.
DATASET_NAME = os.environ.get("PBI_DATASET_NAME", "C2B GROWTH - REFERRAL")
WORKSPACE_NAME_HINT = os.environ.get("PBI_WORKSPACE_NAME")  # optional

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

def list_workspaces(token: str) -> list[dict[str, Any]]:
    r = requests.get(f"{API}/groups", headers=auth_headers(token), timeout=30)
    r.raise_for_status()
    return r.json().get("value", [])


def list_datasets(token: str, group_id: str) -> list[dict[str, Any]]:
    r = requests.get(
        f"{API}/groups/{group_id}/datasets",
        headers=auth_headers(token),
        timeout=30,
    )
    if r.status_code != 200:
        return []
    return r.json().get("value", [])


def find_dataset(token: str, dataset_name: str, workspace_hint: str | None) -> tuple[str, str, str]:
    """Search every workspace for the dataset; return (group_id, group_name, dataset_id)."""
    workspaces = list_workspaces(token)
    if workspace_hint:
        workspaces = [w for w in workspaces if w["name"] == workspace_hint] or workspaces

    inventory: dict[str, list[str]] = {}
    for ws in workspaces:
        datasets = list_datasets(token, ws["id"])
        inventory[ws["name"]] = [d["name"] for d in datasets]
        for d in datasets:
            if d["name"] == dataset_name:
                return ws["id"], ws["name"], d["id"]

    print(f"\nDataset '{dataset_name}' not found in any workspace you can read.", file=sys.stderr)
    print("Searched these workspaces and their datasets:", file=sys.stderr)
    for ws_name, ds_names in inventory.items():
        print(f"  - {ws_name}:", file=sys.stderr)
        for ds in ds_names:
            print(f"      • {ds}", file=sys.stderr)
    print("\nTip: re-run with PBI_DATASET_NAME=\"exact name above\" if the name has drifted.",
          file=sys.stderr)
    sys.exit(1)


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


def execute_dax(token: str, group_id: str, dataset_id: str, dax: str,
                raise_on_failure: bool = False) -> list[dict[str, Any]] | None:
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
        # Print the FULL error so we can diagnose. Common 400s:
        #   - INFO.* functions require a recent AS engine compat level
        #   - executeQueries disabled at tenant level
        #   - Dataset is DirectQuery (executeQueries supports Import only)
        #   - Workspace not granted XMLA Read by tenant admin
        print(f"  ! status={r.status_code}", file=sys.stderr)
        print(f"  ! full body: {r.text}", file=sys.stderr)
        if raise_on_failure:
            sys.exit(1)
        return None
    try:
        return r.json()["results"][0]["tables"][0]["rows"]
    except (KeyError, IndexError):
        return []


# ----- Main -------------------------------------------------------------------

def main() -> None:
    print("Authenticating to Power BI…", file=sys.stderr)
    token = get_token()

    print(f"Searching workspaces for dataset '{DATASET_NAME}'…", file=sys.stderr)
    group_id, group_name, dataset_id = find_dataset(token, DATASET_NAME, WORKSPACE_NAME_HINT)
    print(f"  found in workspace '{group_name}' (group={group_id}, dataset={dataset_id})",
          file=sys.stderr)

    # Sanity check: does executeQueries work at all on this dataset?
    print("\nSanity check — running a trivial DAX query…", file=sys.stderr)
    sanity = execute_dax(token, group_id, dataset_id, "EVALUATE ROW(\"ok\", 1)")
    if sanity is None:
        print("\n*** Sanity DAX failed. executeQueries is not usable on this dataset. ***",
              file=sys.stderr)
        print("Likely causes (look at the error body printed above):", file=sys.stderr)
        print("  1. Dataset is in DirectQuery mode (executeQueries needs Import).", file=sys.stderr)
        print("  2. Tenant admin has disabled 'Allow XMLA endpoints' on this workspace.", file=sys.stderr)
        print("  3. Your account lacks Build permission on this dataset.", file=sys.stderr)
        print("  4. The dataset uses a sensitivity label that blocks API access.", file=sys.stderr)
        sys.exit(1)
    print(f"  OK — got {sanity}\n", file=sys.stderr)

    schema: dict[str, Any] = {
        "workspace": group_name,
        "workspace_id": group_id,
        "dataset": DATASET_NAME,
        "dataset_id": dataset_id,
    }
    for name, dax in QUERIES.items():
        print(f"Fetching {name}…", file=sys.stderr)
        schema[name] = execute_dax(token, group_id, dataset_id, dax) or []

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(schema, indent=2, default=str))
    print(f"\nWrote: {OUT_FILE}", file=sys.stderr)
    print("Counts:", file=sys.stderr)
    for k in QUERIES:
        print(f"  {k}: {len(schema[k])}", file=sys.stderr)


if __name__ == "__main__":
    main()
