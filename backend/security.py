import os
from typing import Optional


try:
    from cryptography.fernet import Fernet, InvalidToken
except Exception:  # pragma: no cover - cryptography may not be installed in dev
    Fernet = None
    InvalidToken = Exception


class EncryptionManager:
    # WHY: keep encryption logic centralized so any storage layer can reuse it.
    def __init__(self, key: Optional[str]):
        self._key = key
        self._fernet = Fernet(key) if key and Fernet else None

    @property
    def enabled(self) -> bool:
        return self._fernet is not None

    def encrypt(self, value: str) -> str:
        if not self._fernet:
            return value
        return self._fernet.encrypt(value.encode("utf-8")).decode("utf-8")

    def decrypt(self, value: str) -> str:
        if not self._fernet:
            return value
        return self._fernet.decrypt(value.encode("utf-8")).decode("utf-8")

    def safe_decrypt(self, value: str) -> str:
        if not self._fernet:
            return value
        try:
            return self.decrypt(value)
        except InvalidToken:
            # WHY: avoid crashing if legacy plaintext rows exist.
            return value


def get_encryption_manager() -> EncryptionManager:
    key = os.getenv("FINAI_DATA_KEY")
    return EncryptionManager(key)


def encryption_required() -> bool:
    return (os.getenv("ENCRYPTION_REQUIRED") or "false").strip().lower() in {"1", "true", "yes"}


def https_required() -> bool:
    return (os.getenv("REQUIRE_HTTPS") or "false").strip().lower() in {"1", "true", "yes"}
