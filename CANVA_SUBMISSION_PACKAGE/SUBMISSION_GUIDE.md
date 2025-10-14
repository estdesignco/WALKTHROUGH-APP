# 🚀 CANVA APP SUBMISSION - STEP-BY-STEP GUIDE

## 📋 BEFORE YOU START

### You Need:
1. ✅ Canva account
2. ✅ Production backend URL (not localhost)
3. ✅ App icon (512x512px PNG)
4. ✅ 3-5 screenshots (1280x800px)
5. ✅ Privacy policy URL
6. ✅ Terms of service URL

---

## STEP 1: CREATE DEVELOPER ACCOUNT

1. Go to https://www.canva.dev/
2. Click "Sign Up" or "Log In"
3. Complete developer registration
4. Verify email

---

## STEP 2: UPDATE BACKEND URL FOR PRODUCTION

### In `/CANVA_APP/src/app.tsx`:

**FIND THIS LINE (around line 20):**
```typescript
const BACKEND_URL = "https://designhub-74.preview.emergentagent.com";
```

**CHANGE TO YOUR PRODUCTION URL:**
```typescript
const BACKEND_URL = "https://your-production-domain.com";
```

**IMPORTANT**: Remove `/api` suffix - the code adds it automatically!

---

## STEP 3: BUILD PRODUCTION VERSION

```bash
cd CANVA_APP
npm install
npm run build
```

This creates a `dist/` folder with compiled app.

---

## STEP 4: CREATE NEW APP IN CANVA

1. Go to https://www.canva.dev/apps
2. Click "Create app"
3. Choose "App SDK"
4. Fill in:
   - **App name**: Interior Design Live Checklist
   - **App type**: Editor Extension
   - **Description**: See README.md for full description

---

## STEP 5: UPLOAD YOUR CODE

### Using Canva CLI (Recommended):

```bash
npm install -g @canva/cli
canva login
canva upload
```

### Manual Upload:
1. Zip the `dist/` folder
2. Upload via Canva Developer Portal
3. Wait for processing

---

## STEP 6: CONFIGURE PERMISSIONS

In your app settings, enable:

- ✅ `canva:design:content:read` - Read design content
- ✅ `canva:design:content:write` - Write design content (future feature)
- ✅ External URLs - To connect to your backend

**Add your backend domain** to allowed external URLs:
```
https://your-production-domain.com
```

---

## STEP 7: TEST IN PREVIEW MODE

1. Click "Preview" in developer portal
2. Open a Canva design
3. Find your app in "Apps" menu
4. Test all features:
   - [ ] Project loads
   - [ ] Room selection works
   - [ ] Items display correctly
   - [ ] Status updates sync
   - [ ] Links open
   - [ ] Collapse/expand works
   - [ ] Real-time sync works

---

## STEP 8: PREPARE SCREENSHOTS

### Take these screenshots while app is running:

1. **Main View** - Show full checklist with items
2. **Room Navigation** - Multiple rooms visible
3. **Status Update** - Dropdown menu open
4. **Sync Indicator** - Show "Synced" status
5. **Category View** - Some collapsed, some expanded

### Screenshot Requirements:
- Resolution: 1280x800px
- Format: PNG or JPG
- Clear, high-quality
- Show actual data (not placeholder)
- Professional appearance

---

## STEP 9: CREATE APP ICON

### Requirements:
- Size: 512x512px
- Format: PNG with transparency
- Style: Simple, recognizable
- Colors: Match your brand

### Suggested Design:
- Use a checklist icon + design elements
- Interior design themed
- Professional appearance

### Tools:
- Canva (ironically! 😄)
- Figma
- Photoshop
- Online icon generators

---

## STEP 10: PREPARE LEGAL DOCUMENTS

### Privacy Policy
Must include:
- What data you collect
- How you use it
- How you store it
- How users can delete data
- Contact information

**Template**: https://www.termsfeed.com/privacy-policy-generator/

### Terms of Service
Must include:
- Acceptable use
- User obligations
- Liability limitations
- Termination conditions

**Template**: https://www.termsfeed.com/terms-service-generator/

**Host these on your website or use a service like:**
- https://www.iubenda.com/
- https://www.termly.io/

---

## STEP 11: FILL OUT SUBMISSION FORM

### Basic Information:
- **App Name**: Interior Design Live Checklist
- **Tagline**: Real-time project checklist sync for interior designers
- **Category**: Productivity

### Description (Max 500 characters):
```
Transform your interior design workflow with live checklist integration. View and update project items directly in Canva with real-time sync to your master checklist. Features: Real-time bidirectional sync, Room and category organization, Status tracking with visual indicators, Quick product link access, Dark professional UI, Automatic persistence across sessions.
```

