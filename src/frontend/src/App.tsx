import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { EmotionDetectPage } from "./pages/EmotionDetectPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MoodSelectorPage } from "./pages/MoodSelector";
import { ProfilePage } from "./pages/Profile";
import { SongPickerPage } from "./pages/SongPicker";
import { SongSearchPage } from "./pages/SongSearchPage";
import { UsernameSetupPage } from "./pages/UsernameSetupPage";
import { VibeFeedPage } from "./pages/VibeFeed";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-center" theme="dark" richColors />
    </>
  ),
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LoginPage,
});
const landingOldRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/landing",
  component: LandingPage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: LoginPage,
});
const usernameSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/setup-username",
  component: UsernameSetupPage,
});
const moodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mood",
  component: MoodSelectorPage,
});
const songPickerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pick-song",
  component: SongPickerPage,
});
const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: VibeFeedPage,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});
const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SongSearchPage,
});
const detectMoodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/detect-mood",
  component: EmotionDetectPage,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  landingOldRoute,
  loginRoute,
  signupRoute,
  usernameSetupRoute,
  moodRoute,
  songPickerRoute,
  feedRoute,
  profileRoute,
  searchRoute,
  detectMoodRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
