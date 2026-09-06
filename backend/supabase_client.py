"""
ANUBHAV Supabase Client
Initializes Supabase clients for backend operations.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
env_path = Path(__file__).parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is not set.")

# Admin client with service_role key (bypasses RLS, full read/write)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)

# Anon client with anon key (enforces RLS, used for client-like queries and testing)
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_ANON_KEY else None

def get_supabase_admin() -> Client:
    return supabase_admin

def get_supabase_anon() -> Client:
    return supabase_anon
