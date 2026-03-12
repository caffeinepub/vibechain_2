# VIBECHAIN

## Current State
The app has a MoodSelector page where users manually pick from 8 moods, and a SongSearchPage to find songs via the iTunes API. There is no camera-based emotion detection.

## Requested Changes (Diff)

### Add
- A new `EmotionDetect` page/component (`/detect-mood`) that:
  - Uses the device camera via the `camera` Caffeine component
  - Loads `face-api.js` (tiny face detection + expression recognition models from CDN/npm)
  - Streams live camera feed, detects dominant facial expression (happy, sad, angry, surprised, disgusted, fearful, neutral)
  - Maps detected emotion -> one of the 8 VIBECHAIN moods
  - Shows a real-time emotion overlay on the camera feed
  - When confident emotion detected, displays result and offers "Use This Mood" button that navigates to song picker
- A "Detect My Vibe" button/entry point on the MoodSelector page that links to `/detect-mood`

### Modify
- `MoodSelector.tsx`: Add a prominent "Detect My Vibe" camera button at the top of the page
- `App.tsx`: Register the new `/detect-mood` route

### Remove
- Nothing removed

## Implementation Plan
1. Install `face-api.js` npm package in the frontend
2. Create `src/frontend/src/pages/EmotionDetectPage.tsx`:
   - Camera stream via getUserMedia
   - face-api.js tiny models loaded from CDN (tinyFaceDetector + faceExpressionNet)
   - Emotion -> mood mapping utility
   - Real-time detection loop with requestAnimationFrame
   - Confidence threshold display, "Use This Mood" CTA
3. Update `MoodSelector.tsx` to add "Detect My Vibe" entry button
4. Update `App.tsx` to add the new route
