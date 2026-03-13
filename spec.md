# VIBECHAIN

## Current State
Music search and mood-based suggestions use the iTunes Music API:
- Backend (`main.mo`): `getMusicSuggestions` makes an HTTP outcall to `https://itunes.apple.com/search?...`
- Frontend (`useQueries.ts`): parses iTunes JSON response (`results[]` with `trackId`, `trackName`, `artistName`, `artworkUrl100`, `previewUrl`)
- Frontend (`SongSearchPage.tsx`): fetches `https://itunes.apple.com/search?...` directly from the browser
- Frontend player uses `HTMLAudioElement` to play 30-second MP3 preview URLs returned by iTunes

## Requested Changes (Diff)

### Add
- YouTube Data API v3 integration (key: `AIzaSyBvsZ3vcj1Dlk4yXwA7f2aPvP1unBPPaC0`) for music search
- YouTube IFrame Player API for in-app video/audio playback in the mini player
- Hidden YouTube iframe managed by a `YouTubePlayerManager` that replaces `AudioManager`

### Modify
- Backend `getMusicSuggestions`: change URL to YouTube Data API v3 search endpoint (`https://www.googleapis.com/youtube/v3/search?part=snippet&q={keyword}+music&type=video&videoCategoryId=10&maxResults=20&key=...`)
- Frontend `useQueries.ts`: parse YouTube response (`items[]` with `id.videoId`, `snippet.title`, `snippet.channelTitle`, `snippet.thumbnails.high.url`). Map to `Song` type: `previewUrl` = YouTube video ID (not embed URL)
- Frontend `SongSearchPage.tsx`: change direct fetch from iTunes to YouTube Data API v3 with the same API key
- Frontend `playerStore.ts`: replace `HTMLAudioElement` `AudioManager` with YouTube IFrame Player API manager (`YouTubePlayerManager`). Load the YT IFrame script once, create/reuse a hidden player div, control playback via `YT.Player` methods
- Frontend `MiniPlayer.tsx`: poll YouTube player for time/duration using `setInterval` instead of audio events; progress bar seek calls `player.seekTo()`

### Remove
- All references to `https://itunes.apple.com`
- iTunes-specific type `ItunesResult` / `ItunesTrack`
- `HTMLAudioElement`-based `AudioManager` class

## Implementation Plan
1. Update `src/backend/main.mo`: change YouTube API URL and API key in `getMusicSuggestions`
2. Update `src/frontend/src/hooks/useQueries.ts`: parse YouTube response format
3. Update `src/frontend/src/pages/SongSearchPage.tsx`: fetch from YouTube API instead of iTunes
4. Replace `AudioManager` in `src/frontend/src/store/playerStore.ts` with `YouTubePlayerManager` using IFrame API
5. Update `src/frontend/src/components/MiniPlayer.tsx` to use YouTube-based progress polling
6. Validate (lint + typecheck + build)
