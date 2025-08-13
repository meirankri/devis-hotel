import { Menu } from "@/types/menu";

const menuData: Menu[] = [
  {
    id: 1,
    title: "home",
    path: "/",
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
    path: "/dashboard/hotels",
    newTab: false,
    userOnly: true,
  },
  {
    id: 6,
    title: "stays",
    path: "/dashboard/stays",
    newTab: false,
    userOnly: true,
  },
  {
    id: 7,
    title: "quotes",
    path: "/dashboard/quotes",
    newTab: false,
    userOnly: true,
  },
];
export default menuData;
