from typing import Dict


class GSTReturnsIntegration:
    name: str = "gst_returns"

    def submit_gstr1(self, payload: Dict) -> Dict:
        raise NotImplementedError

    def submit_gstr3b(self, payload: Dict) -> Dict:
        raise NotImplementedError


class MockGSTReturnsIntegration(GSTReturnsIntegration):
    name = "mock"

    def submit_gstr1(self, payload: Dict) -> Dict:
        return {"status": "queued", "reference_id": "GSTR1-DEMO"}

    def submit_gstr3b(self, payload: Dict) -> Dict:
        return {"status": "queued", "reference_id": "GSTR3B-DEMO"}
