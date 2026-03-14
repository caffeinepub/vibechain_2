# VIBECHAIN

## Current State
- User-to-user chat is live (ChatListPage, ChatPage) with unread badges
- Playlist saving/sharing is live; playlist is shown inside ProfilePage
- No concept of "friends" -- users must manually type a username to start chat
- SharedPlaylistPage allows viewing any user's playlist by URL
- Backend: UserProfile has no friends list; no add/remove friend APIs

## Requested Changes (Diff)

### Add
- Backend: `friends` field (array of usernames) on UserProfile
- Backend: `addFriend(username)` -- adds to caller's friends list (no duplicate)
- Backend: `removeFriend(username)` -- removes from caller's friends list
- Backend: `getFriends()` -- returns caller's friends array
- Frontend: FriendsPage (`/friends`) -- list of friends, add-friend input, message button, view playlist button
- Frontend: Friends tab in BottomNav
- Frontend: From each friend row: button to open chat, button to view their playlist (`/playlist/username`)

### Modify
- Backend: UserProfile type gains `friends: [Text]` field
- Backend: createUserProfile initializes friends as `[]`
- Frontend: ProfilePage shows friend count or link to friends page

### Remove
- Nothing removed

## Implementation Plan
1. Update Motoko UserProfile type to include `friends : [Text]`
2. Add addFriend, removeFriend, getFriends backend functions
3. Update createUserProfile to init friends = []
4. Regenerate backend bindings
5. Build FriendsPage with: add-friend input, friends list rows (avatar, username, Message button, Playlist button), empty state
6. Add Friends nav link (UserPlus icon) to BottomNav
7. Add /friends route in App.tsx
8. Wire useQueries hooks for addFriend, removeFriend, getFriends
