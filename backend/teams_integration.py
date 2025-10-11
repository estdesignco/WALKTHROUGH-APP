"""
Microsoft Teams Integration for Interior Design Management System
Automatically creates to-do items when furniture status changes
"""
import aiohttp
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

class TeamsIntegration:
    def __init__(self):
        self.teams_email = os.getenv('TEAMS_EMAIL', 'Neil@estdesignco.com')
        self.teams_password = os.getenv('TEAMS_PASSWORD', 'Tazz1991!!!!')
        self.webhook_url = os.getenv('TEAMS_WEBHOOK_URL', '')
        
    async def create_todo_item(self, project_name: str, item_name: str, old_status: str, new_status: str, 
                             room_name: str, vendor: str = "", cost: float = 0.0) -> bool:
        """
        Create a to-do item in Microsoft Teams when furniture status changes
        
        Args:
            project_name: Name of the interior design project
            item_name: Name of the furniture/fixture item
            old_status: Previous status of the item
            new_status: New status of the item
            room_name: Which room the item is for
            vendor: Vendor name if applicable
            cost: Item cost if applicable
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create meaningful to-do title and description
            todo_title = f"🏠 {project_name}: {item_name} → {new_status}"
            
            description = f"""
            **Project:** {project_name}
            **Room:** {room_name}
            **Item:** {item_name}
            **Status Change:** {old_status} → **{new_status}**
            **Vendor:** {vendor or 'Not specified'}
            **Cost:** ${cost:,.2f} if cost > 0 else 'TBD'
            
            **Action Required:**
            {self._get_action_for_status(new_status)}
            
            Created: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
            """
            
            # Determine urgency based on status
            priority = self._get_priority_for_status(new_status)
            
            # Create simple text payload for webhookbot
            message_text = f"""🏠 STATUS UPDATE

**Project:** {project_name}
**Room:** {room_name}  
**Item:** {item_name}

**Status Changed:** {old_status} → {new_status}

**Vendor:** {vendor or 'TBD'}
**Cost:** ${cost:,.2f} if cost > 0 else 'TBD'
**Priority:** {priority}

**Action Needed:** {self._get_action_for_status(new_status)}

