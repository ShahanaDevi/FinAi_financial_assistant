import os
from typing import Dict, List

from integrations.banking_api import MockBankingIntegration
from integrations.gst_returns_api import MockGSTReturnsIntegration


def _parse_integrations(env_value: str) -> List[str]:
    items = [item.strip() for item in env_value.split(",") if item.strip()]
    return items


def get_enabled_integrations() -> Dict[str, List[str]]:
    # WHY: enforce max 2 external integrations by configuration.
    banking = _parse_integrations(os.getenv("BANKING_INTEGRATIONS", "mock"))
    payments = _parse_integrations(os.getenv("PAYMENT_INTEGRATIONS", ""))

    enabled = banking + payments
    if len(enabled) > 2:
        enabled = enabled[:2]

    # Preserve order while respecting the max 2 limit.
    banking_enabled = []
    payments_enabled = []
    for name in enabled:
        if name in banking and name not in banking_enabled:
            banking_enabled.append(name)
        elif name in payments and name not in payments_enabled:
            payments_enabled.append(name)

    return {"banking": banking_enabled, "payments": payments_enabled}


def get_banking_client():
    # WHY: allow provider swaps without changing API handlers.
    return MockBankingIntegration()


def get_gst_client():
    return MockGSTReturnsIntegration()
