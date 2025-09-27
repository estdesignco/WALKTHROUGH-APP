"""
Teams Integration Module for Interior Design Management System
Handles Microsoft Teams notifications and webhooks
"""

import requests
import json
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class TeamsIntegration:
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
        
    async def notify_status_change(self, project_name: str, item_name: str, old_status: str, new_status: str) -> bool:
        """Send notification when item status changes"""
        try:
            message = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "0076D7",
                "summary": f"Status Update: {item_name}",
                "sections": [{
                    "activityTitle": "Interior Design Project Update",
                    "activitySubtitle": f"Project: {project_name}",
                    "activityImage": "https://teamsnodesample.azurewebsites.net/static/img/image5.png",
                    "facts": [{
                        "name": "Item:",
                        "value": item_name
                    }, {
                        "name": "Status Changed:",
                        "value": f"{old_status} → {new_status}"
                    }, {
                        "name": "Project:",
                        "value": project_name
                    }],
                    "markdown": True
                }]
            }
            
            response = requests.post(
                self.webhook_url,
                data=json.dumps(message),
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"Teams notification sent successfully for {item_name}")
                return True
            else:
                logger.error(f"Teams notification failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending Teams notification: {e}")
            return False

    async def notify_project_created(self, project_name: str, client_name: str, rooms: list) -> bool:
        """Send notification when new project is created"""
        try:
            rooms_text = ", ".join(rooms) if rooms else "No rooms specified"
            
            message = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "00FF00",
                "summary": f"New Project Created: {project_name}",
                "sections": [{
                    "activityTitle": "🎉 New Interior Design Project",
                    "activitySubtitle": f"Client: {client_name}",
                    "facts": [{
                        "name": "Project Name:",
                        "value": project_name
                    }, {
                        "name": "Client:",
                        "value": client_name
                    }, {
                        "name": "Rooms:",
                        "value": rooms_text
                    }],
                    "markdown": True
                }]
            }
            
            response = requests.post(
                self.webhook_url,
                data=json.dumps(message),
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error sending Teams project notification: {e}")
            return False

# Default webhook URL (can be overridden)
DEFAULT_WEBHOOK_URL = "https://webhookbot.c-toss.com/hook/EstDesignCo@gmail.com"

# Function for backward compatibility
async def notify_status_change(project_name: str, item_name: str, old_status: str, new_status: str) -> bool:
    """Backward compatible function for status change notifications"""
    teams = TeamsIntegration(DEFAULT_WEBHOOK_URL)
    return await teams.notify_status_change(project_name, item_name, old_status, new_status)