⏰ {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"""
            
            teams_card = {
                "text": message_text
            }
            
            # If webhook URL is configured, send to Teams
            if self.webhook_url:
                return await self._send_teams_webhook(teams_card)
            else:
                # Log for now if webhook not configured
                logging.info(f"Teams Todo Created: {todo_title}")
                logging.info(f"Description: {description}")
                return True
                
        except Exception as e:
            logging.error(f"Failed to create Teams todo item: {str(e)}")
            return False
    
    async def _send_teams_webhook(self, card_payload: Dict[str, Any]) -> bool:
        """Send webhook message to Microsoft Teams"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.webhook_url,
                    json=card_payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    # 200 and 204 are both success codes
                    if response.status in [200, 204]:
                        logging.info(f"✅ Teams webhook sent successfully (status {response.status})")
                        return True
                    else:
                        logging.error(f"Teams webhook failed: {response.status} {await response.text()}")
                        return False
        except Exception as e:
            logging.error(f"Teams webhook error: {str(e)}")
            return False
    
    def _get_action_for_status(self, status: str) -> str:
        """Get recommended action based on status"""
        actions = {
            "TO BE SELECTED": "Research and select options for this item",
            "RESEARCHING": "Continue product research and gather options",
            "PENDING APPROVAL": "Follow up with client for approval",
            "APPROVED": "Proceed with ordering this item",
            "ORDERED": "Monitor order status and delivery timeline", 
            "PICKED": "Verify item selection meets project requirements",
            "CONFIRMED": "Track shipping and prepare for delivery",
            "IN PRODUCTION": "Monitor production timeline with vendor",
            "SHIPPED": "Track shipping progress and prepare for delivery",
            "IN TRANSIT": "Coordinate delivery logistics and job site access",
            "OUT FOR DELIVERY": "Ensure job site is ready for delivery",
            "DELIVERED TO RECEIVER": "Coordinate transfer to job site",
            "DELIVERED TO JOB SITE": "Inspect item and prepare for installation",
            "RECEIVED": "Schedule installation or placement",
            "READY FOR INSTALL": "Coordinate installation crew and schedule",
            "INSTALLING": "Monitor installation progress",
            "INSTALLED": "Final inspection and project completion",
            "ON HOLD": "Resolve issue causing hold status",
            "BACKORDERED": "Check with vendor for updated timeline",
            "DAMAGED": "Process return/exchange with vendor",
            "RETURNED": "Reorder replacement or select alternative",
            "CANCELLED": "Update project plan and select replacement",
            "ORDER SAMPLES": "Order material samples from vendor",
            "SAMPLES ARRIVED": "Review samples with client and get approval",
            "ASK NEIL": "Neil needs to review and provide input",
            "ASK CHARLENE": "Charlene needs to review and provide input", 
            "ASK JALA": "Jala needs to review and provide input",
            "GET QUOTE": "Request pricing quote from vendor",
            "WAITING ON QT": "Follow up on pending quote request",
            "READY FOR PRESENTATION": "Prepare item for client presentation"
        }
        return actions.get(status, f"Follow up on item with status: {status}")
    
    def _get_priority_for_status(self, status: str) -> str:
        """Get priority level based on status"""
        high_priority = [
            "PRESENTATION",
            "READY FOR PRESENTATION", 
            "ORDER SAMPLES",
            "SHIPPED",
            "DELIVERED TO RECEIVER",
            "BACKORDERED",
            "DAMAGED",
            "RECEIVED",
            "READY FOR INSTALL",
            "ON HOLD",
            "OUT FOR DELIVERY",
            "INSTALLING"
        ]
        medium_priority = ["PENDING APPROVAL", "ORDERED", "IN TRANSIT", "APPROVED"]
        
        if status in high_priority:
            return "HIGH"
        elif status in medium_priority:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _get_color_for_status(self, status: str) -> str:
        """Get Teams card color based on status"""
        colors = {
            "TO BE SELECTED": "D4A574",  # Planning - Gold
            "RESEARCHING": "B8860B",     # Planning - Dark Gold
            "PENDING APPROVAL": "DAA520", # Planning - Golden Rod
            "APPROVED": "9ACD32",        # Procurement - Yellow Green
            "ORDERED": "32CD32",         # Procurement - Lime Green  
            "PICKED": "3B82F6",          # Procurement - Blue
            "CONFIRMED": "228B22",       # Procurement - Forest Green
            "IN PRODUCTION": "FF8C00",   # Fulfillment - Dark Orange
            "SHIPPED": "4169E1",         # Fulfillment - Royal Blue
            "IN TRANSIT": "6495ED",      # Fulfillment - Cornflower Blue
            "OUT FOR DELIVERY": "87CEEB", # Fulfillment - Sky Blue
            "DELIVERED TO RECEIVER": "9370DB", # Delivery - Medium Purple
            "DELIVERED TO JOB SITE": "8A2BE2", # Delivery - Blue Violet
            "RECEIVED": "DDA0DD",        # Delivery - Plum
            "READY FOR INSTALL": "20B2AA", # Installation - Light Sea Green
            "INSTALLING": "48D1CC",      # Installation - Medium Turquoise
            "INSTALLED": "00CED1",       # Installation - Dark Turquoise
            "ON HOLD": "DC143C",         # Issues - Crimson
            "BACKORDERED": "B22222",     # Issues - Fire Brick
            "DAMAGED": "8B0000",         # Issues - Dark Red
            "RETURNED": "CD5C5C",        # Issues - Indian Red
            "CANCELLED": "A52A2A"        # Issues - Brown
        }
        return colors.get(status, "808080")  # Default gray

# Global instance
teams_integration = TeamsIntegration()

async def notify_status_change(project_name: str, item_name: str, old_status: str, 
                              new_status: str, room_name: str, vendor: str = "", 
                              cost: float = 0.0) -> bool:
    """
    Convenience function to create Teams todo when item status changes
    """
    return await teams_integration.create_todo_item(
        project_name, item_name, old_status, new_status, 
        room_name, vendor, cost
    )