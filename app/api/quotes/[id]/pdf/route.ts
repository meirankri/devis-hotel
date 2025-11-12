import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/db";
import { calculateQuotePrice } from "@/utils/priceCalculator";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Prisma } from "@prisma/client";

// Type pour le devis avec toutes ses relations
type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    stay: {
      include: {
        hotel: true;
        organization: true;
        subPeriods: true;
      };
    };
    quoteParticipants: {
      include: {
        ageRange: true;
      };
    };
    quoteRooms: {
      include: {
        room: {
          include: {
            roomPricings: {
              include: {
                ageRange: true;
                subPeriod: true;
              };
            };
          };
        };
        quoteRoomOccupants: {
          include: {
            ageRange: true;
          };
        };
      };
    };
  };
}>;

// Fonction helper pour calculer le prix d'une chambre pour une tranche d'âge
function getRoomPriceForAgeRange(
  room: any,
  ageRangeId: string,
  subPeriodId?: string | null
): number {
  const pricing = room.roomPricings?.find(
    (rp: any) => rp.ageRangeId === ageRangeId && rp.subPeriodId === subPeriodId
  );

  // Si pas de prix pour cette sous-période, chercher le prix global
  if (!pricing && subPeriodId) {
    const globalPricing = room.roomPricings?.find(
      (rp: any) => rp.ageRangeId === ageRangeId && !rp.subPeriodId
    );
    return globalPricing?.price || 0;
  }

  return pricing?.price || 0;
}

