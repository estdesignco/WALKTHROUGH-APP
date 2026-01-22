"""
Microsoft Teams Integration for Interior Design Management System
ONLY notifies for NEW To-Do items and NEW Punch List items
"""
import aiohttp
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class TeamsIntegration:
    def __init__(self):
        self.webhook_url = os.getenv('TEAMS_WEBHOOK_URL', '')
        self.company_webhook_url = os.getenv('COMPANY_TEAMS_WEBHOOK_URL', '')
        
        if self.webhook_url:
            logging.info(f"✅ Teams webhook configured")
        else:
            logging.warning("TEAMS_WEBHOOK_URL not set")
        
        if self.company_webhook_url:
            logging.info(f"✅ Company Teams webhook configured")
    
    async def _send_teams_webhook(self, card_payload: Dict[str, Any], use_company_webhook: bool = False) -> bool:
        """Send webhook message to Microsoft Teams"""
        webhook_url = self.company_webhook_url if use_company_webhook else self.webhook_url
        
        if not webhook_url:
            logging.warning("No webhook URL configured")
            return False
            
        try:
            logging.info(f"📤 Sending Teams webhook...")
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    webhook_url,
                    json=card_payload,
                    headers={'Content-Type': 'application/json'}
                ) as response:
                    if response.status in [200, 204]:
                        logging.info(f"✅ Teams webhook sent successfully")
                        return True
                    else:
                        logging.error(f"Teams webhook failed: {response.status}")
                        return False
        except Exception as e:
            logging.error(f"Teams webhook error: {str(e)}")
            return False
    
    def _get_priority_color(self, priority: str) -> str:
        """Get color based on priority - matches To-Do list colors"""
        priority_lower = priority.lower() if priority else 'medium'
        colors = {
            'urgent': 'DC2626',      # Red - URGENT
            'high': 'F59E0B',        # Orange/Amber - HIGH
            'medium': '3B82F6',      # Blue - MEDIUM  
            'low': '10B981',         # Green - LOW
        }
        return colors.get(priority_lower, '6B7280')  # Gray default
    
    def _get_priority_emoji(self, priority: str) -> str:
        """Get emoji based on priority"""
        priority_lower = priority.lower() if priority else 'medium'
        emojis = {
            'urgent': '🔴',
            'high': '🟠', 
            'medium': '🔵',
            'low': '🟢',
        }
        return emojis.get(priority_lower, '⚪')

# Global instance
teams_integration = TeamsIntegration()


async def notify_new_todo(
    text: str,
    project_name: str = "",
    priority: str = "medium",
    assigned_to: str = "",
    deadline: str = "",
    description: str = "",
    source_type: str = "checklist"
) -> bool:
    """
    Send notification for NEW To-Do item only
    Beautifully formatted to match the To-Do list style
    """
    if not teams_integration.webhook_url:
        return False
    
    logging.info(f"📋 NEW TO-DO notification: {text}")
    
    priority_emoji = teams_integration._get_priority_emoji(priority)
    priority_color = teams_integration._get_priority_color(priority)
    priority_upper = priority.upper() if priority else 'MEDIUM'
    
    # Build the message with proper formatting
    # Assigned to in BOLD
    assigned_section = f"**Assigned To: {assigned_to}**" if assigned_to else ""
    deadline_section = f"📅 Due: {deadline}" if deadline else ""
    project_section = f"📁 Project: {project_name}" if project_name else ""
    desc_section = f"\n{description}" if description else ""
    
    # Create a visually appealing card
    message_text = f"""{priority_emoji} **NEW TO-DO** {priority_emoji}

━━━━━━━━━━━━━━━━━━━━━━
**{text}**
━━━━━━━━━━━━━━━━━━━━━━{desc_section}

{assigned_section}
{project_section}
{deadline_section}

🏷️ Priority: **{priority_upper}**
📂 Source: {source_type.upper()}

⏰ {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"""

    card_payload = {"text": message_text.strip()}
    
    return await teams_integration._send_teams_webhook(card_payload)


async def notify_new_punch_item(
    description: str,
    project_name: str = "",
    room_name: str = "",
    priority: str = "medium",
    assigned_to: str = "",
    location: str = ""
) -> bool:
    """
    Send notification for NEW Punch List item only
    Beautifully formatted with urgency colors
    """
    if not teams_integration.webhook_url:
        return False
    
    logging.info(f"🔧 NEW PUNCH LIST notification: {description}")
    
    priority_emoji = teams_integration._get_priority_emoji(priority)
    priority_color = teams_integration._get_priority_color(priority)
    priority_upper = priority.upper() if priority else 'MEDIUM'
    
    # Assigned to in BOLD
    assigned_section = f"**Assigned To: {assigned_to}**" if assigned_to else ""
    project_section = f"📁 Project: {project_name}" if project_name else ""
    room_section = f"🚪 Room: {room_name}" if room_name else ""
    location_section = f"📍 Location: {location}" if location else ""
    
    message_text = f"""{priority_emoji} **NEW PUNCH LIST ITEM** {priority_emoji}

━━━━━━━━━━━━━━━━━━━━━━
🔧 **{description}**
━━━━━━━━━━━━━━━━━━━━━━

{assigned_section}
{project_section}
{room_section}
{location_section}

🏷️ Priority: **{priority_upper}**
📋 Status: OPEN

⏰ {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"""

    card_payload = {"text": message_text.strip()}
    
    return await teams_integration._send_teams_webhook(card_payload)


async def notify_company_todo(
    text: str,
    priority: str = "medium",
    deadline: str = "",
    assigned_to: str = ""
) -> bool:
    """
    Send Company To-Do notifications to the SEPARATE Company Teams webhook
    """
    if not teams_integration.company_webhook_url:
        logging.warning("Company webhook URL not configured")
        return False
    
    logging.info(f"🏢 Company Teams notification: {text}")
    
    priority_emoji = teams_integration._get_priority_emoji(priority)
    priority_upper = priority.upper() if priority else 'MEDIUM'
    
    # Assigned to in BOLD
    assigned_section = f"**Assigned To: {assigned_to}**" if assigned_to else ""
    deadline_section = f"📅 Due: {deadline}" if deadline else ""
    
    message_text = f"""{priority_emoji} **COMPANY TO-DO** {priority_emoji}

━━━━━━━━━━━━━━━━━━━━━━
**{text}**
━━━━━━━━━━━━━━━━━━━━━━

{assigned_section}
{deadline_section}

🏷️ Priority: **{priority_upper}**

⏰ {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"""

    card_payload = {"text": message_text.strip()}
    
    return await teams_integration._send_teams_webhook(card_payload, use_company_webhook=True)


# DEPRECATED - Keep for backwards compatibility but does nothing
async def notify_status_change(project_name: str, item_name: str, old_status: str, 
                              new_status: str, room_name: str, vendor: str = "", 
                              cost: float = 0.0) -> bool:
    """
    DEPRECATED: Status changes no longer send notifications.
    Only To-Do and Punch List items trigger notifications.
    """
    logging.info(f"⏭️ Skipping status change notification (disabled) - {item_name}")
    return True  # Return True to not break existing code
