import base64

from cryptography.fernet import Fernet

from app.config import settings
from app.logging import get_logger

logger = get_logger(__name__)

_fernet_instance: Fernet | None = None


def get_encryption_key() -> bytes:
    key = settings.encryption_key
    if key:
        try:
            return base64.urlsafe_b64decode(key.encode())
        except Exception:
            pass

    generated_key = Fernet.generate_key()
    logger.warning(
        "encryption_key_not_set",
        message=(
            "Generated temporary encryption key. "
            "Set ENCRYPTION_KEY env var for persistent decryption."
        ),
    )
    return generated_key


def get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = get_encryption_key()
        _fernet_instance = Fernet(base64.urlsafe_b64encode(key))
    return _fernet_instance


def encrypt_api_key(api_key: str) -> str:
    if not api_key:
        raise ValueError("API key cannot be empty")
    fernet = get_fernet()
    encrypted = fernet.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str) -> str:
    if not encrypted_key:
        raise ValueError("Encrypted key cannot be empty")
    fernet = get_fernet()
    decrypted = fernet.decrypt(encrypted_key.encode())
    return decrypted.decode()


def generate_encryption_key() -> str:
    return Fernet.generate_key().decode()
