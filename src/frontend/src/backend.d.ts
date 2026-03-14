import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VibeFeedEntry {
    username: string;
    currentMood: Mood;
    currentSong?: Song;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PlaylistEntry {
    mood: Mood;
    song: Song;
    addedAt: bigint;
}
export interface MoodHistoryEntry {
    songArtist: string;
    songTitle: string;
    mood: Mood;
    timestamp: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Song {
    title: string;
    previewUrl: string;
    artworkUrl: string;
    trackId: bigint;
    artist: string;
}
export interface ChatMessage {
    text: string;
    toUsername: string;
    timestamp: bigint;
    fromUsername: string;
}
export interface UserProfile {
    username: string;
    moodHistory: Array<MoodHistoryEntry>;
    playlist: Array<PlaylistEntry>;
    isVibeLive: boolean;
    currentMood: Mood;
    currentSong?: Song;
    friends: Array<string>;
}
export interface http_header {
    value: string;
    name: string;
}
export enum Mood {
    sad = "sad",
    melancholic = "melancholic",
    anxious = "anxious",
    happy = "happy",
    angry = "angry",
    romantic = "romantic",
    calm = "calm",
    energetic = "energetic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addFriend(username: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearCurrentVibe(): Promise<void>;
    createUserProfile(username: string, mood: Mood, song: Song | null): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(withUsername: string): Promise<Array<ChatMessage>>;
    getFriends(): Promise<Array<string>>;
    getMusicSuggestions(mood: Mood): Promise<string>;
    getMyConversations(): Promise<Array<string>>;
    getMyPlaylist(): Promise<Array<PlaylistEntry>>;
    getProfile(username: string): Promise<UserProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVibeFeed(): Promise<Array<VibeFeedEntry>>;
    isCallerAdmin(): Promise<boolean>;
    removeFriend(username: string): Promise<void>;
    removeFromPlaylist(mood: Mood, trackId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveToPlaylist(mood: Mood, song: Song): Promise<void>;
    sendMessage(toUsername: string, text: string): Promise<void>;
    setMood(mood: Mood, song: Song | null): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateUsername(newUsername: string): Promise<void>;
}
