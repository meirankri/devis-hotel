import { appRouter } from "@/server";
import { createContext } from "@/server/trpc";

export const getServerClient = async () => {
  return appRouter.createCaller(await createContext());
};