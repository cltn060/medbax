"""
Embedding utilities - mirrors your original embeddings.py
"""

from pathlib import Path
from dotenv import load_dotenv
 
# Load .env from parent directory
load_dotenv(Path(__file__).parent.parent / ".env")

from openai import OpenAI
from config import EMBEDDING_MODEL

client = OpenAI()


def embed_text(text: str) -> list[float]:
    """Generate embedding for a single text string."""
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )
    return response.data[0].embedding


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for multiple texts (batch)."""
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]
