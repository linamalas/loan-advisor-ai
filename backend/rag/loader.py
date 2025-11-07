from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_and_split_pdfs(doc_paths,chunk_size=1000,chunk_overlap=100):
    all_docs=[]
    splitter=RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    for path in doc_paths:
        print(f"[INFO] Loading {path.name}....")
        loader=PyPDFLoader(str(path))
        pages=loader.load()
        docs=splitter.split_documents(pages)
        print(f"[INFO] {path.name} -> {len(docs)} chunks")
        
        all_docs.extend(docs)
    print(f"[INFO] Total chunks form all PDFs: {len(all_docs)}")
    
    return all_docs
