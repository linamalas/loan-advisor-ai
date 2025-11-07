from langchain.memory import ConversationBufferMemory

def get_memory(session_id):
        return ConversationBufferMemory(return_messages=True)