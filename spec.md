# VIBECHAIN

## Current State
The VibeFeed page shows all users' vibe entries via `getVibeFeed()`. There is no way for a user to filter the feed to see only their own posts.

## Requested Changes (Diff)

### Add
- Tab toggle on the VibeFeed page: "Everyone" and "My Vibes"
- "My Vibes" tab filters the feed to show only entries matching the logged-in user's username (from `getCallerUserProfile()`)
- Empty state for "My Vibes" when the user has no posts

### Modify
- VibeFeed page to include tab UI and filtered rendering logic

### Remove
Nothing removed

## Implementation Plan
1. Import `useCallerProfile` in VibeFeed page
2. Add a tab state ("everyone" | "mine") with a styled toggle
3. When "My Vibes" is selected, filter `feed` entries where `entry.username === profile?.username`
4. Show a relevant empty state when no personal entries exist
5. Only show the tab toggle when the user is authenticated (has a profile)
