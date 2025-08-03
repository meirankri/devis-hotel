import { getTranslations } from "next-intl/server";
import { validateSession } from "@/lib/lucia";
import { db } from "@/lib/database/db";
import { Hotel, Users, Calendar, TrendingUp, Euro } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard");
  const { user } = await validateSession();

  if (!user) {
    redirect("/sign-in");
  }

  // Récupérer les statistiques
  const [hotelCount, quoteCount, stayCount, totalRevenue] = await Promise.all([
    db.hotel.count({ where: { organizationId: user.organizationId } }),
    db.quote.count({
      where: { stay: { organizationId: user.organizationId } },
    }),
    db.stay.count({
      where: { isActive: true, organizationId: user.organizationId },
    }),
    db.quote.aggregate({
      _sum: { totalPrice: true },
      where: {
        stay: { organizationId: user.organizationId },
      },
    }),
  ]);

  const stats = [
    {
      title: t("hotels"),
      value: hotelCount,
      icon: Hotel,
      color: "bg-blue-500",
      href: "/dashboard/hotels",
    },
    {
      title: t("quotes"),
      value: quoteCount,
      icon: Users,
      color: "bg-green-500",
      href: "/dashboard/quotes",
    },
    {
      title: t("activeStays"),
      value: stayCount,
      icon: Calendar,
      color: "bg-purple-500",
      href: "/dashboard/stays",
    },
    {
      title: t("revenue"),
      value: `${totalRevenue._sum.totalPrice?.toNumber() || 0}€`,
      icon: Euro,
      color: "bg-orange-500",
      href: "/dashboard/quotes?status=confirmed",
    },
  ];

  const recentQuotes = await db.quote.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      stay: true,
    },
    where: {
      stay: {
        organizationId: user.organizationId,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("welcome")} {user.name || user.email}
          </h1>
          <p className="text-gray-600 mt-2">{t("dashboardSubtitle")}</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Link
                key={index}
                href={stat.href}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg bg-opacity-10`}>
                    <Icon
                      className={`h-6 w-6 text-current ${stat.color.replace(
                        "bg-",
                        "text-"
                      )}`}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t("quickActions")}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/dashboard/hotels"
                className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-blue-700"
              >
                <Hotel className="h-5 w-5" />
                <span className="font-medium">{t("addHotel")}</span>
              </Link>
              <Link
                href="/dashboard/stays"
                className="flex items-center justify-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-purple-700"
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{t("createStay")}</span>
              </Link>
            </div>
          </div>

          {/* Derniers devis */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t("recentQuotes")}
              </h2>
              <Link
                href="/dashboard/quotes"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {quote.firstName} {quote.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{quote.stay.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {quote.totalPrice
                        ? `${quote.totalPrice.toNumber()}€`
                        : "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
              {recentQuotes.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  {t("noRecentQuotes")}
                </p>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
