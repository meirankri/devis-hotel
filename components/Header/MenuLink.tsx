"use client";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n.config";
import menuData from "./menuData";
import { isEmpty } from "@/utils/checker";
import { ExtendedUser } from "@/types";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

const MenuLink = ({
  navbarOpen,
  user,
  classNames,
}: {
  navbarOpen: boolean;
  user: ExtendedUser;
  classNames?: {
    nav?: string;
    ul?: string;
    li?: string;
    link?: string;
    submenu?: string;
    submenuItem?: string;
    submenuItemLink?: string;
  };
}) => {
  const usePathName = usePathname();
  const t = useTranslations("UserMenu");

  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index: number): void => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  return (
    <nav
      id="navbarCollapse"
      className={twMerge(
        "navbar absolute right-0 z-30 w-[250px] rounded border-[.5px] border-body-color/50 bg-white px-6 py-4 duration-300 dark:border-body-color/20 dark:bg-dark lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100",
        navbarOpen
          ? "visibility top-full opacity-100"
          : "invisible top-[120%] opacity-0",
        classNames?.nav
      )}
    >
      <ul className={twMerge("block lg:flex lg:space-x-12", classNames?.ul)}>
        {menuData.map(
          (menuItem, index) =>
            (!menuItem.userOnly || (menuItem.userOnly && !isEmpty(user))) && (
              <li
                key={index}
                className={twMerge("group relative", classNames?.li)}
              >
                {menuItem.path ? (
                  <Link
                    href={menuItem.path}
                    className={twMerge(
                      `flex py-2 text-base lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 ${
                        usePathName === menuItem.path
                          ? "text-primary dark:text-white"
                          : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-white"
                      }`,
                      classNames?.link
                    )}
                  >
                    {t(menuItem.title)}
                  </Link>
                ) : (
                  <>
                    <p
                      onClick={() => handleSubmenu(index)}
                      className="flex cursor-pointer items-center justify-between py-2 text-base text-dark group-hover:text-primary dark:text-white/70 dark:group-hover:text-white lg:mr-0 lg:inline-flex lg:px-0 lg:py-6"
                    >
                      {t(menuItem.title)}
                      <span className="pl-3">
                        <svg width="25" height="24" viewBox="0 0 25 24">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M6.29289 8.8427C6.68342 8.45217 7.31658 8.45217 7.70711 8.8427L12 13.1356L16.2929 8.8427C16.6834 8.45217 17.3166 8.45217 17.7071 8.8427C18.0976 9.23322 18.0976 9.86639 17.7071 10.2569L12 15.964L6.29289 10.2569C5.90237 9.86639 5.90237 9.23322 6.29289 8.8427Z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                    </p>
                    <div
                      className={`submenu relative left-0 top-full rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 dark:bg-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full ${
                        openIndex === index ? "block" : "hidden"
                      }`}
                    >
                      {menuItem.submenu?.map((submenuItem, index) => (
                        <Link
                          href={submenuItem.path || "/"}
                          key={index}
                          className="block rounded py-2.5 text-sm text-dark hover:text-primary dark:text-white/70 dark:hover:text-white lg:px-3"
                        >
                          {t(submenuItem.title)}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </li>
            )
        )}
        {isEmpty(user) && (
          <Link
            href="/sign-in"
            className="submenu relative left-0 top-full rounded-sm bg-white transition-[top] duration-300 group-hover:opacity-100 dark:bg-dark lg:invisible lg:absolute lg:top-[110%] lg:block lg:w-[250px] lg:p-4 lg:opacity-0 lg:shadow-lg lg:group-hover:visible lg:group-hover:top-full"
          >
            {t("signIn")}
          </Link>
        )}
      </ul>
    </nav>
  );
};

export default MenuLink;
