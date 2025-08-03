import { initTRPC, TRPCError } from "@trpc/server";
import { validateSession } from "@/lib/lucia";

export const createContext = async () => {
  const { session, user } = await validateSession();
  
  return {
    session,
    user,
  };
};

const t = initTRPC.context<typeof createContext>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);