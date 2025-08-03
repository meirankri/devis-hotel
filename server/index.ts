import { router } from "./trpc";
import { contactRouter } from "./routes/contact";
import { hotelsRouter } from "./routes/hotels";

export const appRouter = router({
  contact: contactRouter,
  hotels: hotelsRouter,
});

export type AppRouter = typeof appRouter;
