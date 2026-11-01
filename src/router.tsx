import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { GamePage } from "./pages/GamePage";
import { NotFoundPage } from "./pages/NotFoundPage";

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "duo" ? ("duo" as const) : ("solo" as const),
    level:
      search.level === "easy" || search.level === "hard"
        ? (search.level as "easy" | "hard")
        : ("normal" as const),
  }),
  component: GamePage,
});

const routeTree = rootRoute.addChildren([indexRoute]);
const basepath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const router = createRouter({
  routeTree,
  basepath: basepath || undefined,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
