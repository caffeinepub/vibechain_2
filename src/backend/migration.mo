import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  type Mood = {
    #happy;
    #sad;
    #energetic;
    #calm;
    #melancholic;
    #angry;
    #romantic;
    #anxious;
  };

  type Song = {
    title : Text;
    artist : Text;
    artworkUrl : Text;
    previewUrl : Text;
    trackId : Nat;
  };

  type PlaylistEntry = {
    mood : Mood;
    song : Song;
    addedAt : Int;
  };

  type MoodHistoryEntry = {
    mood : Mood;
    timestamp : Int;
    songTitle : Text;
    songArtist : Text;
  };

  type OldUserProfile = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
    moodHistory : [MoodHistoryEntry];
    isVibeLive : Bool;
    playlist : [PlaylistEntry];
  };

  type VibeFeedEntry = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
  };

  type ChatMessage = {
    fromUsername : Text;
    toUsername : Text;
    text : Text;
    timestamp : Int;
  };

  type MusicSuggestion = {
    trackName : Text;
    artistName : Text;
    artworkUrl100 : Text;
    previewUrl : Text;
    trackId : Nat;
  };

  type NewUserProfile = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
    moodHistory : [MoodHistoryEntry];
    isVibeLive : Bool;
    playlist : [PlaylistEntry];
    friends : [Text];
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    chatMessages : Map.Map<Text, List.List<ChatMessage>>;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
    chatMessages : Map.Map<Text, List.List<ChatMessage>>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        { oldProfile with friends = [] };
      }
    );
    { old with userProfiles = newUserProfiles };
  };
};
