import os
import googlemaps
from langchain_core.tools import tool

def get_gmaps_client():
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_MAPS_API_KEY is not set in the environment.")
    return googlemaps.Client(key=api_key)

@tool
def get_location_details(query: str) -> str:
    """Fetch details about a specific location, attraction, or place using Google Maps Places API.
    Provides address, rating, types, and summary info about the location.
    
    Args:
        query: The name of the place (e.g. 'Sigiriya Rock Fortress, Sri Lanka' or 'Best seafood restaurant in Colombo')
    """
    try:
        gmaps = get_gmaps_client()
        places_result = gmaps.places(query)
        if not places_result or not places_result.get('results'):
            return f"No location found for '{query}'"
        
        # Take the top result
        place = places_result['results'][0]
        name = place.get('name', 'Unknown')
        address = place.get('formatted_address', 'Unknown')
        rating = place.get('rating', 'No rating')
        types = ", ".join(place.get('types', []))
        
        info = f"Name: {name}\nAddress: {address}\nRating: {rating}\nTypes: {types}"
        return info
    except Exception as e:
        return f"Error fetching location details: {str(e)}"

@tool
def get_travel_distance_time(origin: str, destination: str) -> str:
    """Calculate the travel distance and estimated time between two locations (driving).
    
    Args:
        origin: The starting address or place name (e.g. 'Colombo')
        destination: The destination address or place name (e.g. 'Kandy')
    """
    try:
        gmaps = get_gmaps_client()
        matrix = gmaps.distance_matrix(origins=[origin], destinations=[destination], mode="driving")
        
        if matrix['status'] == 'OK':
            element = matrix['rows'][0]['elements'][0]
            if element['status'] == 'OK':
                distance = element['distance']['text']
                duration = element['duration']['text']
                return f"Driving from {origin} to {destination}:\nDistance: {distance}\nEstimated Time: {duration}"
            else:
                return f"Could not calculate route: {element['status']}"
        return f"Distance matrix failed: {matrix['status']}"
    except Exception as e:
        return f"Error calculating distance: {str(e)}"
