// EMERGENCY FIX - Replace all walkthrough headers
import { execSync } from 'child_process';

// Fix all possible components
const filesToFix = [
  'SimpleWalkthroughSpreadsheet.js',
  'ExactWalkthroughSpreadsheet.js', 
  'WalkthroughFFE.js',
  'WalkthroughSpreadsheet.js',
  'ExactFFESpreadsheet_BACKUP_DRAGDROP.js'
];

filesToFix.forEach(file => {
  try {
    // Replace ITEM with INSTALLED in headers
    execSync(`sed -i 's/>ITEM</>INSTALLED</g' /app/frontend/src/components/${file}`);
    
    // Replace REMARKS with VENDOR/SKU in headers
    execSync(`sed -i 's/>REMARKS</>VENDOR\/SKU</g' /app/frontend/src/components/${file}`);
    
    console.log(`Fixed headers in ${file}`);
  } catch (e) {
    console.log(`${file} not found, skipping`);
  }
});