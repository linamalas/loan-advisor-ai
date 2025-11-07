import os
from dotenv import load_dotenv
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI

load_dotenv()

embedding_model_name=os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)
embeddings=HuggingFaceEmbeddings(model_name=embedding_model_name)

llm=ChatOpenAI(
    model="gpt-4o",
    temperature=0.5,
    streaming=True
)