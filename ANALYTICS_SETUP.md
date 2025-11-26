# Google Analytics Setup Instructions

## How to Enable Analytics for Your Quran Memorization App

I've added Google Analytics 4 (GA4) tracking code to your website. Follow these steps to complete the setup:

### Step 1: Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring" or "Admin" (gear icon)

### Step 2: Set Up a Property

1. Click "Create Property"
2. Enter property details:
   - **Property name**: Al-Hafiz Quran App (or your preferred name)
   - **Reporting time zone**: Select your timezone
   - **Currency**: Select your currency
3. Click "Next"

### Step 3: Set Up a Data Stream

1. Select "Web" as the platform
2. Enter your website details:
   - **Website URL**: `https://mfmqazi.github.io`
   - **Stream name**: Al-Hafiz Production
3. Click "Create stream"

### Step 4: Get Your Measurement ID

1. After creating the stream, you'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
2. Copy this ID

### Step 5: Update Your Code

1. Open `index.html` in your project
2. Find **both** instances of `G-XXXXXXXXXX` (there are 2 places)
3. Replace them with your actual Measurement ID
4. Save the file

Example:
```html
<!-- Before -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  gtag('config', 'G-XXXXXXXXXX');
</script>

<!-- After (with your actual ID) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123DEF4"></script>
<script>
  gtag('config', 'G-ABC123DEF4');
</script>
```

### Step 6: Deploy Your Changes

Run these commands:
```bash
git add .
git commit -m "Add Google Analytics tracking"
git push
npm run deploy
```

### Step 7: Verify Analytics is Working

1. Go to your Google Analytics dashboard
2. Navigate to Reports → Realtime
3. Visit your website: https://mfmqazi.github.io/pulsing-expanse-v2/
4. You should see your visit appear in the Realtime report within a few seconds

## What Analytics Will Track

Google Analytics will automatically track:
- **Page views**: Which pages users visit
- **User sessions**: How long users stay on your site
- **User demographics**: Location, device type, browser
- **User behavior**: Navigation paths, engagement time
- **Events**: Button clicks, form submissions (can be customized)

## Privacy Considerations

- Google Analytics is GDPR compliant when configured properly
- Consider adding a privacy policy to your website
- You may want to add a cookie consent banner for EU users

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Use the [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger)
3. Refer to [Google Analytics Help Center](https://support.google.com/analytics)
