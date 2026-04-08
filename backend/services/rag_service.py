import PyPDF2
import io
import json
import re
from config import settings
from prompts.resume_parser import RESUME_PARSER_PROMPT
from services.llm_service import llm_service
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np



class RAGService:
    def __init__(self):
        # We replace heavy HuggingFace/PyTorch with lightweight regex chunking and TF-IDF
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

    def create_vector_store(self, resume_text: str) -> dict:
        # Simple manual sentence/paragraph chunker to save memory
        raw_chunks = re.split(r'\n\n|\.\s', resume_text)
        chunks = [c.strip() for c in raw_chunks if len(c.strip()) > 20]
        if not chunks:
            chunks = [resume_text]
        
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(chunks)
        
        # Return a dictionary that acts as our lightweight "vector_store"
        return {
            "chunks": chunks,
            "vectorizer": vectorizer,
            "tfidf_matrix": tfidf_matrix
        }

    def get_relevant_context(self, vector_store: dict, query: str, k: int = 3) -> str:
        chunks = vector_store["chunks"]
        vectorizer = vector_store["vectorizer"]
        tfidf_matrix = vector_store["tfidf_matrix"]

        query_vec = vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
        
        # Get top k indices
        top_indices = similarities.argsort()[-k:][::-1]
        
        # Format the top k chunks
        relevant_chunks = [chunks[i] for i in top_indices if similarities[i] > 0.05]
        return "\n".join(relevant_chunks)

    async def parse_resume(self, resume_text: str) -> dict:
        model = llm_service._get_model(temperature=0.1)
        prompt = RESUME_PARSER_PROMPT.format(resume_text=resume_text)
        response_text = await llm_service._invoke_model(model, prompt)
        return llm_service._parse_json_response(response_text)


rag_service = RAGService()
