import re

def sanitize_html(text: str) -> str:
    """
    Very basic XSS sanitizer that removes HTML tags.
    In a production app, use 'nh3' or 'bleach'.
    """
    if not text:
        return text
    
    # Remove all HTML tags
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)
