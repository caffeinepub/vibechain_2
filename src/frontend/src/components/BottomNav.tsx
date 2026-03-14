import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Music, Search, User, Users, Waves } from "lucide-react";
import { useCallerProfile } from "../hooks/useQueries";
import { useTotalUnread } from "../hooks/useUnreadMessages";

function ChatBadge() {
  const { data: myProfile } = useCallerProfile();
  const total = useTotalUnread(myProfile?.username);
  if (!total) return null;
  return (
    <span
      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[oklch(0.62_0.28_15)] text-white text-[9px] font-bold flex items-center justify-center leading-none shadow-[0_0_6px_oklch(0.62_0.28_15/0.7)]"
      aria-label={`${total} unread messages`}
    >
      {total > 9 ? "9+" : total}
    </span>
  );
}

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const links = [
    { to: "/feed", icon: Waves, label: "Feed", ocid: "nav.feed_link" },
    { to: "/search", icon: Search, label: "Search", ocid: "nav.search_link" },
    { to: "/friends", icon: Users, label: "Friends", ocid: "nav.friends_link" },
    {
      to: "/chat",
      icon: MessageCircle,
      label: "Chat",
      ocid: "nav.chat_link",
      badge: <ChatBadge />,
    },
    { to: "/profile", icon: User, label: "Profile", ocid: "nav.profile_link" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/40">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map(({ to, icon: Icon, label, ocid, badge }) => {
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
              <span className="relative">
                <Icon
                  size={20}
                  className={
                    isActive
                      ? "drop-shadow-[0_0_8px_oklch(0.62_0.26_295/0.8)]"
                      : ""
                  }
                />
                {badge}
              </span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
