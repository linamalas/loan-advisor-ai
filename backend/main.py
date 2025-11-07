from fastapi import FastAPI, WebSocket,WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loan_features import LoanFeatures
from default_classifier import predict
from rag.config import DOC_PATHS, VECTOR_DIR
from rag.loader import load_and_split_pdfs
from rag.vectorstore import build_or_load_vectorstore
from rag.llm import embeddings
from rag.chains import build_conversational_chain

import json, os, uuid
from pydantic import BaseModel


app=FastAPI(
    title="Home Loan Default Risk API",
    description="Predicts default risk on home equity loans with explanations (LIME/SHAP). and provides RAG-based chatbot.",
    version="1.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],
)



docs=load_and_split_pdfs(DOC_PATHS)
vectorstore=build_or_load_vectorstore(docs,embeddings,VECTOR_DIR)


    
@app.post("/predict")
async def predict_risk(data:LoanFeatures,method:str="lime",top_n:int=18):
    """
    
    Predicts the default risk of a home loan based on input features.
    
    Args:
        data (LoanFeatures): The loan features for prediction.
        method (str): The Explanation method to use.
                      - "lime" (default): user-friendly local explanation
                      - "shap_meta": explains which base models influenced the ensemble
                      - "shap_rf", "shap_xgb", "shap_dt", "shap_gb", etc.: explain a specific base model
        top_n (int): Number of top features to include in explanation. Defaults to 3.
        
    Returns:
        dict: A dictionary containing the prediction and explanation.
    """
    features=data.dict()
    result=predict(features,top_n=top_n,method=method)
    return result

session_chains = {}
session_histories = {}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())

    try:
        while True:
            data = await websocket.receive_json()
            question = data.get("question", "")
            ml_result = data.get("ml_result")
            name=data.get("name")

            
            if session_id not in session_histories:
                session_histories[session_id] = []

            chat_history = "\n".join(session_histories[session_id])

           
            if ml_result and session_id not in session_chains:
                context_data = ml_result
                context_data["name"]=name
                print(f"[INFO] User name received: {name}")
                session_chains[session_id] = {
                    "data": context_data,
                    "chain": build_conversational_chain(
                        vectorstore,
                        context_data.get("risk_label", ""),
                        context_data.get("risk_score", ""),
                        context_data.get("explanation", []),
                        context_data.get("features", {}),
                    ),
                }
                print(f"[INFO] Chain initialized for session {session_id}")

            
            if session_id in session_chains:
                rag_chain = session_chains[session_id]["chain"]
            else:
                rag_chain = build_conversational_chain(vectorstore, "", "", [], {})
            mode="summary" if ml_result else "chat"
            payload={
                "question":question,
                "chat_history":chat_history,
                "mode":mode,
                "name":context_data.get("name","") if context_data else "",
            }
            async for chunk in rag_chain.astream(payload):
                await websocket.send_json({"type": "rag_stream", "content": chunk})

            session_histories[session_id].append(f"User: {question}")
            session_histories[session_id].append(f"Assistant: {chunk}")

            await websocket.send_json({"type": "rag_done"})

    except WebSocketDisconnect:
        print(f"[INFO] Client {session_id} disconnected")
        session_chains.pop(session_id, None)
        session_histories.pop(session_id, None)


        
USERS_FILE = "users.json"

class User(BaseModel):
    fullName: str
    email: str
    password: str   

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

@app.post("/signup")
def signup(user: User):
    users = load_users()
    if user.email in users:
        raise HTTPException(status_code=400, detail="Account already exists.")

    token = str(uuid.uuid4())
    users[user.email] = {
        "fullName": user.fullName,
        "password": user.password,
        "token": token
    }
    save_users(users)
    return {"token": token, "fullName": user.fullName}

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login(data: LoginRequest):
    users = load_users()
    if data.email not in users:
        raise HTTPException(status_code=400, detail="Account does not exist.")
    if users[data.email]["password"] != data.password:
        raise HTTPException(status_code=400, detail="Invalid password.")


    return {"token": users[data.email]["token"], "fullName": users[data.email]["fullName"]}
