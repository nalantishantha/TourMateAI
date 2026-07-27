from tavily import TavilyClient
from dotenv import load_dotenv
import os

load_dotenv()

from langchain_core.tools import tool

@tool
def tavily_search(query: str) -> str:
    """Search the web for general knowledge, hotels, or destination guides."""
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        return "TAVILY_API_KEY is missing."
    client = TavilyClient(api_key=api_key)
    response = client.search(
        query=query,
        max_results=5
    )

    results =[]

    for i, r in enumerate(response["results"], 1):
        title = r.get("title", "Unknown")
        url = r.get("url", "")
        snippet = r.get("content", "").strip()

        # keep only first 300 characters..
        if len(snippet) > 300:
            snippet = snippet[:300].rsplit(" ", 1)[0] + "..."

        results.append(f"{i}. **{title}**\n   {url}\n   {snippet}")

    return "\n\n".join(results)