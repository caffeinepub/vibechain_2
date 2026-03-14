import { Link, useRouterState } from "@tanstack/react-router";
import { ListMusic, Music, Search, User, Waves } from "lucide-react";

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const links = [
    { to: "/feed", icon: Waves, label: "Feed", ocid: "nav.feed_link" },
    { to: "/search", icon: Search, label: "Search", ocid: "nav.search_link" },
    {
      to: "/playlist",
      icon: ListMusic,
      label: "Playlist",
      ocid: "nav.playlist_link",
    },
    { to: "/mood", icon: Music, label: "My Vibe", ocid: "nav.mood_link" },
    { to: "/profile", icon: User, label: "Profile", ocid: "nav.profile_link" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map(({ to, icon: Icon, label, ocid }) => {
          const isActive =
            currentPath === to || currentPath.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              data-ocid={ocid}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? "drop-shadow-[0_0_8px_oklch(0.62_0.26_295/0.8)]"
                    : ""
                }
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
