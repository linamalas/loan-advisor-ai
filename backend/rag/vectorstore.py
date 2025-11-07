from pathlib import Path
from langchain_community.vectorstores import FAISS


def build_or_load_vectorstore(docs,embeddings,vector_dir:Path):
    """
    Build a FAISS vector store from docs if not already stored.
    Otherwise, load from disk.
    """
    index_path=vector_dir/"faiss_index"
    
    if index_path.exists():
        print("[INFO] Loading existing FAISS index...")
        vectorstore=FAISS.load_local(str(index_path),embeddings,allow_dangerous_deserialization=True)
    else:
        print("[INFO] Building FAISS index from scratch...")
        vectorstore=FAISS.from_documents(docs,embeddings)
        vectorstore.save_local(str(index_path))
        print("[INFO] FAISS index savet at:", index_path)
        
    return vectorstore