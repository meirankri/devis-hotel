"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Euro,
  FileText,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { calculateQuotePrice } from "@/utils/priceCalculator";

export function QuotesList() {
  const t = useTranslations("Quotes");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: quotes, isLoading, refetch } = trpc.quotes.getAll.useQuery();

  const updateStatus = trpc.quotes.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: t("statusUpdateSuccess"),
        description: t("statusUpdateSuccessDesc"),
      });
      refetch();
    },
    onError: () => {
      toast({
        title: t("statusUpdateError"),
        description: t("statusUpdateErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = async (
    id: string,
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"
  ) => {
    await updateStatus.mutateAsync({ id, status });
  };

  const filteredQuotes = quotes?.filter(
    (quote: any) => statusFilter === "ALL" || quote.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: "bg-yellow-100 text-yellow-800",
        label: t("statusPending"),
      },
      ACCEPTED: {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800",
        label: t("statusAccepted"),
      },
      REJECTED: {
        icon: XCircle,
        color: "bg-red-100 text-red-800",
        label: t("statusRejected"),
      },
      EXPIRED: {
        icon: Clock,
        color: "bg-gray-100 text-gray-800",
        label: t("statusExpired"),
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
          config.color
        )}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filtres */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            {t("all")} ({quotes?.length || 0})
          </Button>
          <Button
            variant={statusFilter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("PENDING")}
          >
            {t("statusPending")} (
            {quotes?.filter((q: any) => q.status === "PENDING").length || 0})
          </Button>
          <Button
            variant={statusFilter === "ACCEPTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ACCEPTED")}
          >
            {t("statusAccepted")} (
            {quotes?.filter((q: any) => q.status === "ACCEPTED").length || 0})
          </Button>
          <Button
            variant={statusFilter === "REJECTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("REJECTED")}
          >
            {t("statusRejected")} (
            {quotes?.filter((q: any) => q.status === "REJECTED").length || 0})
          </Button>
        </div>
      </div>

      {/* Liste des devis */}
      <div className="space-y-4">
        {filteredQuotes?.map((quote: any) => {
          const totalParticipants = quote.quoteParticipants.reduce(
            (sum: number, p: any) => sum + p.count,
            0
          );

          console.log("quote", quote);

          const totalPrice = calculateQuotePrice(quote);

          return (
            <div
              key={quote.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {quote.firstName} {quote.lastName}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(quote.checkIn), "dd MMM", {
                          locale: dateLocale,
                        })}{" "}
                        -{" "}
                        {format(new Date(quote.checkOut), "dd MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {totalParticipants} {t("participants")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      <span className="font-semibold">{totalPrice}€</span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-medium">{quote.stay.name}</span> -{" "}
                    {quote.stay.hotel.name}
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    {t("quoteNumber")}: {quote.quoteNumber}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href={`/quotes/${quote.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      {t("view")}
                    </Button>
                  </Link>

                  {quote.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleStatusUpdate(quote.id, "ACCEPTED")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(quote.id, "REJECTED")}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t("reject")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredQuotes?.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noQuotes")}
          </h3>
          <p className="text-gray-500">{t("noQuotesDesc")}</p>
        </div>
      )}
    </div>
  );
}
