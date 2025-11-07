from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain.schema.runnable import RunnableLambda
from .prompts import get_prompt
from .llm import llm

def build_conversational_chain(vectorstore,risk_label, risk_score, explanation, user_features):
    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 4})

    def get_context(inputs):
        q = inputs.get("question", "")
        docs = retriever.invoke(q)  
        text = "\n\n".join(d.page_content for d in docs)
 
        srcs = []
        for d in docs:
            src = d.metadata.get("source") or d.metadata.get("file_path") or "document"
            page = d.metadata.get("page")
            srcs.append(f"{src}{f' p.{page+1}' if isinstance(page,int) else ''}")
    
        seen, uniq = set(), []
        for s in srcs:
            if s not in seen:
                uniq.append(s); seen.add(s)
        return {"context": text, "sources": "; ".join(uniq)}
    
    rag_chain = (
        {
            "question": RunnablePassthrough(),
            "chat_history": RunnablePassthrough(),
            "context":RunnableLambda(lambda x:get_context(x)["context"]),
            "sources":RunnableLambda(lambda x:get_context(x)["sources"]),
            "mode": RunnablePassthrough(),   
            "name": RunnablePassthrough(),   
           
        }
        | get_prompt(risk_label, risk_score, explanation, user_features)
        | llm
        | StrOutputParser()
    )
    return rag_chain
