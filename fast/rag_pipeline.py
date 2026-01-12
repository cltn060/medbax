"""
RAG Pipeline - supports multi-collection queries with conversation history.
"""

from pathlib import Path
from dotenv import load_dotenv
from typing import Optional

# Load .env from parent directory
load_dotenv(Path(__file__).parent.parent / ".env.local")

from openai import OpenAI
from retriever import retrieve_context
from prompt import SYSTEM_PROMPT, build_prompt
from config import CHAT_MODEL

client = OpenAI()


def answer_question(
    question: str, 
    collection_id: str, 
    stream: bool = True,
    conversation_history: Optional[list] = None
) -> tuple:
    """
    Answer a question using RAG from a specific collection.
    
    Args:
        question: The user's question
        collection_id: Which knowledge base to query
        stream: Whether to stream the response
        conversation_history: Optional list of previous messages [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        Tuple of (response, sources):
        - response: OpenAI response (generator if stream=True, else completion object)
        - sources: List of structured source metadata dicts
    """
    context, sources = retrieve_context(question, collection_id=collection_id)
    
    if not context:
        context = "[No documents have been uploaded to this knowledge base yet.]"
    
    prompt = build_prompt(context, question)
    
    # Build messages array with conversation history
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Add conversation history if provided (last 10 messages)
    if conversation_history:
        for msg in conversation_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
    
    # Add the current question with context
    messages.append({"role": "user", "content": prompt})
    
    response = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        temperature=0.3,
        stream=stream
    )
    
    return response, sources


def answer_question_sync(question: str, collection_id: str, conversation_history: Optional[list] = None) -> tuple[str, list]:
    """
    Answer a question (non-streaming) and return the text with sources.
    
    Returns:
        Tuple of (answer_text, sources_list)
    """
    response, sources = answer_question(question, collection_id=collection_id, stream=False, conversation_history=conversation_history)
    return response.choices[0].message.content, sources

