import Map "mo:core/Map";
import Principal "mo:core/Principal";

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
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewUserProfile = {
    username : Text;
    currentMood : Mood;
    currentSong : ?Song;
    moodHistory : [MoodHistoryEntry];
    isVibeLive : Bool;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newUserProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_p, oldProfile) { { oldProfile with isVibeLive = true } },
    );
    { userProfiles = newUserProfiles };
  };
};
