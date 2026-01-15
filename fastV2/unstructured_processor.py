"""
Advanced PDF processor using unstructured.io with async image/table summarization.
Handles medical documents with images, tables, and complex layouts.
"""

import asyncio
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

from unstructured.partition.pdf import partition_pdf
from openai import AsyncOpenAI, OpenAI
import os

# Initialize OpenAI clients
client = OpenAI()
async_client = AsyncOpenAI()


@dataclass
class NormalizedBlock:
    """Represents a processed document block (text, image summary, or table summary)."""
    text: str
    block_type: str  # "text" | "image_summary" | "table_summary"
    metadata: Dict[str, Any]


# ============================================================================
# Enhanced Medical Prompts
# ============================================================================

IMAGE_SUMMARY_PROMPT = """You are a medical AI assistant analyzing clinical document images.

TASK: Describe this image for semantic search in a medical knowledge base.

FOCUS ON:
- Anatomical diagrams: Label all structures, orientations (anterior/posterior, etc.)
- Charts/graphs: Exact values, axes labels, trends, comparisons
- Clinical photos: Observable features, abnormalities, measurements
- Medical equipment: Device names, settings, readings
- Flow charts: Process steps, decision points, outcomes

MEDICAL TERMINOLOGY:
- Use precise medical terms (e.g., "myocardial infarction" not "heart attack")
- Include abbreviations if visible (e.g., "BP", "HR", "ECG")
- Mention units of measurement

FORMAT:
Start with image type (e.g., "Anatomical diagram of...", "Lab results chart showing...")
Be concise but complete - aim for 3-5 sentences.

Describe the image:"""

TABLE_SUMMARY_PROMPT = """You are a medical AI assistant analyzing clinical data tables.

TASK: Summarize this table for semantic search in a medical knowledge base.

CRITICAL INFORMATION TO EXTRACT:
- Table title/purpose
- Column headers and their meanings
- Row labels (patient groups, time points, conditions, etc.)
- Key numerical values (ranges, means, p-values, doses, etc.)
- Units of measurement
- Notable trends, comparisons, or outliers
- Statistical significance markers

MEDICAL CONTEXT:
- Lab results: Normal ranges, abnormal values
- Drug dosages: Amounts, frequencies, routes of administration
- Patient demographics: Age groups, conditions, sample sizes
- Clinical outcomes: Response rates, adverse events, efficacy measures

FORMAT:
1. First sentence: What the table shows (e.g., "Comparison of treatment outcomes...")
2. Key findings: Most important data points with values
3. Structure: Number of rows/columns if relevant

Be precise with numbers and medical terms.

Analyze this table:

{table_html}"""

# NOTE: Table summarization is now DISABLED for cost optimization.
# Tables are stored as HTML for structure preservation.


# ============================================================================
# Async Summarization Functions
# ============================================================================

async def image_summarizer_async(image_base64: str) -> str:
    """
    Asynchronously summarize a medical image using GPT-4o-mini vision.
    
    Args:
        image_base64: Base64-encoded image from unstructured.io
    
    Returns:
        Text summary of the image
    """
    try:
        response = await async_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a medical AI assistant specialized in analyzing clinical images and diagrams."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": IMAGE_SUMMARY_PROMPT
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ],
                }
            ],
            max_tokens=1500,
            temperature=0.2,  # Lower temperature for factual medical descriptions
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        # Fallback if API fails
        return f"[IMAGE: Unable to process image - {str(e)[:100]}]"


async def table_summarizer_async(table_html: str) -> str:
    """
    DEPRECATED: Table summarization disabled for cost optimization.
    Tables are now stored as HTML for structure preservation.
    
    This function is kept for backwards compatibility but returns HTML directly.
    """
    return table_html


# ============================================================================
# Element Normalization
# ============================================================================

