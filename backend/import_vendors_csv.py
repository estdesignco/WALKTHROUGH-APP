"""
Import Vendors from CSV file into master_contacts collection
User's vendor list with all contact information
"""
import asyncio
import os
from datetime import datetime, timezone
import uuid
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'interior_design_db')]

# Vendor data extracted from user's Vendors.csv
VENDORS = [
    {"company": "Accent Decor", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Aidan Gray", "first": "Dennis", "last": "Brito", "email": "db@goah.com", "phone": "469-568-8700 x 3201", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "allstate", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Amazon", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Americanhome", "first": None, "last": None, "email": "inquiries@americanhomefurniture.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Amity Home", "first": "Libby", "last": "Womack", "email": "cs5@amityhome.com", "phone": "(706) 973-8011", "website": "www.amityhome.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Curtains,bedding,Rugs"},
    {"company": "Anthropologie", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Art America", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Art Classics", "first": None, "last": None, "email": None, "phone": None, "website": "www.artclassicsltd.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Art"},
    {"company": "Artistic Design Works", "first": "David", "last": "Cohen", "email": "david@artisticdesignworks.com", "phone": None, "website": "www.artisticdesignworks.com", "address": None, "city": None, "state": "Georgia", "zip": None, "notes": None, "tags": "Art"},
    {"company": "Asmiro", "first": None, "last": None, "email": "DonotKnowEtsy@gmail.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Atelier Home", "first": "Kimberly", "last": "Stone", "email": "kimberly@atelierhome.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "B2B Cabinets", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Barbara Crossgrove", "first": "Julie", "last": "Triplett", "email": "julie@barbaracosgrovelamps.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Barrow Industries", "first": "Pat", "last": "McInnis", "email": "dogwoodpat@gmail.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Bassett Mirror", "first": "Scott", "last": "Womack", "email": "scottwomack2@gmail.com", "phone": "404-310-9733", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Bernhardt", "first": "Heather", "last": None, "email": "bernhardtrep@gmail.com", "phone": None, "website": None, "address": "1839 Morganton Blvd.", "city": "Lenoir", "state": "North Carolina", "zip": "28645", "notes": None, "tags": None},
    {"company": "Blue Ocean Traders", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Build with Ferguson", "first": "No", "last": "Name", "email": "orders@estdesignco.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Buster & Punch", "first": "On", "last": "Line", "email": "Online@ordering.com", "phone": None, "website": "busterandpunch.us", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "CB2", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Celadon Art", "first": None, "last": None, "email": "orderdesk@celadonart.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "CENTURY", "first": "Gayla", "last": "Campbell", "email": "gcampbell@centuryfurniture.com", "phone": "(770) 401-8727", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Furniture"},
    {"company": "Charles Ray", "first": "Lisa", "last": None, "email": "lisa@charlesrayatlanta.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "City Plumbing & Electric Supply Company", "first": "Dee", "last": "Coward", "email": "dcoward@cpesupply.com", "phone": "470-491-7536", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "CLASSIC DESIGN SERVICES", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": "4194 NE EXPRESSWAY", "city": "Atlanta", "state": "Georgia", "zip": "30340", "notes": "Receiver & Delivery", "tags": None},
    {"company": "Classic Home", "first": "Ernesto", "last": "Cortez", "email": "ernesto.cortez@classichome.com", "phone": "323-604-1361", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Codarus", "first": "Tyler", "last": "Lynch", "email": "tlynch@codarus.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Contract Specs", "first": "Bonnie", "last": "Johnson", "email": "bonnie@southernluxurysalesagency.com", "phone": None, "website": None, "address": None, "city": None, "state": "Georgia", "zip": None, "notes": None, "tags": None},
    {"company": "Cotton Design Shop", "first": None, "last": None, "email": "info@cottondesignshop.com", "phone": None, "website": None, "address": "301 Washington St NW suite 2 Gainesville GA 30501", "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Crate and Barrel", "first": "Crate", "last": "Barrel", "email": "Customer_Service@crateandbarrel.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Creative Co-op", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "CRESTVIEW", "first": "Juli Almand", "last": "Sharple", "email": "juliannealmand@me.com", "phone": "(404) 316-0696", "website": None, "address": "4300 Concorde Rd", "city": "Memphis", "state": "Tennessee", "zip": "38118", "notes": None, "tags": None},
    {"company": "Currey & Co.", "first": "Betty", "last": "Robbins", "email": "brobbins@curryco.com", "phone": "404-295-3280", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Cyan", "first": "Robin", "last": "Clarke", "email": "rclarke526@gmail.com", "phone": "(912) 656-2757", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Delta", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "DESIGN DISTRICT", "first": "Sammi", "last": "Hight", "email": "sammi@designdistrictatl.com", "phone": "(770) 519-6690", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "HARDWARE"},
    {"company": "Design Tiles by Zumpano", "first": None, "last": None, "email": None, "phone": "770.449.3528", "website": "www.zumpano.com", "address": "6354 Warren Dr.", "city": "Norcross", "state": "Georgia", "zip": "30093", "notes": None, "tags": None},
    {"company": "Desky", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Doorman Design", "first": "Alex", "last": None, "email": "doorman.designs@gmail.com", "phone": "504.408.1616", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Easy Sugar", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Echholtz", "first": "Allison", "last": "Lerner", "email": "allisonsherrill25@gmail.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "EICHOLTZ", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Elegant Lighting", "first": "Marilyn", "last": "Caruso", "email": "marilyn@elegantlighting.com", "phone": "(678) 613-3176", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "ELK HOME", "first": None, "last": None, "email": "sales@elkhome.com", "phone": "(800) 613-3261", "website": "https://www.elkhome.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Furniture"},
    {"company": "Elon Tile & Stone", "first": None, "last": None, "email": "customerservice@elontile.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Emtek", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Etsy", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Feizy", "first": "Debbie", "last": "Milewski", "email": "debbie@milewskiassoc.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Ferguson", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Four Hands", "first": "Amanda", "last": "Mellington", "email": "amellington@fourhands.com", "phone": "(512) 767-4900", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Gabby Home", "first": "Julie", "last": "Young", "email": "julie@southerndesignlink.com", "phone": "(404) 849-0607", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "GIFT MARK", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Global Views", "first": "Charity", "last": "Queen", "email": "charity@anhunt.com", "phone": "404-351-5189", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Gracious Home", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Highland House", "first": "George", "last": "Leach", "email": "george@southernmarketgroup.com", "phone": "(336) 456-4050", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "HOLLY HUNT", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Home Depot", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Hooker", "first": "George", "last": "Leach", "email": "george@southernmarketgroup.com", "phone": "(678) 640-1775", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Horchow", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Hudson Valley Lighting", "first": "Janet", "last": "Woods", "email": "jwoods@creativebrandsllc.com", "phone": "404-351-5189", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Huff Harrington Fine Art", "first": "Meg", "last": "Huff", "email": "meg@huffharrington.com", "phone": "404-352-8510", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "IKEA", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "INTERLUDE HOME", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "JAMIE YOUNG", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "JD Staron", "first": "Phil", "last": "Hendricks", "email": "phil.hendricks@gmail.com", "phone": "(404) 863-5300", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Jill Rosenwald", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Jonathan Adler", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Joybird", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Kalco", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Kathy Kuo", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Kohler", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Kravet", "first": "Katie", "last": "Bendeck", "email": "kbendeck@yorkdesigngroup.com", "phone": "404-796-6745", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Lane Venture", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Lee Industries", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Leftbank Art", "first": "Susan", "last": "Brock", "email": "susan@leftbankart.com", "phone": "(770) 598-4880", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Loloi", "first": "Hunter", "last": "Hartsfield", "email": "hunter.hartsfield@surya.com", "phone": None, "website": "https://www.loloirugs.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Rugs"},
    {"company": "Lowe's", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "MacKenzie-Childs", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Made Goods", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Magnolia", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "McGee & Co", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Minka", "first": "Janet", "last": "Woods", "email": "jwoods@creativebrandsllc.com", "phone": "404-351-5189", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Miromar Home", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Mitzi", "first": "Janet", "last": "Woods", "email": "jwoods@creativebrandsllc.com", "phone": "404-351-5189", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Noir", "first": "Saralyn", "last": "Bell", "email": "saralyn@jdouglas.com", "phone": "(404) 355-3071", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Furniture"},
    {"company": "Nourison", "first": "Hunter", "last": "Hartsfield", "email": "hunter.hartsfield@surya.com", "phone": None, "website": "https://www.nourison.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Rugs"},
    {"company": "One Kings Lane", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Oomph", "first": "Tamara", "last": "Reber", "email": "tamara@southernjunction.com", "phone": "(404) 431-8878", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Paragon", "first": None, "last": None, "email": "info@paragonfurniture.com", "phone": "800-521-9114", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Phillip Jeffries", "first": "Katie", "last": "Bendeck", "email": "kbendeck@yorkdesigngroup.com", "phone": "404-796-6745", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Pier 1", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Pottery Barn", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Regina Andrew", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Rejuvenation", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Restoration Hardware", "first": "RH", "last": "Customer Service", "email": "customerservice@rh.com", "phone": "800-762-1005", "website": "https://rh.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Furniture"},
    {"company": "Robert Abbey", "first": "Janet", "last": "Woods", "email": "jwoods@creativebrandsllc.com", "phone": "404-351-5189", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Romo", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "ROWE FURNITURE", "first": "Greg", "last": "Poole", "email": "greg.poole@rowefurniture.com", "phone": "(404) 518-8418", "website": "http://www.rowefurniture.com", "address": "2121 Gardner St.", "city": "Elliston", "state": "VA", "zip": "24087", "notes": None, "tags": None},
    {"company": "SAFAVIEH", "first": "Christopher", "last": "Tung", "email": "christopher.tung@safavieh.com", "phone": "(516) 945-1900 ext. 1528", "website": "https://safavieh.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Saralyn Bell - J Douglas", "first": "Saralyn", "last": "Bell", "email": "saralyn@jdouglas.com", "phone": "(404) 355-3071", "website": None, "address": "240 Peachtree St NW Suite 13A. 1", "city": "Atlanta", "state": "Georgia", "zip": "30303", "notes": None, "tags": None},
    {"company": "Sarreid Ltd", "first": None, "last": None, "email": None, "phone": "(252) 291-1414", "website": "www.sarreid.com", "address": None, "city": None, "state": None, "zip": None, "notes": "Anhut & Associates", "tags": "Accessories,Furniture"},
    {"company": "Scout", "first": "Jules", "last": None, "email": "jules@scoutdesignstudio.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Serreid", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Sewing Salon", "first": "Luda", "last": "Thigpen", "email": None, "phone": "(678) 200-2527", "website": "Sewingsaloninc.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Somerset House", "first": None, "last": None, "email": "inquiries@somersethouse.com", "phone": "(800) 444-2540", "website": "www.somersethouse.com", "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Art"},
    {"company": "Southern Design Source", "first": "Melissa", "last": "Bennett", "email": "melissa@southerndesignsource.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Spicher & Company", "first": None, "last": None, "email": "ordering@spicherandco.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Stanton Carpet", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Stout", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Summer Classics", "first": "Dale", "last": "Boehm", "email": "DaleB@summerclassics.com", "phone": "205-358-9177", "website": None, "address": "3140 Pelham Parkway", "city": "Pelham", "state": "AL", "zip": "35124", "notes": None, "tags": "Outdoor Furniture"},
    {"company": "Sunpan", "first": "Lindsay", "last": "Sutterland", "email": "lindsay@sunpan.com", "phone": "(416) 736-0094", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Surya", "first": "Hunter", "last": "Hartsfield", "email": "hunter.hartsfield@surya.com", "phone": None, "website": "https://www.surya.com", "address": "1 Surya Drive", "city": "White", "state": "Georgia", "zip": "30184", "notes": None, "tags": "Rugs,Furniture"},
    {"company": "TESORO", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "The Basket Lady", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "The Tile Shop", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "The White Company", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Tile and Mosaic Depot", "first": None, "last": None, "email": "sales@tileandmosaicdepot.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Top Knobs", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "TOV", "first": "Caren", "last": "Rubin", "email": "caren@tovfurniture.com", "phone": "516-407-2099", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "TROY SIMS", "first": "Troy", "last": "Sims", "email": None, "phone": "(404) 293-6432", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": "FINE PAINTS OF EUROPE PAINTER", "tags": "PAINTING"},
    {"company": "Up Country", "first": "Lindsay", "last": None, "email": "uchadac@upcountryhome.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Uttermost", "first": "Debbie", "last": "Milewski", "email": "debbie@milewskiassoc.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Villa & House", "first": "Saralyn", "last": "Bell", "email": "saralyn@jdouglas.com", "phone": "(404) 403-4256", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": "Furniture"},
    {"company": "Visual Comfort & Co.", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Walmart", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Wayfair", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Wendover Art", "first": None, "last": None, "email": "info@wendoverart.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "West Elm", "first": "West", "last": "Elm", "email": "WE@gmail.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "WILDWOOD HOME", "first": None, "last": None, "email": "DONTKNOW@GMAIL.COM", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "WILLIAMS SONOMA", "first": "WILLIAMS", "last": "SONOMA", "email": "WS@GMAI.COM", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "Worlds Away", "first": None, "last": None, "email": None, "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "YORK", "first": "Katie", "last": "Bendeck", "email": "kbendeck@yorkdesigngroup.com", "phone": "404-796-6745", "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
    {"company": "ZEEV", "first": "Nancy", "last": "Story", "email": "nancy@adlerlighting.com", "phone": None, "website": None, "address": None, "city": None, "state": None, "zip": None, "notes": None, "tags": None},
]

async def import_vendors():
    """Import all vendors into master_contacts and master_materials"""
    print("=" * 60)
    print("IMPORTING USER'S VENDOR LIST")
    print("=" * 60)
    
    contacts_count = 0
    materials_count = 0
    
    for vendor in VENDORS:
        company = vendor.get("company", "").strip()
        if not company:
            continue
            
        # Create full name from first/last
        first = vendor.get("first") or ""
        last = vendor.get("last") or ""
        full_name = f"{first} {last}".strip() if first or last else None
        
        # Build address string
        address_parts = []
        if vendor.get("address"):
            address_parts.append(vendor.get("address"))
        if vendor.get("city"):
            address_parts.append(vendor.get("city"))
        if vendor.get("state"):
            address_parts.append(vendor.get("state"))
        if vendor.get("zip"):
            address_parts.append(vendor.get("zip"))
        full_address = ", ".join(address_parts) if address_parts else None
        
        # Insert into master_contacts (primary contact database)
        existing_contact = await db.master_contacts.find_one({"company": company})
        if not existing_contact:
            contact_doc = {
                "id": str(uuid.uuid4()),
                "name": full_name or company,
                "company": company,
                "role": "Vendor",
                "email": vendor.get("email"),
                "phone": vendor.get("phone"),
                "website": vendor.get("website"),
                "address": full_address,
                "notes": vendor.get("notes"),
                "tags": vendor.get("tags").split(",") if vendor.get("tags") else [],
                "type": "vendor",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_contacts.insert_one(contact_doc)
            contacts_count += 1
            
        # Also insert into master_materials as vendor entry
        existing_material = await db.master_materials.find_one({"name": company, "is_vendor": True})
        if not existing_material:
            material_doc = {
                "id": str(uuid.uuid4()),
                "name": company,
                "category": "vendor",
                "is_vendor": True,
                "website": vendor.get("website"),
                "contact_email": vendor.get("email"),
                "contact_phone": vendor.get("phone"),
                "contact_name": full_name,
                "notes": vendor.get("notes"),
                "tags": vendor.get("tags").split(",") if vendor.get("tags") else ["vendor"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.master_materials.insert_one(material_doc)
            materials_count += 1
    
    print(f"✅ Contacts imported: {contacts_count}")
    print(f"✅ Materials (vendors) imported: {materials_count}")
    
    # Final counts
    total_contacts = await db.master_contacts.count_documents({})
    total_materials = await db.master_materials.count_documents({})
    print(f"\n📊 Total contacts in database: {total_contacts}")
    print(f"📊 Total materials in database: {total_materials}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(import_vendors())
