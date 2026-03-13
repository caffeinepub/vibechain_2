import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


// Explicit with migration due to persistent anonymizer id

actor {
  // Custom types
  public type Mood = {
    #happy;
    #sad;
    #energetic;
    #calm;
    #melancholic;
    #angry;
    #romantic;
    #anxious;
  };

  public type Song = {
    title : Text;
    artist : Text;
    artworkUrl : Text;
    previewUrl : Text;
    trackId : Nat;
  };

  public type MoodHistoryEntry = {
    mood : Mood;
    timestamp : Int;
    songTitle : Text;
    songArtist : Text;
  };

  public type UserProfile = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
    moodHistory : [MoodHistoryEntry];
    isVibeLive : Bool;
  };

  public type VibeFeedEntry = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
  };

  public type MusicSuggestion = {
    trackName : Text;
    artistName : Text;
    artworkUrl100 : Text;
    previewUrl : Text;
    trackId : Nat;
  };

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Persistent storage - using Principal as key for proper ownership
  let userProfiles = Map.empty<Principal, UserProfile>();

  func moodToKeyword(mood : Mood) : Text {
    switch (mood) {
      case (#happy) { "happy" };
      case (#sad) { "sad" };
      case (#energetic) { "energetic" };
      case (#calm) { "calm" };
      case (#melancholic) { "melancholic" };
      case (#angry) { "angry" };
      case (#romantic) { "romantic" };
      case (#anxious) { "anxious" };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Required by instructions: Get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  // Required by instructions: Get another user's profile (admin or self only)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Required by instructions: Save caller's profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Public: Get any user's profile by username (for public vibe feed)
  public query func getProfile(username : Text) : async ?UserProfile {
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.username == username) {
        return ?profile;
      };
    };
    null;
  };

  // Public: Get vibe feed (all users' current mood and song)
  public query func getVibeFeed() : async [VibeFeedEntry] {
    userProfiles.values().toArray().filter(
      func(profile) { profile.isVibeLive }
    ).map(
      func(profile : UserProfile) : VibeFeedEntry {
        {
          username = profile.username;
          currentMood = profile.currentMood;
          currentSong = profile.currentSong;
        };
      }
    );
  };

  // Set my mood and optionally a song
  public shared ({ caller }) func setMood(mood : Mood, song : ?Song) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set mood");
    };

    let newEntry : MoodHistoryEntry = {
      mood;
      timestamp = Time.now();
      songTitle = switch (song) {
        case (?s) { s.title };
        case (null) { "" };
      };
      songArtist = switch (song) {
        case (?s) { s.artist };
        case (null) { "" };
      };
    };

    let updatedProfile = switch (userProfiles.get(caller)) {
      case (?profile) {
        let moodHistoryList = List.fromArray<MoodHistoryEntry>(profile.moodHistory);
        moodHistoryList.add(newEntry);
        let newMoodHistory = moodHistoryList.values().toArray();
        {
          profile with
          currentMood = mood;
          currentSong = song;
          moodHistory = newMoodHistory;
          isVibeLive = true; // Set vibe as live
        };
      };
      case (null) {
        Runtime.trap("User profile not found. Please create a profile first.");
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

  // Clear (hide) current vibe from the feed
  public shared ({ caller }) func clearCurrentVibe() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear vibe");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (not profile.isVibeLive) {
          Runtime.trap("No live vibe to clear");
        };
        userProfiles.add(caller, { profile with isVibeLive = false });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  // Get music suggestions for a mood (calls YouTube Data API v3)
  public shared ({ caller }) func getMusicSuggestions(mood : Mood) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get music suggestions");
    };
    let keyword = moodToKeyword(mood);
    let apiKey = "AIzaSyBvsZ3vcj1Dlk4yXwA7f2aPvP1unBPPaC0";
    let url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" # keyword # "%20music&type=video&videoCategoryId=10&maxResults=20&key=" # apiKey;
    let response = await OutCall.httpGetRequest(url, [], transform);
    response;
  };

  // Create user profile (requires authentication)
  public shared ({ caller }) func createUserProfile(username : Text, mood : Mood, song : ?Song) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };

    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Profile already exists for this user");
    };

    // Check if username is already taken
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.username == username) {
        Runtime.trap("Username already exists");
      };
    };

    let profile : UserProfile = {
      username;
      currentMood = mood;
      currentSong = song;
      moodHistory = [
        {
          mood;
          timestamp = Time.now();
          songTitle = switch (song) {
            case (?s) { s.title };
            case (null) { "" };
          };
          songArtist = switch (song) {
            case (?s) { s.artist };
            case (null) { "" };
          };
        }
      ];
      isVibeLive = true;
    };
    userProfiles.add(caller, profile);
  };

  // Update my username
  public shared ({ caller }) func updateUsername(newUsername : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update username");
    };

    // Check if new username is already taken by another user
    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and profile.username == newUsername) {
        Runtime.trap("New username already exists");
      };
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        userProfiles.add(
          caller,
          { profile with username = newUsername },
        );
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };
};
