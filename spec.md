# VIBECHAIN

## Current State
SongSearchPage has a search input with live iTunes results, play/pause preview, and "Set Vibe" button. There is no search history functionality.

## Requested Changes (Diff)

### Add
- Song search history: store the last N (up to 10) unique search queries in localStorage
- When the search input is idle (no query typed), show a "Recent Searches" section below the header with the saved queries
- Each history item is tappable to re-run that search
- Each history item has an X button to remove it individually
- A "Clear all" button to wipe the entire history
- New searches are added to history when the user types a term and results are fetched successfully

### Modify
- SongSearchPage idle state: replace the generic "Find your frequency" prompt with the recent searches list (when history exists), or fall back to the existing prompt when history is empty

### Remove
- Nothing removed

## Implementation Plan
1. Create a `useSearchHistory` custom hook that reads/writes to localStorage key `vibechain_search_history` (array of strings, max 10, most recent first)
2. In SongSearchPage, import and use the hook
3. On successful search, call `addToHistory(query)`
4. When query is empty, render the recent searches section (if history non-empty) or the existing idle prompt
5. Style the history section to match the dark immersive VIBECHAIN aesthetic
6. Add deterministic `data-ocid` markers to history items and controls