async def normalize_element_async(element, filename: str) -> Optional[NormalizedBlock]:
    """
    Convert an unstructured element into a NormalizedBlock asynchronously.
    
    Args:
        element: Unstructured element (Title, Text, Image, Table, etc.)
        filename: Original PDF filename for metadata
    
    Returns:
        NormalizedBlock or None if element should be skipped
    """
    base_metadata = {
        "element_id": element.id,
        "source": filename,
        "page_number": element.metadata.page_number,
        "original_type": type(element).__name__,
    }
    
    # Add coordinates if available
    if hasattr(element.metadata, 'coordinates') and element.metadata.coordinates:
        base_metadata["coordinates"] = str(element.metadata.coordinates)
    
    element_type = type(element).__name__

    # Text elements
    if element_type in ["NarrativeText", "Title", "ListItem"]:
        if not element.text or not element.text.strip():
            return None

        return NormalizedBlock(
            text=element.text.strip(),
            block_type="text",
            metadata=base_metadata,
        )

    # Image elements
    if element_type == "Image":
        if not hasattr(element.metadata, 'image_base64') or not element.metadata.image_base64:
            return None
        
        summary = await image_summarizer_async(element.metadata.image_base64)
        
        return NormalizedBlock(
            text=f"[IMAGE SUMMARY]\n{summary}",
            block_type="image_summary",
            metadata=base_metadata,
        )

    # Table elements
    if element_type == "Table":
        if not hasattr(element.metadata, 'text_as_html') or not element.metadata.text_as_html:
            # Fallback to plain text if HTML not available
            if element.text:
                return NormalizedBlock(
                    text=f"[TABLE]\n{element.text}",
                    block_type="text",
                    metadata=base_metadata,
                )
            return None
        
        # OPTIMIZED: Store table as HTML directly (no LLM summarization)
        # HTML preserves structure and is searchable via hybrid search
        table_html = element.metadata.text_as_html
        
        return NormalizedBlock(
            text=f"[TABLE HTML]\n{table_html}",
            block_type="table_html",
            metadata=base_metadata,
        )

    # Skip everything else (headers, footers, page numbers, etc.)
    return None


# ============================================================================
# Main Processing Pipeline
# ============================================================================

async def process_pdf_async(
    pdf_path: str,
    filename: str,
    fast_mode: bool = False,
) -> List[Dict[str, Any]]:
    """
    Process a PDF file with async image/table summarization.
    
    Args:
        pdf_path: Path to the PDF file
        filename: Original filename (for metadata)
        fast_mode: If True, skip image extraction and use fast text-only strategy
    
    Returns:
        List of normalized blocks as dictionaries
    """
    # Step 1: Extract elements using unstructured.io
    if fast_mode:
        # FAST MODE: Simple text extraction, no images, no hi-res OCR
        print(f"   ⚡ Fast mode: Skipping image extraction, using 'fast' strategy")
        elements = partition_pdf(
            filename=pdf_path,
            strategy="fast",  # Much faster, text-only
            infer_table_structure=False,  # Skip table structure detection
            languages=["eng", "deu"],
        )
    else:
        # FULL MODE: High-resolution with image extraction
        elements = partition_pdf(
            filename=pdf_path,
            strategy="hi_res",
            infer_table_structure=True,
            extract_image_block_types=["Image", "Table"],
            extract_image_block_to_payload=True,
            languages=["eng", "deu"],
        )
    
    # Step 2: Normalize elements asynchronously (parallel processing)
    tasks = [normalize_element_async(el, filename) for el in elements]
    normalized_blocks = await asyncio.gather(*tasks)
    
    # Filter out None values
    normalized_blocks = [block for block in normalized_blocks if block is not None]
    
    # Step 3: Convert to dictionaries (no need for JSONL intermediate step)
    blocks = [
        {
            "text": block.text,
            "block_type": block.block_type,
            "metadata": block.metadata
        }
        for block in normalized_blocks
    ]
    
    print(f"   ✓ Extracted {len(blocks)} blocks (fast_mode={fast_mode})")
    
    return blocks


def process_pdf(pdf_path: str, filename: str, fast_mode: bool = False) -> List[Dict[str, Any]]:
    """
    Synchronous wrapper for async PDF processing.
    
    Args:
        pdf_path: Path to the PDF file
        filename: Original filename (for metadata)
        fast_mode: If True, skip image extraction for faster processing
    
    Returns:
        List of normalized blocks as dictionaries
    """
    return asyncio.run(process_pdf_async(pdf_path, filename, fast_mode=fast_mode))


