import os
import re
from fastapi import FastAPI, HTTPException, status, Header
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

# Load variables from .env
load_dotenv()

app = FastAPI(title="VGS Winch Management API")

def get_db_connection():
    """Establish a connection to the local MySQL container."""
    try:
        connection = mysql.connector.connect(
            host='127.0.0.1',
            database=os.getenv("DB_NAME", "vgs_management"),
            user=os.getenv("DB_USER", "vgs_api"),
            password=os.getenv("DB_PASSWORD", "localdev_api")
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.get("/health")
def health_check():
    """Verify backend and database operational status."""
    conn = get_db_connection()
    if conn and conn.is_connected():
        conn.close()
        return {"status": "healthy", "database": "connected"}
    return {"status": "degraded", "database": "disconnected"}



# Test token: Bloggs, Joe OCdt (RAFAC-2FTS-VGS-123)
@app.get("/api/v1/winches")
def get_squadron_winches(x_mock_token_name: str = Header(..., description="Simulated Microsoft Display Name claim")):
    """
    Reads the mock token name from the headers, extracts the VGS squadron number,
    and queries the local containerized MySQL instance securely.
    """
    # 1. Extract the squadron using your regex pattern (Method 1)
    match = re.search(r"VGS-(\d+)", x_mock_token_name)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Your profile name layout is missing a valid VGS squadron identifier."
        )
    
    squadron_id = match.group(0) # Isolates 'VGS-661'

    # 2. Connect to the real local MySQL container and run the query
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) # Returns rows as nice Python dictionaries
        
        # Use parameterized query to protect against SQL injection
        query = "SELECT id, registration FROM winches WHERE squadron_id = %s"
        cursor.execute(query, (squadron_id,))
        winches = cursor.fetchall()

        cursor.close()
        conn.close()
        
        return {
            "authenticated_user": x_mock_token_name,
            "parsed_squadron": squadron_id,
            "accessible_inventory": winches
        }
        
    except Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database execution error: {str(e)}"
        )