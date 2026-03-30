import PyPDF2
import io
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
import json
import re
from config import settings
from prompts.resume_parser import RESUME_PARSER_PROMPT
from services.llm_service import llm_service


class RAGService:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ".", " "]
        )

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()

    def create_vector_store(self, resume_text: str) -> FAISS:
        chunks = self.text_splitter.split_text(resume_text)
        if not chunks:
            # Fallback: use the entire text as a single document
            chunks = [resume_text]
        documents = [Document(page_content=chunk) for chunk in chunks]
        vector_store = FAISS.from_documents(documents, self.embeddings)
        return vector_store

    def get_relevant_context(self, vector_store: FAISS, query: str, k: int = 3) -> str:
        docs = vector_store.similarity_search(query, k=k)
        return "\n".join([doc.page_content for doc in docs])

    async def parse_resume(self, resume_text: str) -> dict:
        model = llm_service._get_model(temperature=0.1)
        prompt = RESUME_PARSER_PROMPT.format(resume_text=resume_text)
        response_text = await llm_service._invoke_model(model, prompt)
        return llm_service._parse_json_response(response_text)


rag_service = RAGService()