# ============================================================================
# Semantic Chunking
# ============================================================================

def chunk_by_title(
    blocks: List[Dict[str, Any]],
    max_characters: int = 7500,
    new_after_n_chars: int = 4000,
    combine_text_under_n_chars: int = 1000,
) -> List[Dict[str, Any]]:
    """
    Chunk blocks using semantic boundaries (titles) with size constraints.
    
    Args:
        blocks: List of normalized blocks
        max_characters: Hard limit - force new chunk
        new_after_n_chars: Soft limit - prefer new chunk
        combine_text_under_n_chars: Merge small chunks
    
    Returns:
        List of chunks with aggregated metadata
    """
    chunks = []
    current = None

    def start_new_chunk(title, meta):
        return {
            "text": "",
            "metadata": {
                "source": meta["source"],
                "page_numbers": set(),
                "element_ids": [],
                "contains": set(),
                "title": title,
            }
        }

    def finalize(chunk):
        if not chunk or not chunk["text"].strip():
            return
        chunk["metadata"]["page_numbers"] = sorted(chunk["metadata"]["page_numbers"])
        chunk["metadata"]["contains"] = sorted(chunk["metadata"]["contains"])
        chunks.append(chunk)

    for block in blocks:
        text = block["text"]
        meta = block["metadata"]

        is_title = meta.get("original_type") == "Title"

        # Title boundary (hard semantic split)
        if is_title:
            finalize(current)
            current = start_new_chunk(text, meta)
            current["text"] += text + "\n\n"
            current["metadata"]["page_numbers"].add(meta["page_number"])
            current["metadata"]["element_ids"].append(meta["element_id"])
            continue

        # Initialize first chunk if needed
        if current is None:
            current = start_new_chunk(None, meta)

        # Soft split (new_after_n_chars)
        if len(current["text"]) >= new_after_n_chars:
            finalize(current)
            current = start_new_chunk(current["metadata"]["title"], meta)

        # Hard split (max_characters)
        if len(current["text"]) + len(text) > max_characters:
            finalize(current)
            current = start_new_chunk(current["metadata"]["title"], meta)

        # Append text
        current["text"] += text + "\n\n"
        current["metadata"]["page_numbers"].add(meta["page_number"])
        current["metadata"]["element_ids"].append(meta["element_id"])

        if block["block_type"] != "text":
            current["metadata"]["contains"].add(block["block_type"])

    finalize(current)

    # Combine small chunks (post-pass)
    merged = []
    buffer = None

    for chunk in chunks:
        if buffer is None:
            buffer = chunk
            continue

        if len(buffer["text"]) < combine_text_under_n_chars:
            buffer["text"] += "\n\n" + chunk["text"]
            buffer["metadata"]["page_numbers"] = sorted(
                set(buffer["metadata"]["page_numbers"]) | set(chunk["metadata"]["page_numbers"])
            )
            buffer["metadata"]["element_ids"].extend(chunk["metadata"]["element_ids"])
            buffer["metadata"]["contains"] = sorted(
                set(buffer["metadata"]["contains"]) | set(chunk["metadata"]["contains"])
            )
        else:
            merged.append(buffer)
            buffer = chunk

    if buffer:
        merged.append(buffer)

    return merged


# ============================================================================
# Metadata Flattening for ChromaDB
# ============================================================================

def flatten_metadata(meta: dict) -> dict:
    """
    Flatten metadata for ChromaDB storage (only stores strings/numbers).
    
    Args:
        meta: Metadata dictionary with sets, lists, etc.
    
    Returns:
        Flattened metadata with all values as strings
    """
    flat = {}
    for k, v in meta.items():
        if isinstance(v, (list, set)):
            flat[k] = ", ".join(map(str, v))
        elif isinstance(v, dict):
            flat[k] = json.dumps(v)
        elif v is None:
            flat[k] = ""
        else:
            flat[k] = str(v)
    return flat
