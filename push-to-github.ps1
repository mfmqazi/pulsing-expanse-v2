# Quick Push Script for pulsing-expanse-v2
# Run this after creating the GitHub repository

# Navigate to the project
cd "c:/Users/Musaddique Qazi/.gemini/antigravity/playground/pulsing-expanse-v2"

# Add the remote repository
git remote add origin https://github.com/mfmqazi/pulsing-expanse-v2.git

# Rename branch to main (GitHub's default)
git branch -M main

# Push to GitHub
git push -u origin main

Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "🌐 Repository: https://github.com/mfmqazi/pulsing-expanse-v2" -ForegroundColor Cyan
