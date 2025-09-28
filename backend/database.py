"""
Database connection utilities for Interior Design app
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient

# Database configuration
MONGODB_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "interior_design_db")

# Global database connection
client = None
database = None

def get_database():
    """Get database connection"""
    global client, database
    
    if database is None:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
    
    return database

def get_client():
    """Get MongoDB client"""
    global client
    
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URL)
    
    return client