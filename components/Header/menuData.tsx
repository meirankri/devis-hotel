import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "home",
    path: "/",
    newTab: false,
  },
  {
    id: 2,
    title: "pricing",
    path: "/#pricing",
    newTab: false,
  },
  {
    id: 3,
    title: "dashboard",
    path: "/dashboard",
    newTab: false,
    userOnly: true,
  },
  {
    id: 4,
    title: "hotels",
    path: "/hotels",
    newTab: false,
    userOnly: true,
  },
  {
    id: 5,
    title: "ageRanges",
    path: "/age-ranges",
    newTab: false,
    userOnly: true,
  },
  {
    id: 6,
    title: "stays",
    path: "/stays",
    newTab: false,
    userOnly: true,
  },
  {
    id: 7,
    title: "quotes",
    path: "/quotes",
    newTab: false,
    userOnly: true,
  },
];
export default menuData;
