# VIBECHAIN

## Current State
After login, the app checks `getCallerUserProfile()`. If a profile exists, it redirects to `/feed`. New users with no profile also get sent to `/feed` (via the catch block), skipping any onboarding. The backend already has `createUserProfile(username, mood, song)` and `updateUsername(newUsername)` methods.

## Requested Changes (Diff)

### Add
- New `/setup-username` route and `UsernameSetupPage` component
- After login, if `getCallerUserProfile()` returns null (new user), redirect to `/setup-username` instead of `/feed`
- Username setup page: dark immersive design matching the rest of the app, text input for username, submit button that calls `createUserProfile(username, Mood.calm, null)` then navigates to `/feed`
- Basic validation: username must be 3-20 chars, alphanumeric + underscores

### Modify
- `LoginPage.tsx`: change the post-login redirect logic so new users (null profile) go to `/setup-username`
- `App.tsx`: add `setupUsernameRoute` pointing to `UsernameSetupPage`

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/UsernameSetupPage.tsx` with username input form
2. Update `LoginPage.tsx` to redirect new users to `/setup-username`
3. Update `App.tsx` to register the new route
