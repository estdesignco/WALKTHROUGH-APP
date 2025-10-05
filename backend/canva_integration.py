"""
Canva API Integration for Interior Design Manager
Handles photo uploads and design board creation
"""
import os
import httpx
import json
import base64
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
    
    def get_authorization_url(self, state: str) -> str:
        """Generate Canva OAuth authorization URL."""
        scopes = [
            "asset:read",
            "asset:write", 
            "design:meta:read",
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
            "state": state
        }
        
        from urllib.parse import urlencode
        return f"{self.auth_url}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri
        }
        
        # More comprehensive browser-like headers to bypass Cloudflare
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Origin": "https://www.canva.com",
            "Referer": "https://www.canva.com/",
            "Sec-Ch-Ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        }
        
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
            response = await client.post(
                self.token_url,
                data=data,
                headers=headers
            )
            
            logger.info(f"Token exchange response status: {response.status_code}")
            logger.info(f"Token exchange response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.text[:500]}")
                raise Exception(f"Failed to get access token: Status {response.status_code}")
            
            token_data = response.json()
            
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