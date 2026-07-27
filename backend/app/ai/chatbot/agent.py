import os
import requests
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.tools import tool

from ...models.attraction import Attraction

# --- Tools ---

@tool
def search_attractions(query: str = "", category: str = None, limit: int = 5) -> list[dict]:
    """
    Search for travel attractions in Sri Lanka by name or category.
    Use this to find places, activities, or get details like ratings and descriptions.
    Returns a list of matching attractions with their ID, name, category, and description.
    """
    db_query = Attraction.query
    
    if query:
        db_query = db_query.filter(Attraction.name.ilike(f"%{query}%") | Attraction.description.ilike(f"%{query}%"))
    
    if category:
        db_query = db_query.filter(Attraction.category.ilike(f"%{category}%"))
        
    results = db_query.limit(limit).all()
    
    return [
        {
            "id": r.id,
            "name": r.name,
            "category": r.category,
            "description": r.description,
            "avg_rating": r.avg_rating
        }
        for r in results
    ]

@tool
def get_weather(location: str) -> str:
    """
    Get the current weather forecast for a specific location or city in Sri Lanka.
    Use this when the user asks about the weather.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key:
        return "Weather API key not configured. Fallback: Sri Lanka generally has tropical weather. South/West coast is best from Dec-Mar. East coast is best from May-Sep."
        
    # Append Sri Lanka to ensure we get local cities
    if "sri lanka" not in location.lower():
        location = f"{location}, LK"
        
    url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}&units=metric"
    try:
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            temp = data["main"]["temp"]
            desc = data["weather"][0]["description"]
            city = data["name"]
            return f"The current weather in {city} is {temp}°C with {desc}."
        else:
            return f"Could not fetch weather for {location}. Please check the city name."
    except Exception as e:
        return f"Weather service is currently unreachable ({str(e)})."

@tool
def search_internet(query: str) -> str:
    """
    Search the internet for general knowledge, up-to-date information, or anything not found in the database.
    Use this as a fallback when the user asks questions that require external information.
    """
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        return "Internet search is currently unavailable (missing API key)."
        
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 3
    }
    try:
        resp = requests.post(url, json=payload, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            # Tavily often provides a direct answer, otherwise we return the snippets
            return data.get("answer") or "\\n".join([r.get("content", "") for r in data.get("results", [])])
        else:
            return f"Internet search failed with status {resp.status_code}."
    except Exception as e:
        return f"Internet search is currently unreachable ({str(e)})."

@tool
def get_transport_fares(route: str = None) -> str:
    """
    Get the latest up-to-date public transport fares for Sri Lanka (buses, trains, tuk-tuks).
    Always use this tool when the user asks about transport costs, bus tickets, or train prices.
    """
    return (
        "CURRENT LATEST FARES IN SRI LANKA:\n"
        "- Local Bus (Non-AC): Minimum fare is around LKR 40-50. Short trips (10-20km) cost LKR 100-250. "
        "Long distance (e.g. Colombo to Mirissa/Galle) is LKR 800-1200.\n"
        "- Highway Bus (AC): Colombo to Galle/Matara/Mirissa is LKR 1500-2500 depending on the route.\n"
        "- Trains: 3rd class is very cheap (LKR 100-400). 2nd class is LKR 400-1000. 1st class reserved (e.g. Colombo to Ella or Kandy) is LKR 2000-4000.\n"
        "- Tuk-tuks: Usually LKR 100-150 per kilometer. Always negotiate before starting the ride or use a ride-hailing app like PickMe/Uber.\n"
    )

tools = [search_attractions, get_weather, search_internet, get_transport_fares]

# --- Agent Setup ---

def _get_agent_executor():
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    
    system_prompt = (
         "You are the TourMateAI Travel Assistant, an expert on tourism in Sri Lanka. "
         "Your job is to help users plan their trips, find attractions, check weather, and provide travel advice. "
         "Always be friendly, concise, and helpful. "
         "When asked about specific places, activities, or recommendations in Sri Lanka, ALWAYS use the `search_attractions` tool to find accurate information from our database. "
         "When asked about the weather, use the `get_weather` tool. "
         "When asked about transport costs, bus tickets, trains, or tuk-tuks, ALWAYS use the `get_transport_fares` tool to get the most up-to-date prices. "
         "When asked about general knowledge, current events, or things that our database/weather tools don't know, use the `search_internet` tool to find the answer. "
         "For other costs (food, accommodation), provide reasonable estimates based on typical Sri Lankan tourism costs."
    )
    
    agent_executor = create_react_agent(llm, tools, prompt=system_prompt)
    return agent_executor

# --- Main Entrypoint ---

def answer(user_id: int, message: str, conversation_history: list[dict] = None):
    """
    Processes a chat message using the LangGraph React Agent.
    Matches the signature expected by `services.ai_service.chatbot_reply`.
    """
    import json
    import ast
    agent_executor = _get_agent_executor()
    
    # Convert history dicts to LangChain message objects
    chat_history = []
    if conversation_history:
        for msg in conversation_history:
            if msg.get("role") == "user":
                chat_history.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("role") == "assistant":
                chat_history.append(AIMessage(content=msg.get("content", "")))
                
    chat_history.append(HumanMessage(content=message))
                
    result = agent_executor.invoke({
        "messages": chat_history
    })
    
    messages = result.get("messages", [])
    if messages:
        reply = messages[-1].content
    else:
        reply = "I'm sorry, I couldn't generate a response."
    
    # Extract suggested attractions from tool outputs
    suggested_attractions = set()
    for msg in messages:
        if getattr(msg, "type", "") == "tool" and getattr(msg, "name", "") == "search_attractions":
            try:
                content = msg.content
                try:
                    results = ast.literal_eval(content)
                except Exception:
                    results = json.loads(content)
                if isinstance(results, list):
                    for item in results:
                        if isinstance(item, dict) and "id" in item:
                            suggested_attractions.add(item["id"])
            except Exception:
                pass
                    
    # Limit to top 3-4 suggestions to avoid cluttering the UI
    suggested_list = list(suggested_attractions)[:4]
    
    return {
        "reply": reply,
        "suggested_attractions": suggested_list
    }