### Long Description:
```
Interior Design Live Checklist brings your project management directly into Canva, eliminating the need to switch between applications.

KEY FEATURES:

✅ REAL-TIME SYNC
Changes made in Canva or your main checklist sync automatically every 5 seconds. Your team always sees the latest updates.

✅ ORGANIZED BY ROOM
Navigate through your project rooms with ease. Living Room, Kitchen, Bedroom - all in one place.

✅ CATEGORY MANAGEMENT
Collapse and expand categories like Furniture, Lighting, Textiles for a clean, organized view.

✅ STATUS TRACKING
Update item status with visual color coding:
- Pending (gray)
- Picked (green)
- Ordered (blue)
- Delivered (gold)
- And more!

✅ QUICK PRODUCT ACCESS
Click product links to view items instantly without leaving Canva.

✅ PROFESSIONAL DESIGN
Dark, elegant UI designed specifically for interior designers.

✅ PERSISTENT STATE
App remembers your last project and room selection.

PERFECT FOR:
- Interior Designers
- Design Firms
- Project Managers
- FF&E Procurement

REQUIREMENTS:
- Active subscription to Interior Design Management System
- Project ID from your account

Get started today and streamline your design workflow!
```

### Support Information:
- **Support Email**: [Your email]
- **Website**: [Your website]
- **Privacy Policy**: [URL]
- **Terms of Service**: [URL]

---

## STEP 12: UPLOAD ASSETS

1. **App Icon**: 512x512px PNG
2. **Screenshots**: 3-5 images at 1280x800px
3. **Optional**: Demo video (MP4, max 30 seconds)

---

## STEP 13: SUBMIT FOR REVIEW

1. Review all information carefully
2. Check "I agree to terms"
3. Click "Submit for Review"
4. Note your submission ID

---

## STEP 14: WAIT FOR REVIEW

### Timeline:
- Initial review: 3-5 business days
- Full review: 1-2 weeks
- Possible back-and-forth: Add 1 week

### What Canva Checks:
- ✅ App functionality
- ✅ Security & privacy
- ✅ Performance
- ✅ UI/UX quality
- ✅ Content guidelines compliance
- ✅ Terms of service

### You'll Receive:
- Email notification
- Feedback if changes needed
- Approval or rejection with reasons

---

## STEP 15: RESPOND TO FEEDBACK (if needed)

### Common Requests:
1. **Better error handling** - Add try-catch blocks
2. **Loading states** - Show spinners/progress
3. **Empty states** - Handle no data gracefully
4. **Clearer permissions** - Explain why you need them
5. **Privacy improvements** - Add data encryption info

### How to Update:
1. Make requested changes
2. Test thoroughly
3. Build new version
4. Upload via CLI: `canva upload`
5. Add notes explaining changes
6. Resubmit

---

## STEP 16: LAUNCH! 🎉

### Once Approved:
1. ✅ App appears in Canva Marketplace
2. ✅ Users can install with one click
3. ✅ Starts appearing in search
4. ✅ Can be featured by Canva

### Promote Your App:
- Share on social media
- Email your users
- Create tutorial videos
- Blog about it
- Submit to design communities

---

## 📊 POST-LAUNCH

### Monitor:
- User reviews and ratings
- Installation numbers
- Bug reports
- Feature requests

### Maintain:
- Fix bugs promptly
- Release updates regularly
- Respond to user feedback
- Keep documentation updated

### Iterate:
- Add requested features
- Improve performance
- Enhance UI/UX
- Stay current with Canva SDK updates

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: "CORS Error"
**Solution**: Add Canva domains to your backend CORS settings:
```python
CORS(
    app,
    origins=[
        "https://www.canva.com",
        "https://*.canva-apps.com",
        "https://*.canva.com"
    ]
)
```

### Issue: "App won't load"
**Solution**: Check:
1. Backend URL is correct
2. Backend is running and accessible
3. HTTPS is enabled
4. No console errors

### Issue: "Permission denied"
**Solution**: Ensure permissions are declared in `canva-app.json`

### Issue: "Slow performance"
**Solution**: 
1. Reduce sync frequency
2. Optimize API calls
3. Add caching
4. Minimize re-renders

---

## 📞 NEED HELP?

- **Canva Developer Docs**: https://www.canva.dev/docs/
- **Canva Developer Forum**: https://forum.canva.dev/
- **Canva Support**: devrel@canva.com
- **Stack Overflow**: Tag `canva-apps`

---

## ✅ FINAL CHECKLIST

Before submitting:

- [ ] Backend URL updated to production
- [ ] App builds without errors
- [ ] All features tested in preview
- [ ] Screenshots prepared (1280x800px)
- [ ] App icon created (512x512px)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email configured
- [ ] Submission form completed
- [ ] Assets uploaded
- [ ] Legal checkboxes reviewed
- [ ] Team notified of submission

---

**YOU'RE READY TO SUBMIT! GOOD LUCK! 🚀**