// Fonction pour créer la ventilation détaillée des prix
function getPriceBreakdown(quote: QuoteWithRelations, selectedSubPeriodsData: any[]): any[] {
  const breakdown: any[] = [];

  quote.quoteRooms?.forEach((qr) => {
    if (!qr.quoteRoomOccupants || qr.quoteRoomOccupants.length === 0) return;

    const roomBreakdown = {
      room: qr.room,
      periods: [] as any[],
    };

    if (selectedSubPeriodsData.length > 0) {
      // Prix par sous-période
      selectedSubPeriodsData.forEach((subPeriod) => {
        const periodData = {
          period: subPeriod,
          occupants: [] as any[],
        };

        qr.quoteRoomOccupants.forEach((occupant) => {
          if (occupant.count > 0) {
            const price = getRoomPriceForAgeRange(qr.room, occupant.ageRangeId, subPeriod.id);
            periodData.occupants.push({
              ageRange: occupant.ageRange,
              count: occupant.count,
              pricePerPerson: price,
              subtotal: price * occupant.count,
            });
          }
        });

        roomBreakdown.periods.push(periodData);
      });
    } else {
      // Prix global (pas de sous-périodes)
      const periodData = {
        period: null,
        occupants: [] as any[],
      };

      qr.quoteRoomOccupants.forEach((occupant) => {
        if (occupant.count > 0) {
          const price = getRoomPriceForAgeRange(qr.room, occupant.ageRangeId, null);
          periodData.occupants.push({
            ageRange: occupant.ageRange,
            count: occupant.count,
            pricePerPerson: price,
            subtotal: price * occupant.count,
          });
        }
      });

      roomBreakdown.periods.push(periodData);
    }

    breakdown.push(roomBreakdown);
  });

  return breakdown;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const quote: QuoteWithRelations | null = await prisma.quote.findUnique({
      where: { id },
      include: {
        stay: {
          include: {
            hotel: true,
            organization: true,
            subPeriods: {
              orderBy: { order: "asc" },
            },
          },
        },
        quoteParticipants: {
          include: {
            ageRange: true,
          },
        },
        quoteRooms: {
          include: {
            room: {
              include: {
                roomPricings: {
                  include: {
                    ageRange: true,
                    subPeriod: true,
                  },
                },
              },
            },
            quoteRoomOccupants: {
              include: {
                ageRange: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Calculer le prix total avec l'utilitaire
    const formattedQuoteRooms = quote.quoteRooms.map((quoteRoom) => ({
      ...quoteRoom,
      room: {
        ...quoteRoom.room,
        roomPricings: quoteRoom.room.roomPricings.map((pricing) => ({
          ...pricing,
          price: pricing.price.toNumber(),
        })),
      },
    }));

    // Parser les sous-périodes sélectionnées
    const selectedSubPeriodsData = quote.selectedSubPeriods && quote.stay.subPeriods.length > 0
      ? (quote.selectedSubPeriods as string[]).map(id =>
          quote.stay.subPeriods.find(sp => sp.id === id)
        ).filter((sp): sp is NonNullable<typeof sp> => sp !== undefined)
        .map(sp => ({
          id: sp.id,
          name: sp.name,
          startDate: sp.startDate.toISOString(),
          endDate: sp.endDate.toISOString()
        }))
      : [];

    // Utiliser calculateQuotePrice avec les sous-périodes
    const totalPrice = calculateQuotePrice(
      {
        quoteParticipants: quote.quoteParticipants,
        quoteRooms: formattedQuoteRooms,
      },
      selectedSubPeriodsData
    );

    const nights = Math.ceil(
      (new Date(quote.checkOut).getTime() - new Date(quote.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Générer le PDF avec jsPDF
    try {
      const doc = new jsPDF();

      // Configuration des couleurs
      const primaryColor = { r: 0, g: 102, b: 204 };
      const textColor = { r: 51, g: 51, b: 51 };
      const lightGray = { r: 245, g: 245, b: 245 };

      let yPosition = 20;
      const lineHeight = 7;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(`Devis #${quote.quoteNumber}`, pageWidth / 2, 20, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.text(
        `Date de création : ${new Date(quote.createdAt).toLocaleDateString(
          "fr-FR"
        )}`,
        pageWidth / 2,
        30,
        { align: "center" }
      );

      yPosition = 50;

      // Status
      const statusText =
        quote.status === "PENDING"
          ? "En attente"
          : quote.status === "ACCEPTED"
          ? "Accepté"
          : quote.status === "REJECTED"
          ? "Refusé"
          : "Expiré";

      const statusColor =
        quote.status === "PENDING"
          ? { r: 217, g: 119, b: 6 }
          : quote.status === "ACCEPTED"
          ? { r: 5, g: 150, b: 105 }
          : quote.status === "REJECTED"
          ? { r: 220, g: 38, b: 38 }
          : { r: 107, g: 114, b: 128 };

      doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(pageWidth / 2 - 20, yPosition - 5, 40, 10, 3, 3, "F");
      doc.setFontSize(9);
      doc.text(statusText, pageWidth / 2, yPosition, { align: "center" });

      yPosition += 20;

      // Reset text color
      doc.setTextColor(textColor.r, textColor.g, textColor.b);

      // Section: Informations Client
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informations Client", margin + 5, yPosition + 6);

      yPosition += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(
        `Nom complet : ${quote.firstName} ${quote.lastName}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(`Email : ${quote.email}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Téléphone : ${quote.phone}`, margin, yPosition);
      yPosition += 15;

      // Section: Détails du Séjour
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Détails du Séjour", margin + 5, yPosition + 6);

      yPosition += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(`Séjour : ${quote.stay.name}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Hôtel : ${quote.stay.hotel.name}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(
        `Dates : Du ${new Date(quote.checkIn).toLocaleDateString(
          "fr-FR"
        )} au ${new Date(quote.checkOut).toLocaleDateString("fr-FR")}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(`Nombre de nuits : ${nights} nuits`, margin, yPosition);

      if (quote.stay.organization) {
        yPosition += lineHeight;
        doc.text(
          `Organisation : ${quote.stay.organization.name}`,
          margin,
          yPosition
        );
      }

      yPosition += 15;

      // Section: Sous-périodes sélectionnées (si applicable)
      if (quote.selectedSubPeriods && quote.stay.subPeriods.length > 0) {
        const selectedSubPeriodIds = quote.selectedSubPeriods as string[];
        const selectedSubPeriods = quote.stay.subPeriods.filter((sp) =>
          selectedSubPeriodIds.includes(sp.id)
        );

        if (selectedSubPeriods.length > 0) {
          doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Périodes Sélectionnées", margin + 5, yPosition + 6);

          yPosition += 15;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);

          selectedSubPeriods.forEach((sp) => {
            const startDate = new Date(sp.startDate).toLocaleDateString(
              "fr-FR"
            );
            const endDate = new Date(sp.endDate).toLocaleDateString("fr-FR");
            doc.text(
              `• ${sp.name} : Du ${startDate} au ${endDate}`,
              margin + 5,
              yPosition
            );
            yPosition += lineHeight;
          });

          yPosition += 10;
        }
      }

      // Section: Chambres sélectionnées
      if (quote.quoteRooms.length > 0) {
        doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Chambres Sélectionnées", margin + 5, yPosition + 6);

        yPosition += 15;

        // Utiliser autoTable pour les chambres
        autoTable(doc, {
          startY: yPosition,
          head: [["Chambre", "Capacité", "Quantité"]],
          body: quote.quoteRooms.map((qr) => [
            qr.room.name,
            `${qr.room.capacity} personnes`,
            qr.quantity.toString(),
          ]),
          theme: "grid",
          headStyles: {
            fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold",
            halign: "left",
          },
          bodyStyles: {
            fontSize: 10,
            textColor: [textColor.r, textColor.g, textColor.b],
            halign: "left",
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30 },
          },
          margin: { left: margin, right: margin },
        });

        yPosition =
          (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
            .finalY + 10;
      }

      // Section: Détail des Prix
      const priceBreakdown = getPriceBreakdown(quote, selectedSubPeriodsData);

      if (priceBreakdown.length > 0 && quote.quoteRooms.some(qr => qr.quoteRoomOccupants && qr.quoteRoomOccupants.length > 0)) {
        // Check if we need a new page
        if (yPosition > doc.internal.pageSize.height - 80) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Détail des Prix", margin + 5, yPosition + 6);

        yPosition += 15;

        // Pour chaque chambre
        priceBreakdown.forEach((roomData) => {
          // Nom de la chambre
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
          doc.text(`Chambre: ${roomData.room.name}`, margin, yPosition);
          yPosition += 8;

          // Pour chaque période
          roomData.periods.forEach((periodData: any) => {
            if (periodData.occupants.length > 0) {
              // Nom de la période (si applicable)
              if (periodData.period) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(textColor.r, textColor.g, textColor.b);
                const startDate = new Date(periodData.period.startDate).toLocaleDateString("fr-FR");
                const endDate = new Date(periodData.period.endDate).toLocaleDateString("fr-FR");
                doc.text(`  > ${periodData.period.name} (${startDate} - ${endDate})`, margin, yPosition);
                yPosition += 7;
              }

              // Tableau des occupants pour cette période
              const occupantsData = periodData.occupants.map((occ: any) => {
                const ageText = occ.ageRange.minAge !== null && occ.ageRange.maxAge !== null
                  ? `${occ.ageRange.minAge}-${occ.ageRange.maxAge} ans`
                  : "";
                return [
                  `    ${occ.ageRange.name}`,
                  ageText,
                  `${occ.count} pers.`,
                  `${occ.pricePerPerson}€/p.`,
                  `${occ.subtotal}€`,
                ];
              });

              autoTable(doc, {
                startY: yPosition,
                body: occupantsData,
                theme: "plain",
                bodyStyles: {
                  fontSize: 9,
                  textColor: [textColor.r, textColor.g, textColor.b],
                  halign: "left",
                },
                columnStyles: {
                  0: { cellWidth: 50 },
                  1: { cellWidth: 30 },
                  2: { cellWidth: 25 },
                  3: { cellWidth: 30 },
                  4: { cellWidth: 35, halign: "right", fontStyle: "bold" },
                },
                margin: { left: margin + 10, right: margin },
              });

              yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
            }
          });

          // Total pour la chambre (si plusieurs périodes)
          if (selectedSubPeriodsData.length > 1) {
            const roomTotal = roomData.periods.reduce((total: number, period: any) =>
              total + period.occupants.reduce((periodTotal: number, occ: any) =>
                periodTotal + occ.subtotal, 0
              ), 0
            );

            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
            doc.text(`Total pour cette chambre: ${roomTotal}€`, pageWidth - margin - 50, yPosition, { align: "right" });
            yPosition += 10;
          }
        });

        yPosition += 5;
      }

      // Section: Participants
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Participants", margin + 5, yPosition + 6);

      yPosition += 15;

      // Utiliser autoTable pour les participants
      const participantsData = quote.quoteParticipants
        .filter((p) => p.count > 0)
        .map((participant) => {
          const ageText =
            participant.ageRange.minAge !== null &&
            participant.ageRange.maxAge !== null
              ? `${participant.ageRange.minAge}-${participant.ageRange.maxAge} ans`
              : "N/A";
          return [
            participant.ageRange.name,
            ageText,
            participant.count.toString(),
          ];
        });

      autoTable(doc, {
        startY: yPosition,
        head: [["Catégorie", "Tranche d'âge", "Nombre"]],
        body: participantsData,
        theme: "grid",
        headStyles: {
          fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
          halign: "left",
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [textColor.r, textColor.g, textColor.b],
          halign: "left",
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Section: Demandes spéciales
      if (quote.specialRequests) {
        doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Demandes Spéciales", margin + 5, yPosition + 6);

        yPosition += 15;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        // Gérer le texte long
        const lines = doc.splitTextToSize(
          quote.specialRequests,
          pageWidth - 2 * margin - 10
        );
        lines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        });

        yPosition += 10;
      }

      // Total
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text(
        `Prix Total Estimé : ${totalPrice.toFixed(2)} €`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );

      // Footer
      yPosition = doc.internal.pageSize.height - 30;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text(
        "Ce devis est une estimation. Le prix final sera confirmé par notre équipe.",
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 5;
      doc.text(
        `Document généré le ${new Date().toLocaleDateString(
          "fr-FR"
        )} à ${new Date().toLocaleTimeString("fr-FR")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

      // Générer le buffer PDF
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      // Retourner le PDF avec les headers appropriés
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="devis-${quote.quoteNumber}.pdf"`,
        },
      });
    } catch (pdfError) {
      console.error("Error generating PDF:", pdfError);
      return NextResponse.json(
        { error: "Failed to generate PDF", details: pdfError },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
