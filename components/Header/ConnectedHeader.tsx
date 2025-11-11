"use client";
import Image from "next/image";
import { Link } from "@/i18n.config";
import UserMenu from "./UserMenu";
import { ExtendedUser } from "@/types";
import MenuLink from "./MenuLink";
import { useSession } from "@/hooks/useSession";
import ThemeToggler from "./ThemeToggler";

const ConnectedHeader = () => {
  const user = useSession();

  return (
    <header className="fixed bg-gradient-to-r from-blue-900/90 via-purple-800/80 to-indigo-900/90 top-0 left-0 w-full shadow-md z-40">
      <div className="container mx-auto px-4">
        <div className="flex text-white items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/logo/logo.svg"
              alt="logo"
              width={140}
              height={30}
              className="w-auto h-8"
            />
          </Link>
          <MenuLink
            navbarOpen={false}
            user={user as ExtendedUser}
            classNames={{
              link: "text-white",
            }}
          />
          <ThemeToggler />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default ConnectedHeader;
