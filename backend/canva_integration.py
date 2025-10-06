"""
Canva API Integration for Interior Design Manager
Handles photo uploads and design board creation
"""
import os
import httpx
import json
import base64
import hashlib
import secrets
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

class CanvaIntegration:
    """Handle Canva API operations for photo uploads and design management."""
    
    def __init__(self):
        self.client_id = os.getenv("CANVA_CLIENT_ID")
        self.client_secret = os.getenv("CANVA_CLIENT_SECRET")
        self.redirect_uri = os.getenv("CANVA_REDIRECT_URI")
        self.base_url = os.getenv("CANVA_API_BASE_URL", "https://api.canva.com/rest/v1")
        self.auth_url = "https://www.canva.com/api/oauth/authorize"
        self.token_url = "https://www.canva.com/api/oauth/token"
        
        # MongoDB for storing tokens
        mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
        self.mongo_client = AsyncIOMotorClient(mongo_url)
        self.db = self.mongo_client[os.getenv("DB_NAME", "interiorsync")]
        self.tokens_collection = self.db["canva_tokens"]
    
    def generate_pkce_pair(self) -> tuple:
        """Generate PKCE code verifier and challenge."""
        # Generate code verifier (43-128 characters)
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        
        # Generate code challenge (SHA256 hash of verifier)
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        
        return code_verifier, code_challenge
    
    def get_authorization_url(self, state: str, code_challenge: str) -> str:
        """Generate Canva OAuth authorization URL with PKCE."""
        scopes = [
            "asset:read",
            "asset:write",
            "design:content:read",
            "design:content:write",
            "folder:read",
            "folder:write",
            "profile:read"
        ]
        
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256"
        }
        
        from urllib.parse import urlencode
        return f"{self.auth_url}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str, code_verifier: str) -> Dict[str, Any]:
        """Exchange authorization code for access token with PKCE."""
        
        # Use form-encoded data as per OAuth spec
        from urllib.parse import urlencode
        data = urlencode({
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "code_verifier": code_verifier
        })
        
        # Minimal headers - just what's required
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
        }
        
        logger.info(f"Attempting token exchange to {self.token_url}")
        
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            try:
                response = await client.post(
                    self.token_url,
                    content=data,
                    headers=headers
                )
                
                logger.info(f"Token exchange response status: {response.status_code}")
                
                if response.status_code != 200:
                    error_text = response.text[:1000]
                    logger.error(f"Token exchange failed: {error_text}")
                    raise Exception(f"Failed to get access token: Status {response.status_code}")
                
                token_data = response.json()
                logger.info("Token exchange successful!")
                
            except httpx.TimeoutException:
                logger.error("Token exchange timed out")
                raise Exception("Token exchange timed out - please try again")
            except Exception as e:
                logger.error(f"Token exchange exception: {str(e)}")
                raise
            
            # Store tokens in database
            await self.tokens_collection.update_one(
                {"user_id": "admin"},  # Single user for now
                {
                    "$set": {
                        "access_token": token_data["access_token"],
                        "refresh_token": token_data.get("refresh_token"),
                        "expires_at": datetime.utcnow().timestamp() + token_data.get("expires_in", 3600),
                        "updated_at": datetime.utcnow()
                    }
                },
                upsert=True
            )
            
            logger.info("✅ Canva tokens stored successfully")
            return token_data
    
    async def store_token(self, token_data: Dict[str, Any]) -> None:
        """Store Canva OAuth tokens in database."""
        await self.tokens_collection.update_one(
            {"user_id": "admin"},  # Single user for now
            {
                "$set": {
                    "access_token": token_data["access_token"],
                    "refresh_token": token_data.get("refresh_token"),
                    "expires_at": datetime.utcnow().timestamp() + token_data.get("expires_in", 3600),
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        logger.info("✅ Canva tokens stored successfully")
    
    async def get_valid_token(self) -> Optional[str]:
        """Get valid access token, refreshing if needed."""
        token_doc = await self.tokens_collection.find_one({"user_id": "admin"})
        
        if not token_doc:
            logger.warning("No Canva token found - user needs to authenticate")
            return None
        
        # Check if token is still valid
        if token_doc.get("expires_at", 0) > datetime.utcnow().timestamp():
            return token_doc["access_token"]
        
        # Try to refresh token
        if token_doc.get("refresh_token"):
            try:
                new_token = await self.refresh_token(token_doc["refresh_token"])
                return new_token["access_token"]
            except Exception as e:
                logger.error(f"Token refresh failed: {str(e)}")
                return None
        
        return None
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token."""
        data = {
            "grant_type": "refresh_token",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            token_data = response.json()
            
            # Update stored tokens
            await self.tokens_collection.update_one(
                {"user_id": "admin"},
                {
                    "$set": {
                        "access_token": token_data["access_token"],
                        "refresh_token": token_data.get("refresh_token", refresh_token),
                        "expires_at": datetime.utcnow().timestamp() + token_data.get("expires_in", 3600),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return token_data
    
    async def upload_image_to_canva(
        self, 
        image_data: bytes, 
        filename: str,
        project_name: str = None,
        room_name: str = None
    ) -> Dict[str, Any]:
        """Upload image to Canva user's content library."""
        access_token = await self.get_valid_token()
        
        if not access_token:
            raise Exception("No valid Canva access token. Please authenticate first.")
        
        # Prepare metadata
        metadata = {
            "name_base64": base64.b64encode(filename.encode()).decode()
        }
        
        if project_name:
            metadata["tags"] = [project_name]
        if room_name:
            if "tags" in metadata:
                metadata["tags"].append(room_name)
            else:
                metadata["tags"] = [room_name]
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/octet-stream",
            "Asset-Upload-Metadata": json.dumps(metadata)
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}/asset-uploads",
                content=image_data,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Canva upload failed: {response.status_code} - {response.text}")
                raise Exception(f"Failed to upload to Canva: {response.text}")
            
            upload_result = response.json()
            job_id = upload_result["job"]["id"]
            
            logger.info(f"✅ Image upload started, job ID: {job_id}")
            
            # Wait for upload to complete
            asset_info = await self.wait_for_upload(job_id, access_token)
            
            return asset_info
    
    async def wait_for_upload(self, job_id: str, access_token: str, max_wait: int = 60) -> Dict[str, Any]:
        """Wait for Canva upload job to complete."""
        import asyncio
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        for _ in range(max_wait):
            await asyncio.sleep(1)
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/asset-uploads/{job_id}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    status = result["job"]["status"]
                    
                    if status == "success":
                        asset = result["job"]["asset"]
                        logger.info(f"✅ Upload completed! Asset ID: {asset['id']}")
                        return asset
                    elif status == "failed":
                        error = result["job"].get("error", {})
                        raise Exception(f"Upload failed: {error.get('message', 'Unknown error')}")
        
        raise Exception("Upload timeout - took too long to complete")
    
    async def create_design_board(
        self,
        title: str,
        asset_ids: List[str] = None
    ) -> Dict[str, Any]:
        """Create a design board in Canva."""
        access_token = await self.get_valid_token()
        
        if not access_token:
            raise Exception("No valid Canva access token")
        
        # Use presentation format for design boards
        design_data = {
            "design_type": {
                "type": "preset",
                "name": "Presentation"
            },
            "title": title
        }
        
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/designs",
                json=design_data,
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Design creation failed: {response.text}")
                raise Exception(f"Failed to create design: {response.text}")
            
            design = response.json()
            logger.info(f"✅ Design board created: {design['design']['id']}")
            
            return design
    
    async def get_user_profile(self) -> Dict[str, Any]:
        """Get Canva user profile."""
        access_token = await self.get_valid_token()
        
        if not access_token:
            raise Exception("No valid Canva access token")
        
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/users/me/profile",
                headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to get profile: {response.text}")

# Global instance
canva_integration = CanvaIntegration()