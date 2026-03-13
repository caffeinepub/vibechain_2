# VIBECHAIN

## Current State
The vibe feed shows all users' current mood/song from their UserProfile. A "My Vibes" tab filters the feed to the authenticated user's own entry. There is no way to remove yourself from the feed once you've set a vibe.

## Requested Changes (Diff)

### Add
- `clearCurrentVibe()` backend function: sets the caller's `isVibeLive` flag to false, effectively removing them from the public feed
- `isVibeLive: Bool` field on `UserProfile` to track whether a user's vibe is currently active/visible in the feed
- Delete button on feed cards in the "My Vibes" tab — confirms deletion, then calls `clearCurrentVibe()`

### Modify
- `getVibeFeed()` to only return users where `isVibeLive == true`
- `setMood()` to also set `isVibeLive = true` when a new vibe is set
- `createUserProfile()` to set `isVibeLive = true` initially

### Remove
- Nothing

## Implementation Plan
1. Add `isVibeLive: Bool` to `UserProfile` type in backend
2. Update `createUserProfile`, `setMood`, `saveCallerUserProfile` to default/handle `isVibeLive`
3. Filter `getVibeFeed` to only include entries where `isVibeLive == true`
4. Add `clearCurrentVibe()` public shared function
5. Frontend: Add delete button to FeedCard when rendered in "My Vibes" tab, call `clearCurrentVibe` on confirm, refetch feed
