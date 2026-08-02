from functools import lru_cache
from deep_translator import GoogleTranslator

# Initialize translator for Sinhala
translator = GoogleTranslator(source='en', target='si')

@lru_cache(maxsize=1000)
def translate_to_sinhala(text: str) -> str:
    """
    Translates English text to Sinhala.
    Results are cached in memory to avoid redundant API calls.
    Returns the original text if translation fails.
    """
    if not text:
        return text
        
    try:
        return translator.translate(text)
    except Exception as e:
        print(f"Translation failed for '{text}': {e}")
        return text
