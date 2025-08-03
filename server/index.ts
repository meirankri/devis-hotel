import { router } from "./trpc";
import { contactRouter } from "./routes/contact";
import { hotelsRouter } from "./routes/hotels";
import { roomsRouter } from "./routes/rooms";
import { ageRangesRouter } from "./routes/age-ranges";
import { staysRouter } from "./routes/stays";
import { quotesRouter } from "./routes/quotes";

export const appRouter = router({
  contact: contactRouter,
  hotels: hotelsRouter,
  rooms: roomsRouter,
  ageRanges: ageRangesRouter,
  stays: staysRouter,
  quotes: quotesRouter,
});

export type AppRouter = typeof appRouter;
