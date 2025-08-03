import { initTRPC, TRPCError } from "@trpc/server";
import { validateSession } from "@/lib/lucia";

export const createContext = async () => {
  const { session, user } = await validateSession();
  
  return {
    session,
    user,
    organizationId: user?.organizationId,
  };
};

const t = initTRPC.context<typeof createContext>().create();

const isAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  
  // Si l'utilisateur n'a pas d'organisation, en créer une automatiquement
  if (!ctx.user.organizationId) {
    const { db } = await import("@/lib/database/db");
    
    // Générer un slug unique basé sur l'email
    const baseSlug = ctx.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await db.organization.findUnique({
        where: { slug },
      });
      
      if (!existing) {
        break;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Créer l'organisation
    const organization = await db.organization.create({
      data: {
        name: `Organisation de ${ctx.user.name || ctx.user.email}`,
        slug,
      },
    });
    
    // Mettre à jour l'utilisateur
    await db.user.update({
      where: { id: ctx.user.id },
      data: { organizationId: organization.id },
    });
    
    ctx.user.organizationId = organization.id;
  }
  
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
      organizationId: ctx.user.organizationId,
    },
  });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);