"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import ThemeToggler from "./ThemeToggler";
import { Link } from "@/i18n.config";
import { useSession } from "@/hooks/useSession";
import UserMenu from "./UserMenu";
import { isEmpty } from "@/utils/checker";
import MenuLink from "./MenuLink";
import { ExtendedUser } from "@/types";

const Header = () => {
  const t = useTranslations("UserMenu");
  const [navbarOpen, setNavbarOpen] = useState(false);
  const user = useSession();

  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  return (
    <>
      <header
        className={`header left-0 top-0 z-40 flex w-full items-center ${
          sticky
            ? "dark:bg-gray-dark dark:shadow-sticky-dark fixed z-[9999] bg-white !bg-opacity-80 shadow-sticky backdrop-blur-sm transition"
            : "absolute bg-transparent"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4 xl:mr-12">
              <Link
                href="/"
                className={`header-logo block w-full ${
                  sticky ? "py-5 lg:py-2" : "py-8"
                } `}
              >
                <Image
                  src="/images/logo/logo-2.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="w-full dark:hidden"
                />
                <Image
                  src="/images/logo/logo.svg"
                  alt="logo"
                  width={140}
                  height={30}
                  className="hidden w-full dark:block"
                />
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="mobile Menu"
                  className="absolute right-4 top-1/2 block translate-y-[-50%] rounded-lg px-3 py-[6px] ring-primary focus:ring-2 lg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0 " : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? " top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
              </div>
              <MenuLink navbarOpen={navbarOpen} user={user as ExtendedUser} />
              <div className="flex items-center justify-end pr-16 lg:pr-0">
                {isEmpty(user) && (
                  <Link
                    href="/sign-in"
                    className="hidden bg-primary px-7 py-3 text-base font-medium text-dark hover:opacity-70 dark:text-white lg:block"
                  >
                    {t("signIn")}
                  </Link>
                )}
                <div>
                  <ThemeToggler />
                </div>
                {!isEmpty(user) && <UserMenu />}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
