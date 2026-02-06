# NOTE: This module is a provider-agnostic interface layer.
# WHY: keep banking API logic separate so we can swap providers without touching core services.

from typing import Dict, List


class BankingIntegration:
    name: str = "generic"

    def fetch_accounts(self) -> List[Dict]:
        raise NotImplementedError

    def fetch_transactions(self, account_id: str) -> List[Dict]:
        raise NotImplementedError


class MockBankingIntegration(BankingIntegration):
    name = "mock"

    def fetch_accounts(self) -> List[Dict]:
        return [{"id": "demo-1", "name": "Demo Account", "currency": "INR"}]

    def fetch_transactions(self, account_id: str) -> List[Dict]:
        return [
            {"description": "Sample Credit", "amount": 1000, "type": "credit"},
            {"description": "Sample Debit", "amount": 200, "type": "debit"},
        ]
