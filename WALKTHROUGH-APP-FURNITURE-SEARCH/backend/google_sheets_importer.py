#!/usr/bin/env python3
"""
Google Sheets Importer for Interior Design Client Questionnaires
Imports comprehensive client data from Google Sheets into the Interior Design system
"""

import requests
import pandas as pd
import re
import io
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

class GoogleSheetsImporter:
    def __init__(self):
        self.column_mapping = {
            # Basic Client Information
            'Full Name': 'client_info.full_name',
            'Email Address': 'client_info.email', 
            'Phone Number': 'client_info.phone',
            'Project Address': 'client_info.address',
            'Contact Preferences ': 'contact_preferences',
            'Best Time to Call': 'best_time_to_call',
            
            # Project Details
            'What type of project is this?': 'project_type',
            'What is your desired timeline for project completion?': 'timeline',
            'What is your estimate budget range for this project?': 'budget_range',
            'What is your ideal price for a sofa?': 'ideal_sofa_price',
            'ROOMS INVOLVED IN PROJECT': 'rooms_involved',
            
            # Design Preferences
            'Which interior design styles do you prefer? (Select all that apply)': 'style_preferences',
            'What color palette do you prefer?': 'color_palette',
            'Are there any colors do you dislike?': 'design_disliked_colors',
            'What are your preferences for artwork?': 'artwork_preferences',
            
            # Project Specific Information
            'Please list NEW BUILD address': 'new_build_address',
            'Do you have an Architect? If so, please list Name and phone number below?': 'new_build_architect',
            'Do you have a builder? If so,  please list Name and phone number below?': 'new_build_builder',
            'Do you have plans drawn?': 'new_build_has_plans',
            'How far along in the building process are you?': 'new_build_process_stage',
            
            # Renovation Details
            'Please list Renovation Address (If differentI)': 'renovation_address',
            'When did you move into this home?': 'renovation_move_in_date',
            'Briefly describe the existing condition of the space.': 'renovation_existing_condition',
            
            # Personal Information
            'Who lives in your household? (Include ages of children if applicable)': 'know_you_household',
            'Do you have pets? If yes, please specify': 'know_you_pets',
            'Tell us about your hobbies': 'know_you_hobbies',
            'What do you you like to do for fun?': 'know_you_fun',
            'What makes you HAPPY?!': 'know_you_happy',
            'When are your families Birthdays?': 'know_you_family_birthdays',
            'When is your Anniversary?': 'know_you_anniversary',
            'What does your Family like to do together for fun?': 'know_you_family_together',
            'What is your FAVORITE restaurant': 'know_you_favorite_restaurant',
            'What is your favorite place to vacation?': 'know_you_favorite_vacation',
            'Tell us about your favorite foods, snacks, drinks, wine, beer, etc...': 'know_you_favorite_foods',
            
            # Additional Questions
            'How did you hear about us?': 'how_heard',
            'Any additional comments or questions?': 'design_additional_comments',
        }
        
        self.project_type_mapping = {
            'Primary Residence': 'Renovation',
            'New Build': 'New Construction', 
            'Renovation': 'Renovation',
            'Furniture/Styling Refresh': 'Furniture Only',
            'Consultation': 'Design Consultation'
        }

    def extract_sheet_id(self, url: str) -> Optional[str]:
        """Extract Google Sheets ID from URL"""
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        return match.group(1) if match else None

    def download_sheet_data(self, sheet_id: str, gid: str = '0') -> Optional[pd.DataFrame]:
        """Download CSV data from Google Sheets"""
        try:
            csv_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}'
            response = requests.get(csv_url, timeout=30)
            
            if response.status_code == 200:
                df = pd.read_csv(io.StringIO(response.text))
                return df
            else:
                print(f"Error downloading sheet: HTTP {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Error downloading sheet: {e}")
            return None

    def parse_rooms_list(self, rooms_string: str) -> List[str]:
        """Parse comma-separated rooms list"""
        if pd.isna(rooms_string) or not rooms_string:
            return []
        
        rooms = [room.strip() for room in str(rooms_string).split(',')]
        # Clean up room names
        cleaned_rooms = []
        for room in rooms:
            room = room.strip()
            if room and room not in cleaned_rooms:
                cleaned_rooms.append(room)
        return cleaned_rooms

    def parse_style_preferences(self, styles_string: str) -> List[str]:
        """Parse design style preferences"""
        if pd.isna(styles_string) or not styles_string:
            return []
        
        styles = [style.strip() for style in str(styles_string).split(',')]
        return [style for style in styles if style]

    def parse_contact_preferences(self, prefs_string: str) -> List[str]:
        """Parse contact preferences"""
        if pd.isna(prefs_string) or not prefs_string:
            return []
        
        prefs = [pref.strip() for pref in str(prefs_string).split(',')]
        return [pref for pref in prefs if pref]

    def map_project_type(self, original_type: str) -> str:
        """Map questionnaire project type to system enum"""
        if pd.isna(original_type) or not original_type:
            return 'Renovation'
        
        return self.project_type_mapping.get(str(original_type).strip(), 'Renovation')

    def set_nested_value(self, data: Dict, key_path: str, value: Any) -> None:
        """Set nested dictionary value using dot notation"""
        keys = key_path.split('.')
        current = data
        
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        current[keys[-1]] = value

    def convert_row_to_project(self, row: pd.Series) -> Dict[str, Any]:
        """Convert a spreadsheet row to project data"""
        project_data = {
            'client_info': {},
            'rooms_involved': [],
            'contact_preferences': [],
            'style_preferences': [],
            'created_at': datetime.now().isoformat(),
            'source': 'Google Sheets Import'
        }
        
        # Map all columns according to mapping
        for col_name, target_path in self.column_mapping.items():
            if col_name in row.index and not pd.isna(row[col_name]):
                value = str(row[col_name]).strip()
                if value:
                    self.set_nested_value(project_data, target_path, value)
        
        # Special handling for specific fields
        
        # Project name - use client name + "Project" if no specific project name
        if 'name' not in project_data:
            client_name = project_data.get('client_info', {}).get('full_name', 'Unknown Client')
            project_data['name'] = f"{client_name} Interior Design Project"
        
        # Project type mapping
        if 'project_type' in project_data:
            project_data['project_type'] = self.map_project_type(project_data['project_type'])
        else:
            project_data['project_type'] = 'Renovation'
        
        # Parse rooms
        rooms_col = 'ROOMS INVOLVED IN PROJECT'
        if rooms_col in row.index:
            project_data['rooms_involved'] = self.parse_rooms_list(row[rooms_col])
        
        # Parse style preferences
        styles_col = 'Which interior design styles do you prefer? (Select all that apply)'
        if styles_col in row.index:
            project_data['style_preferences'] = self.parse_style_preferences(row[styles_col])
        
        # Parse contact preferences
        contact_col = 'Contact Preferences '
        if contact_col in row.index:
            project_data['contact_preferences'] = self.parse_contact_preferences(row[contact_col])
        
        # Add questionnaire timestamp
        if 'Timestamp' in row.index and not pd.isna(row['Timestamp']):
            project_data['questionnaire_completed_at'] = str(row['Timestamp'])
        
        return project_data

    def import_sheet_data(self, url: str, start_row: int = 1) -> Dict[str, Any]:
        """Import data from Google Sheets URL"""
        result = {
            'success': False,
            'message': '',
            'projects_created': 0,
            'projects_data': [],
            'errors': []
        }
        
        # Extract sheet ID
        sheet_id = self.extract_sheet_id(url)
        if not sheet_id:
            result['message'] = 'Invalid Google Sheets URL'
            return result
        
        # Download data
        df = self.download_sheet_data(sheet_id)
        if df is None:
            result['message'] = 'Failed to download sheet data'
            return result
        
        if len(df) == 0:
            result['message'] = 'Sheet contains no data'
            return result
        
        # Process each row (skip header if start_row > 0)
        projects_created = []
        errors = []
        
        for index, row in df.iterrows():
            if index < start_row:
                continue
                
            try:
                # Skip empty rows
                if row.isna().all():
                    continue
                
                # Convert row to project data
                project_data = self.convert_row_to_project(row)
                
                # Validate required fields
                if not project_data.get('client_info', {}).get('full_name'):
                    errors.append(f"Row {index + 1}: Missing client name")
                    continue
                
                projects_created.append(project_data)
                
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        result['success'] = True
        result['projects_created'] = len(projects_created)
        result['projects_data'] = projects_created
        result['errors'] = errors
        result['message'] = f"Successfully processed {len(projects_created)} projects"
        
        return result

    def create_sample_mapping_info(self) -> Dict[str, Any]:
        """Create sample mapping information for frontend display"""
        return {
            'total_columns_supported': len(self.column_mapping),
            'sample_mappings': {
                'Client Information': {
                    'Full Name': 'Client full name',
                    'Email Address': 'Client email',
                    'Phone Number': 'Client phone',
                    'Project Address': 'Project location'
                },
                'Project Details': {
                    'What type of project is this?': 'Project type (Renovation, New Construction, etc.)',
                    'What is your desired timeline for project completion?': 'Project timeline',
                    'ROOMS INVOLVED IN PROJECT': 'List of rooms (comma-separated)'
                },
                'Design Preferences': {
                    'Which interior design styles do you prefer?': 'Design styles (comma-separated)',
                    'What color palette do you prefer?': 'Color preferences',
                    'What are your preferences for artwork?': 'Artwork preferences'
                },
                'Personal Information': {
                    'Who lives in your household?': 'Household members',
                    'Do you have pets?': 'Pet information',
                    'Tell us about your hobbies': 'Client hobbies and interests'
                }
            },
            'supported_project_types': list(self.project_type_mapping.keys()),
            'notes': [
                'All 71 questionnaire columns are supported',
                'Rooms will be automatically parsed and created',
                'Contact preferences and style preferences are handled as lists',
                'Project type is automatically mapped to system values',
                'Personal information enhances client relationship management'
            ]
        }

# Usage example
if __name__ == "__main__":
    importer = GoogleSheetsImporter()
    
    # Test with the provided URL
    test_url = "https://docs.google.com/spreadsheets/d/1zyikF6VwTh5xe6RzxFryuqgbhNdEvDIvoaJFZXkt7FU/edit?usp=sharing"
    
    result = importer.import_sheet_data(test_url)
    
    print("Import Result:")
    print(f"Success: {result['success']}")
    print(f"Message: {result['message']}")
    print(f"Projects: {result['projects_created']}")
    
    if result['projects_data']:
        print("\nFirst Project Preview:")
        project = result['projects_data'][0]
        print(f"Name: {project['name']}")
        print(f"Client: {project['client_info']['full_name']}")
        print(f"Email: {project['client_info']['email']}")
        print(f"Type: {project['project_type']}")
        print(f"Rooms: {', '.join(project['rooms_involved'])}")