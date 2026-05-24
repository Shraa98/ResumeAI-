from supabase import create_client, Client
from app.config import settings

def get_supabase_client() -> Client:
    """
    Returns a standard client using the public anonymous key.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_supabase_admin_client() -> Client:
    """
    Returns an admin client using the service role key to bypass RLS policies when necessary.
    """
    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY is not configured in the backend environment.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
