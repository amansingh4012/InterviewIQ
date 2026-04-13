import PyPDF2
import io
import json
import re
from collections import Counter
import math
from config import settings
from prompts.resume_parser import RESUME_PARSER_PROMPT
from services.llm_service import llm_service

class RAGService:
    def __init__(self):
        # Using lightweight pure python TF-IDF equivalent
        pass

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()

    def _tokenize(self, text: str) -> list:
        return re.findall(r'\w+', text.lower()[:5000])

    def create_vector_store(self, resume_text: str) -> dict:
        # Simple manual sentence/paragraph chunker to save memory
        raw_chunks = re.split(r'\n\n|\.\s', resume_text)
        chunks = [c.strip() for c in raw_chunks if len(c.strip()) > 20]
        if not chunks:
            chunks = [resume_text]
        
        # Tokenize and compute term frequencies
        chunk_tfs = []
        for c in chunks:
            tokens = self._tokenize(c)
            total = len(tokens) if len(tokens) > 0 else 1
            freqs = Counter(tokens)
            chunk_tfs.append({k: v/total for k, v in freqs.items()})
            
        return {
            "chunks": chunks,
            "chunk_tfs": chunk_tfs
        }

    def get_relevant_context(self, vector_store: dict, query: str, k: int = 3) -> str:
        chunks = vector_store["chunks"]
        chunk_tfs = vector_store["chunk_tfs"]
        
        query_tokens = self._tokenize(query)
        
        similarities = []
        for idx, tf in enumerate(chunk_tfs):
            score = sum(tf.get(qt, 0) for qt in query_tokens) # simple TF matching
            similarities.append((score, idx))
            
        similarities.sort(reverse=True, key=lambda x: x[0])
        top_indices = [idx for score, idx in similarities[:k] if score > 0]
        
        relevant_chunks = [chunks[i] for i in top_indices]
        return "\n".join(relevant_chunks)

    async def parse_resume(self, resume_text: str) -> dict:
        model = llm_service._get_model(temperature=0.1)
        prompt = RESUME_PARSER_PROMPT.format(resume_text=resume_text)
        response_text = await llm_service._invoke_model(model, prompt)
        return llm_service._parse_json_response(response_text)


rag_service = RAGService()
