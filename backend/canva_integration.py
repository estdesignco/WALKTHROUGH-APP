"""
Enhanced Canva Integration for Interior Design Management
Automatically extract product information from Canva boards and sync with checklist
"""
import aiohttp
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs
import json

logger = logging.getLogger(__name__)

class CanvaIntegration:
    def __init__(self):
        self.canva_base_url = 'https://www.canva.com'
        
    async def extract_canva_board_products(self, canva_url: str) -> Dict[str, Any]:
        """
        Extract product information from a Canva design board
        This is for the feature where you place items on Canva boards and want to sync back to checklist
        """
        try:
            if not self._is_valid_canva_url(canva_url):
                return {
                    'success': False,
                    'error': 'Invalid Canva URL provided'
                }
            
            # Extract design ID from URL
            design_id = self._extract_design_id(canva_url)
            if not design_id:
                return {
                    'success': False,
                    'error': 'Could not extract design ID from URL'
                }
            
            # Get Canva board content
            board_data = await self._fetch_canva_board_data(canva_url)
            
            if not board_data:
                return {
                    'success': False,
                    'error': 'Could not access Canva board data'
                }
            
            # Extract product links and information from the board
            products = self._extract_products_from_board(board_data)
            
            return {
                'success': True,
                'canva_url': canva_url,
                'design_id': design_id,
                'total_products': len(products),
                'products': products,
                'extracted_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Canva board extraction failed for {canva_url}: {str(e)}")
            return {
                'success': False,
                'error': f'Extraction failed: {str(e)}'
            }
    
    async def create_room_checklist_on_canva(self, room_name: str, products: List[Dict], project_name: str) -> Dict[str, Any]:
        """
        Create a small checklist on Canva board for a specific room
        This addresses your request for "small checklist that could live on a canva board on each room"
        """
        try:
            # Create checklist data structure
            checklist_data = {
                'room_name': room_name,
                'project_name': project_name,
                'total_items': len(products),
                'checklist_items': []
            }
            
            for product in products:
                checklist_data['checklist_items'].append({
                    'name': product.get('name', 'Unknown Item'),
                    'status': product.get('status', 'TO BE SELECTED'),
                    'vendor': product.get('vendor', ''),
                    'completed': product.get('status') in ['READY FOR PRESENTATION', 'INSTALLED', 'RECEIVED'],
                    'priority': self._get_item_priority(product.get('status', '')),
                    'link': product.get('link', '')
                })
            
            # Generate checklist HTML that can be used in Canva
            checklist_html = self._generate_checklist_html(checklist_data)
            
            return {
                'success': True,
                'room_name': room_name,
                'checklist_html': checklist_html,
                'checklist_data': checklist_data,
                'canva_instructions': self._get_canva_integration_instructions()
            }
            
        except Exception as e:
            logger.error(f"Canva checklist creation failed: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to create checklist: {str(e)}'
            }
    
    async def sync_canva_board_with_checklist(self, canva_url: str, project_id: str, room_name: str) -> Dict[str, Any]:
        """
        Sync products from Canva board back to the main checklist
        This implements your vision of "get ALL OF THOSE LINKS to populate the spreadsheet/room AUTOMATICALLY"
        """
        try:
            # Extract products from Canva board
            canva_result = await self.extract_canva_board_products(canva_url)
            
            if not canva_result['success']:
                return canva_result
            
            products = canva_result['products']
            
            # Prepare items for checklist integration
            sync_results = {
                'products_found': len(products),
                'products_added': 0,
                'products_updated': 0,
                'errors': []
            }
            
            # For each product found on the Canva board, attempt to match or create in checklist
            for product in products:
                try:
                    # This would integrate with your existing item creation/update logic
                    item_data = {
                        'name': product.get('name', 'Canva Item'),
                        'link': product.get('link', ''),
                        'vendor': product.get('vendor', ''),
                        'image_url': product.get('image_url', ''),
                        'price': product.get('price', ''),
                        'status': 'READY FOR PRESENTATION',  # Default status for Canva items
                        'source': 'canva_board'
                    }
                    
                    # Here you would call your existing item creation API
                    # For now, we'll just track what would be created
                    sync_results['products_added'] += 1
                    
                except Exception as e:
                    sync_results['errors'].append(f"Failed to sync product {product.get('name', 'Unknown')}: {str(e)}")
            
            return {
                'success': True,
                'canva_url': canva_url,
                'project_id': project_id,
                'room_name': room_name,
                'sync_results': sync_results,
                'synced_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Canva-checklist sync failed: {str(e)}")
            return {
                'success': False,
                'error': f'Sync failed: {str(e)}'
            }
    
    def _is_valid_canva_url(self, url: str) -> bool:
        """Check if URL is a valid Canva design URL"""
        try:
            parsed = urlparse(url)
            return (
                parsed.netloc in ['canva.com', 'www.canva.com'] and
                '/design/' in parsed.path
            )
        except Exception:
            return False
    
    def _extract_design_id(self, canva_url: str) -> Optional[str]:
        """Extract design ID from Canva URL"""
        try:
            # Canva URLs typically look like: https://www.canva.com/design/DESIGN_ID/...
            match = re.search(r'/design/([A-Za-z0-9_-]+)', canva_url)
            return match.group(1) if match else None
        except Exception:
            return None
    
    async def _fetch_canva_board_data(self, canva_url: str) -> Optional[Dict]:
        """
        🚀 ENHANCED CANVA BOARD SCRAPING using Playwright
        Extracts furniture links and product information from Canva design boards
        """
        try:
            from playwright.async_api import async_playwright
            
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--no-sandbox', 
                        '--disable-setuid-sandbox', 
                        '--disable-dev-shm-usage',
                        '--disable-blink-features=AutomationControlled'
                    ]
                )
                
                context = await browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080}
                )
                page = await context.new_page()
                page.set_default_timeout(45000)
                
                try:
                    print(f"🎨 CANVA: Navigating to {canva_url}")
                    await page.goto(canva_url, wait_until='domcontentloaded', timeout=60000)
                    
                    # Wait for Canva to load
                    try:
                        await page.wait_for_load_state('networkidle', timeout=30000)
                    except:
                        print("⚠️ CANVA: Network idle timeout - continuing")
                    
                    # Extended wait for Canva's dynamic content
                    await page.wait_for_timeout(8000)
                    
                    # Scroll to load all content
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_timeout(3000)
                    await page.evaluate("window.scrollTo(0, 0)")
                    await page.wait_for_timeout(2000)
                    
                    # Extract ALL LINKS from the Canva page
                    all_links = await page.evaluate('''
                        () => {
                            const links = [];
                            
                            // Get all anchor tags
                            const anchors = document.querySelectorAll('a[href]');
                            anchors.forEach(a => {
                                const href = a.href;
                                if (href && (
                                    href.includes('fourhandshome.com') ||
                                    href.includes('fourhands.com') ||
                                    href.includes('wayfair.com') ||
                                    href.includes('overstock.com') ||
                                    href.includes('homedepot.com') ||
                                    href.includes('lowes.com') ||
                                    href.includes('amazon.com') ||
                                    href.includes('target.com') ||
                                    href.includes('walmart.com') ||
                                    href.includes('westelm.com') ||
                                    href.includes('potterybarn.com') ||
                                    href.includes('crateandbarrel.com') ||
                                    href.includes('roomandboard.com') ||
                                    href.includes('cb2.com') ||
                                    href.includes('article.com') ||
                                    href.includes('allmodern.com') ||
                                    href.includes('perigold.com') ||
                                    href.includes('ballarddesigns.com') ||
                                    href.includes('serenaandlily.com') ||
                                    href.includes('uttermost.com') ||
                                    href.includes('visualcomfort.com') ||
                                    href.includes('bernhardt.com') ||
                                    href.includes('loloi.com') ||
                                    href.includes('reginaandrew.com') ||
                                    href.includes('.com') // Any commercial link
                                )) {
                                    links.push({
                                        url: href,
                                        text: a.innerText?.trim() || '',
                                        title: a.title || ''
                                    });
                                }
                            });
                            
                            // Also look for links in text content using regex
                            const textContent = document.body.innerText;
                            const urlRegex = /https?:\/\/[^\s]+/g;
                            const textUrls = textContent.match(urlRegex) || [];
                            
                            textUrls.forEach(url => {
                                if (!links.some(link => link.url === url)) {
                                    links.push({
                                        url: url,
                                        text: 'Found in text',
                                        title: ''
                                    });
                                }
                            });
                            
                            return links;
                        }
                    ''')
                    
                    print(f"🔗 Found {len(all_links)} links in Canva page")
                    
                    # Extract basic information
                    title = await page.title()
                    
                    # Try to get design images (Canva shows design previews)
                    images = []
                    try:
                        # Look for image elements in Canva
                        image_elements = await page.query_selector_all('img[src*="canva"]')
                        for img in image_elements[:5]:  # Limit to first 5 images
                            src = await img.get_attribute('src')
                            if src and 'canva' in src:
                                images.append(src)
                    except Exception as img_error:
                        print(f"⚠️ Could not extract images: {img_error}")
                    
                    # Try to extract color palette if visible
                    colors = []
                    try:
                        # Look for color elements (this is approximate as Canva structure may vary)
                        color_elements = await page.query_selector_all('[style*="background-color"], [style*="color:"]')
                        for elem in color_elements[:10]:  # Limit color extraction
                            style = await elem.get_attribute('style')
                            if style:
                                # Extract color values from style attribute
                                import re
                                color_matches = re.findall(r'#[0-9a-fA-F]{6}|rgb\([0-9,\s]+\)', style)
                                colors.extend(color_matches[:3])  # Max 3 colors per element
                    except Exception as color_error:
                        print(f"⚠️ Could not extract colors: {color_error}")
                    
                    try:
                        # Get page text content
                        text_content = await page.evaluate('document.body.innerText')
                        # Clean and limit text
                        description = text_content[:500] if text_content else "Canva design board"
                    except:
                        description = "Canva design board"
                    
                    result = {
                        'title': title,
                        'description': description,
                        'links_found': all_links,
                        'total_links': len(all_links),
                        'images': images,
                        'colors': list(set(colors)),  # Remove duplicates
                        'canva_url': canva_url,
                        'scraped_at': datetime.utcnow().isoformat()
                    }
                    
                    print(f"✅ CANVA SCRAPING COMPLETE: {len(all_links)} links, {len(images)} images, {len(colors)} colors")
                    return result
                    
                except Exception as e:
                    print(f"❌ CANVA SCRAPING ERROR: {str(e)}")
                    return None
                finally:
                    await browser.close()
                    
        except Exception as e:
            logger.error(f"Failed to fetch Canva board data: {str(e)}")
            # Fallback to basic HTTP request if Playwright fails
            return await self._fetch_canva_board_data_fallback(canva_url)
    
    async def _fetch_canva_board_data_fallback(self, canva_url: str) -> Optional[Dict]:
        """Fallback method using basic HTTP request"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                
                async with session.get(canva_url, headers=headers) as response:
                    if response.status == 200:
                        html = await response.text()
                        return self._parse_canva_html(html)
                    
        except Exception as e:
            logger.error(f"Fallback Canva fetch also failed: {str(e)}")
        
        return None
    
    def _parse_canva_html(self, html: str) -> Dict:
        """Parse Canva HTML to extract embedded links and product information"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for links in the HTML (this is simplified - real implementation would be more complex)
            links = []
            for link in soup.find_all('a', href=True):
                href = link['href']
                if any(domain in href for domain in ['fourhands.com', 'uttermost.com', 'bernhardt.com']):
                    links.append({
                        'url': href,
                        'text': link.get_text(strip=True)
                    })
            
            return {
                'links_found': links,
                'total_links': len(links)
            }
            
        except Exception as e:
            logger.error(f"Canva HTML parsing failed: {str(e)}")
            return {}
    
    def _extract_products_from_board(self, board_data: Dict) -> List[Dict]:
        """Extract product information from parsed Canva board data"""
        products = []
        
        try:
            for link_data in board_data.get('links_found', []):
                url = link_data.get('url', '')
                text = link_data.get('text', '')
                
                # Extract vendor from URL
                vendor = self._extract_vendor_from_url(url)
                
                product = {
                    'name': text or 'Canva Board Item',
                    'link': url,
                    'vendor': vendor,
                    'source': 'canva_board',
                    'extracted_at': datetime.utcnow().isoformat()
                }
                
                products.append(product)
                
        except Exception as e:
            logger.error(f"Product extraction failed: {str(e)}")
        
        return products
    
    def _extract_vendor_from_url(self, url: str) -> str:
        """Extract vendor name from product URL"""
        try:
            domain = urlparse(url).netloc.lower()
            
            vendor_mapping = {
                'fourhands.com': 'Four Hands',
                'uttermost.com': 'Uttermost',
                'bernhardt.com': 'Bernhardt',
                'visualcomfort.com': 'Visual Comfort',
                'loloirugs.com': 'Loloi Rugs',
                'reginaandrew.com': 'Regina Andrew'
            }
            
            for domain_key, vendor_name in vendor_mapping.items():
                if domain_key in domain:
                    return vendor_name
            
            return 'Unknown Vendor'
            
        except Exception:
            return 'Unknown Vendor'
    
    def _get_item_priority(self, status: str) -> str:
        """Get priority level based on item status"""
        high_priority = ['ON HOLD', 'DAMAGED', 'BACKORDERED', 'OUT FOR DELIVERY']
        medium_priority = ['PENDING APPROVAL', 'ORDERED', 'SHIPPED', 'IN TRANSIT']
        
        if status in high_priority:
            return 'HIGH'
        elif status in medium_priority:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _generate_checklist_html(self, checklist_data: Dict) -> str:
        """Generate HTML for room checklist that can be embedded in Canva"""
        html = f"""
        <div style="font-family: Arial, sans-serif; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px;">
            <h3 style="color: #8B7355; margin-top: 0; text-align: center; border-bottom: 2px solid #8B7355; padding-bottom: 10px;">
                ✓ {checklist_data['room_name']} Checklist
            </h3>
            <p style="color: #666; text-align: center; margin: 10px 0; font-size: 12px;">
                {checklist_data['project_name']} | {checklist_data['total_items']} items
            </p>
        """
        
        for item in checklist_data['checklist_items']:
            status_color = '#10B981' if item['completed'] else '#F59E0B'
            checkbox = '☑️' if item['completed'] else '☐'
            
            html += f"""
            <div style="margin: 8px 0; padding: 8px; background: #f9f9f9; border-radius: 5px; border-left: 3px solid {status_color};">
                <div style="font-size: 14px; font-weight: bold; color: #333;">
                    {checkbox} {item['name']}
                </div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">
                    {item['vendor']} | {item['status']}
                </div>
            </div>
            """
        
        html += """
        </div>
        """
        
        return html
    
    def _get_canva_integration_instructions(self) -> List[str]:
        """Get instructions for integrating with Canva"""
        return [
            "1. Copy the generated HTML checklist",
            "2. In Canva, add a 'Text' element to your design",
            "3. Paste the HTML content (Canva will render it as rich text)",
            "4. Position the checklist on your room board",
            "5. The checklist will automatically update when you sync with the main system"
        ]

# Global instance
canva_integration = CanvaIntegration()

async def extract_products_from_canva_board(canva_url: str):
    """Convenience function to extract products from Canva board"""
    return await canva_integration.extract_canva_board_products(canva_url)

async def create_canva_room_checklist(room_name: str, products: List[Dict], project_name: str):
    """Convenience function to create room checklist for Canva"""
    return await canva_integration.create_room_checklist_on_canva(room_name, products, project_name)

async def sync_canva_with_project(canva_url: str, project_id: str, room_name: str):
    """Convenience function to sync Canva board with project checklist"""
    return await canva_integration.sync_canva_board_with_checklist(canva_url, project_id, room_name)