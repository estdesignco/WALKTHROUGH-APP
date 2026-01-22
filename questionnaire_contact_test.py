#!/usr/bin/env python3
"""
TEST QUESTIONNAIRE CONTACT AUTO-CREATION
=========================================
Test if contacts are actually being created when questionnaire is saved.

Test Data:
- client_name: "Sarah Thompson"
- email: "sarah@test.com"
- phone: "615-555-1234"
- spouse_partner_name: "Michael Thompson"
- spouse_partner_phone: "615-555-5678"
- new_build_architect: "Lisa Chen: 615-555-9999"
- new_build_builder: "Tom Builder: 615-555-8888"
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://app-stability-fix-4.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

def print_section(title):
    """Print formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_questionnaire_contact_creation():
    """Test complete questionnaire contact auto-creation workflow"""
    
    print_section("QUESTIONNAIRE CONTACT AUTO-CREATION TEST")
    
    # Step 1: Create a test project
    print("📋 STEP 1: Creating test project...")
    project_data = {
        "name": "Contact Auto-Creation Test Project",
        "client_info": {
            "full_name": "Sarah Thompson",
            "email": "sarah@test.com",
            "phone": "615-555-1234",
            "address": "123 Test St, Nashville, TN 37201"
        },
        "project_type": "New Construction",
        "timeline": "6-12 months",
        "budget": "$150,000"
    }
    
    try:
        response = requests.post(f"{API_BASE}/projects", json=project_data, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ FAILED to create project: {response.text}")
            return False
        
        project = response.json()
        project_id = project.get('id')
        print(f"   ✅ Project created: {project_id}")
        print(f"   Project name: {project.get('name')}")
        
    except Exception as e:
        print(f"   ❌ ERROR creating project: {str(e)}")
        return False
    
    # Step 2: Save questionnaire with contact data
    print("\n📝 STEP 2: Saving questionnaire with contact data...")
    questionnaire_data = {
        "answers": {
            "client_name": "Sarah Thompson",
            "email": "sarah@test.com",
            "phone": "615-555-1234",
            "spouse_partner_name": "Michael Thompson",
            "spouse_partner_phone": "615-555-5678",
            "new_build_architect": "Lisa Chen: 615-555-9999",
            "new_build_builder": "Tom Builder: 615-555-8888"
        },
        "completed_at": datetime.utcnow().isoformat(),
        "completion_percentage": 100
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/questionnaire/{project_id}",
            json=questionnaire_data,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ FAILED to save questionnaire: {response.text}")
            return False
        
        result = response.json()
        print(f"   ✅ Questionnaire saved successfully")
        print(f"   Response: {json.dumps(result, indent=2)}")
        
    except Exception as e:
        print(f"   ❌ ERROR saving questionnaire: {str(e)}")
        return False
    
    # Step 3: Retrieve contacts for the project
    print("\n🔍 STEP 3: Checking if contacts were created in database...")
    try:
        response = requests.get(f"{API_BASE}/contacts/project/{project_id}", timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ FAILED to retrieve contacts: {response.text}")
            return False
        
        contacts = response.json()
        print(f"   ✅ Retrieved {len(contacts)} contacts")
        
    except Exception as e:
        print(f"   ❌ ERROR retrieving contacts: {str(e)}")
        return False
    
    # Step 4: Verify expected contacts were created
    print("\n✅ STEP 4: Verifying contact auto-creation...")
    
    expected_contacts = {
        "Client": {"name": "Sarah Thompson", "phone": "615-555-1234", "email": "sarah@test.com"},
        "Spouse/Partner": {"name": "Michael Thompson", "phone": "615-555-5678"},
        "Architect": {"name": "Lisa Chen", "phone": "615-555-9999"},
        "Builder": {"name": "Tom Builder", "phone": "615-555-8888"}
    }
    
    found_contacts = {}
    all_passed = True
    
    print(f"\n   Expected {len(expected_contacts)} contacts to be created:")
    for role, expected in expected_contacts.items():
        print(f"\n   🔎 Looking for {role}: {expected['name']}")
        
        # Find contact by role
        matching_contacts = [c for c in contacts if c.get('role') == role]
        
        if not matching_contacts:
            print(f"      ❌ MISSING: No {role} contact found!")
            all_passed = False
            continue
        
        contact = matching_contacts[0]
        found_contacts[role] = contact
        
        # Verify name
        if contact.get('name') == expected['name']:
            print(f"      ✅ Name matches: {contact.get('name')}")
        else:
            print(f"      ❌ Name mismatch: Expected '{expected['name']}', got '{contact.get('name')}'")
            all_passed = False
        
        # Verify phone
        if contact.get('phone') == expected['phone']:
            print(f"      ✅ Phone matches: {contact.get('phone')}")
        else:
            print(f"      ❌ Phone mismatch: Expected '{expected['phone']}', got '{contact.get('phone')}'")
            all_passed = False
        
        # Verify email (only for Client)
        if role == "Client":
            if contact.get('email') == expected.get('email'):
                print(f"      ✅ Email matches: {contact.get('email')}")
            else:
                print(f"      ❌ Email mismatch: Expected '{expected.get('email')}', got '{contact.get('email')}'")
                all_passed = False
    
    # Step 5: Display all contacts found
    print("\n📊 STEP 5: All contacts in database:")
    for i, contact in enumerate(contacts, 1):
        print(f"\n   Contact {i}:")
        print(f"      ID: {contact.get('id')}")
        print(f"      Name: {contact.get('name')}")
        print(f"      Role: {contact.get('role')}")
        print(f"      Phone: {contact.get('phone')}")
        print(f"      Email: {contact.get('email')}")
        print(f"      Company: {contact.get('company')}")
        print(f"      Notes: {contact.get('notes')}")
    
    # Final result
    print_section("TEST RESULT")
    
    if all_passed and len(contacts) == len(expected_contacts):
        print("✅ ✅ ✅ CONTACT AUTO-CREATION IS WORKING! ✅ ✅ ✅")
        print(f"\nAll {len(expected_contacts)} expected contacts were created correctly:")
        print("   ✅ Client: Sarah Thompson (615-555-1234, sarah@test.com)")
        print("   ✅ Spouse/Partner: Michael Thompson (615-555-5678)")
        print("   ✅ Architect: Lisa Chen (615-555-9999)")
        print("   ✅ Builder: Tom Builder (615-555-8888)")
        return True
    else:
        print("❌ ❌ ❌ CONTACT AUTO-CREATION IS BROKEN! ❌ ❌ ❌")
        print(f"\nExpected {len(expected_contacts)} contacts, found {len(contacts)}")
        
        if len(contacts) < len(expected_contacts):
            print("\n⚠️  MISSING CONTACTS:")
            for role in expected_contacts:
                if role not in found_contacts:
                    print(f"   ❌ {role}: {expected_contacts[role]['name']}")
        
        if not all_passed:
            print("\n⚠️  CONTACT DATA ISSUES:")
            print("   Some contacts were created but with incorrect data")
        
        return False

if __name__ == "__main__":
    try:
        success = test_questionnaire_contact_creation()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
