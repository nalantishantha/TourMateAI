import os
import certifi
from dotenv import load_dotenv
import uuid

# Langgraph / Langchain
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from .tools.tavily_tool import tavily_search
from .tools.flight_tool import search_flights
from .tools.maps_tool import get_location_details, get_travel_distance_time

load_dotenv()
os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is missing. Please add it to your .env file.")

# =========================
# LLM
# =========================
llm = ChatGoogleGenerativeAI(
    model="gemini-3.5-flash",
    api_key=GEMINI_API_KEY,
    temperature=0.7
)

# =========================
# Tools & Agent
# =========================
tools = [search_flights, tavily_search, get_location_details, get_travel_distance_time]

system_prompt = """You are a professional AI travel booking assistant and planner.
Your goal is to create detailed, practical, and budget-aware travel itineraries.
You have access to several tools:
1. `search_flights`: To check live flight data (you don't have ticket prices, just flight availability).
2. `tavily_search`: To search the web for hotels, weather, or general knowledge.
3. `get_location_details`: To look up specific attractions and places on Google Maps.
4. `get_travel_distance_time`: To calculate driving distances between places.

When generating a plan, use these tools to research the destination and flights, then format your final answer beautifully using Markdown with these sections:
1. Trip Summary
2. Flight Information (mention if live pricing is unavailable)
3. Hotel Suggestions
4. Day-by-Day Itinerary (make it practical based on travel times)
5. Estimated Budget
6. Final Recommendations

If the user is editing an existing plan, DO NOT start from scratch unless requested. Simply read the conversation history, research any new specific items if necessary using your tools, and output the UPDATED full markdown itinerary reflecting their requested changes. Keep the same beautiful Markdown formatting.
"""

checkpointer = MemorySaver()
travel_agent = create_react_agent(
    llm,
    tools,
    prompt=system_prompt,
    checkpointer=checkpointer
)

# =========================
# Exported Function
# =========================
def run_travel_agent(user_input: str, thread_id: str | None = None):
    if not thread_id:
        thread_id = f"user_{uuid.uuid4().hex}"
        
    config = {"configurable": {"thread_id": thread_id}}
    
    # We pass the user_input directly to the agent.
    # The agent will append it to its message history (managed by the checkpointer)
    # and decide whether to call tools or respond directly.
    result = travel_agent.invoke(
        {"messages": [("user", user_input)]},
        config=config
    )
    
    final_answer = result["messages"][-1].content
    
    return {
        "thread_id": thread_id,
        "answer": final_answer,
    }