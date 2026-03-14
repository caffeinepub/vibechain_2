import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Time "mo:core/Time";
import OutCall "http-outcalls/outcall";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
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

  public type PlaylistEntry = {
    mood : Mood;
    song : Song;
    addedAt : Int;
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
    playlist : [PlaylistEntry];
    friends : [Text];
  };

  public type VibeFeedEntry = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
  };

  public type ChatMessage = {
    fromUsername : Text;
    toUsername : Text;
    text : Text;
    timestamp : Int;
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

  // Persistent storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let chatMessages = Map.empty<Text, List.List<ChatMessage>>();

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

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let oldProfile = userProfiles.get(caller);
    let updatedProfile : UserProfile = {
      profile with
      friends = if (profile.friends.size() == 0) {
        switch (oldProfile) {
          case (?old) { old.friends };
          case (null) { [] };
        };
      } else {
        profile.friends;
      };
    };

    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func createUserProfile(username : Text, mood : Mood, song : ?Song) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };

    if (userProfiles.containsKey(caller)) {
      Runtime.trap("Profile already exists for this user");
    };

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
      playlist = [];
      friends = [];
    };

    userProfiles.add(caller, profile);
  };

  public query func getProfile(username : Text) : async ?UserProfile {
    for ((principal, profile) in userProfiles.entries()) {
      if (profile.username == username) { return ?profile };
    };
    null;
  };

  public shared ({ caller }) func updateUsername(newUsername : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update username");
    };

    for ((principal, profile) in userProfiles.entries()) {
      if (principal != caller and profile.username == newUsername) {
        Runtime.trap("New username already exists");
      };
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        userProfiles.add(caller, { profile with username = newUsername });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public shared ({ caller }) func clearCurrentVibe() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear vibe");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        userProfiles.add(caller, { profile with isVibeLive = false });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

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
          isVibeLive = true;
        };
      };
      case (null) {
        Runtime.trap("User profile not found. Please create a profile first.");
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

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

  public shared ({ caller }) func getMusicSuggestions(mood : Mood) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get music suggestions");
    };

    let keyword = moodToKeyword(mood);
    let apiKey = "AIzaSyC4wFZbYfToWIoptfiMXxoywAK-STRjeHo";
    let url = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" # keyword # "%20music&type=video&videoCategoryId=10&maxResults=20&key=" # apiKey;
    let response = await OutCall.httpGetRequest(url, [], transform);
    response;
  };

  public shared ({ caller }) func saveToPlaylist(mood : Mood, song : Song) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save songs to playlist");
    };

    let newEntry : PlaylistEntry = {
      mood;
      song;
      addedAt = Time.now();
    };

    let updatedProfile = switch (userProfiles.get(caller)) {
      case (?profile) {
        let playlistList = List.fromArray<PlaylistEntry>(profile.playlist);
        playlistList.add(newEntry);
        let newPlaylist = playlistList.values().toArray();
        { profile with playlist = newPlaylist };
      };
      case (null) {
        Runtime.trap("User profile not found. Please create a profile first.");
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func removeFromPlaylist(mood : Mood, trackId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can remove songs from playlist");
    };

    let updatedProfile = switch (userProfiles.get(caller)) {
      case (?profile) {
        let filteredPlaylist = profile.playlist.filter(
          func(entry) { not (entry.mood == mood and entry.song.trackId == trackId) }
        );
        { profile with playlist = filteredPlaylist };
      };
      case (null) {
        Runtime.trap("User profile not found.");
      };
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getMyPlaylist() : async [PlaylistEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their playlist");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) { profile.playlist };
      case (null) { Runtime.trap("User profile not found") };
    };
  };

  /////////////////////////////////////////////////////////
  // Chat / Messaging
  /////////////////////////////////////////////////////////

  func getUsername(principal : Principal) : ?Text {
    switch (userProfiles.get(principal)) {
      case (?profile) { ?profile.username };
      case (null) { null };
    };
  };

  func getOrderedPair(a : Text, b : Text) : (Text, Text) {
    switch (Text.compare(a, b)) {
      case (#less) { (a, b) };
      case (#equal) { (a, b) };
      case (#greater) { (b, a) };
    };
  };

  func getChatKey(user1 : Text, user2 : Text) : Text {
    let (userA, userB) = getOrderedPair(user1, user2);
    userA # "_" # userB;
  };

  func splitUsernamePair(key : Text) : ?(Text, Text) {
    let chars = key.toArray();
    let n = chars.size();
    let underscore : Nat = switch (chars.findIndex(func(c) { c == '_' })) {
      case (?pos) { pos };
      case (null) { return null };
    };

    if (underscore == 0 or underscore == n - 1) {
      return null;
    };

    let charsA = chars.sliceToArray(0, underscore);
    let charsB = chars.sliceToArray(underscore + 1, n);

    let userA = Text.fromArray(charsA);
    let userB = Text.fromArray(charsB);

    ?(userA, userB);
  };

  public shared ({ caller }) func sendMessage(toUsername : Text, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    let fromUsername = switch (userProfiles.get(caller)) {
      case (?profile) { profile.username };
      case (null) { Runtime.trap("Sender profile not found") };
    };

    ignore switch (userProfiles.values().find(func(profile) { profile.username == toUsername })) {
      case (?_) { () };
      case (null) { Runtime.trap("Receiver profile not found") };
    };

    let message = {
      fromUsername;
      toUsername;
      text;
      timestamp = Time.now();
    };

    let chatKey = getChatKey(fromUsername, toUsername);

    let chat = switch (chatMessages.get(chatKey)) {
      case (?messages) { messages };
      case (null) { List.empty<ChatMessage>() };
    };

    chat.add(message);
    chatMessages.add(chatKey, chat);
  };

  public query ({ caller }) func getConversation(withUsername : Text) : async [ChatMessage] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let fromUsername = switch (userProfiles.get(caller)) {
      case (?profile) { profile.username };
      case (null) { Runtime.trap("User profile not found") };
    };

    let chatKey = getChatKey(fromUsername, withUsername);

    switch (chatMessages.get(chatKey)) {
      case (?messages) {
        messages.values().toArray().sort(
          func(a, b) {
            Int.compare(a.timestamp, b.timestamp);
          }
        );
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getMyConversations() : async [Text] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    let myUsername = switch (userProfiles.get(caller)) {
      case (?profile) { profile.username };
      case (null) { Runtime.trap("User profile not found") };
    };

    let names = List.empty<Text>();

    for ((key, _) in chatMessages.entries()) {
      switch (splitUsernamePair(key)) {
        case (?userPair) {
          let (userA, userB) = userPair;
          if (userA == myUsername or userB == myUsername) {
            let otherUser = if (userA == myUsername) { userB } else {
              userA;
            };
            if (names.values().find(func(name) { name == otherUser }) == null) {
              names.add(otherUser);
            };
          };
        };
        case (null) { () };
      };
    };

    names.toArray();
  };

  /////////////////////////////////////////////////////////
  // FRIENDS SYSTEM
  /////////////////////////////////////////////////////////

  public shared ({ caller }) func addFriend(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add friends");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        if (profile.username == username) {
          Runtime.trap("Can't be friends with yourself");
        };

        if (not userProfiles.values().toArray().find(func(p) { p.username == username }).isSome()) {
          Runtime.trap("User does not exist");
        };

        if (profile.friends.find(func(f) { f == username }).isSome()) {
          Runtime.trap("Already friends with that user");
        };

        let updatedFriends = profile.friends.concat([username]);
        userProfiles.add(caller, { profile with friends = updatedFriends });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public shared ({ caller }) func removeFriend(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove friends");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        let filteredFriends = profile.friends.filter(func(friend) { friend != username });
        userProfiles.add(caller, { profile with friends = filteredFriends });
      };
      case (null) {
        Runtime.trap("User profile not found");
      };
    };
  };

  public query ({ caller }) func getFriends() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get friends list");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) { profile.friends };
      case (null) { Runtime.trap("User profile not found") };
    };
  };
};
