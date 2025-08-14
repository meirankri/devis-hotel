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

    // Utiliser calculateQuotePrice qui détecte automatiquement la bonne méthode
    const totalPrice = calculateQuotePrice({
      quoteParticipants: quote.quoteParticipants,
      quoteRooms: formattedQuoteRooms,
    });

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
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text(`Devis #${quote.quoteNumber}`, pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Date de création : ${new Date(quote.createdAt).toLocaleDateString("fr-FR")}`, pageWidth / 2, 30, { align: 'center' });
      
      yPosition = 50;
      
      // Status
      const statusText = quote.status === "PENDING" ? "En attente" :
                        quote.status === "ACCEPTED" ? "Accepté" :
                        quote.status === "REJECTED" ? "Refusé" : "Expiré";
      
      const statusColor = quote.status === "PENDING" ? { r: 217, g: 119, b: 6 } :
                         quote.status === "ACCEPTED" ? { r: 5, g: 150, b: 105 } :
                         quote.status === "REJECTED" ? { r: 220, g: 38, b: 38 } :
                         { r: 107, g: 114, b: 128 };
      
      doc.setFillColor(statusColor.r, statusColor.g, statusColor.b);
      doc.setTextColor(255, 255, 255);
      doc.roundedRect(pageWidth / 2 - 20, yPosition - 5, 40, 10, 3, 3, 'F');
      doc.setFontSize(9);
      doc.text(statusText, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Reset text color
      doc.setTextColor(textColor.r, textColor.g, textColor.b);
      
      // Section: Informations Client
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Informations Client", margin + 5, yPosition + 6);
      
      yPosition += 15;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      
      doc.text(`Nom complet : ${quote.firstName} ${quote.lastName}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Email : ${quote.email}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Téléphone : ${quote.phone}`, margin, yPosition);
      yPosition += 15;
      
      // Section: Détails du Séjour
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
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
      doc.text(`Dates : Du ${new Date(quote.checkIn).toLocaleDateString("fr-FR")} au ${new Date(quote.checkOut).toLocaleDateString("fr-FR")}`, margin, yPosition);
      yPosition += lineHeight;
      doc.text(`Nombre de nuits : ${nights} nuits`, margin, yPosition);
      
      if (quote.stay.organization) {
        yPosition += lineHeight;
        doc.text(`Organisation : ${quote.stay.organization.name}`, margin, yPosition);
      }
      
      yPosition += 15;
      
      // Section: Chambres sélectionnées
      if (quote.quoteRooms.length > 0) {
        doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Chambres Sélectionnées", margin + 5, yPosition + 6);
        
        yPosition += 15;
        
        // Utiliser autoTable pour les chambres
        autoTable(doc, {
          startY: yPosition,
          head: [['Chambre', 'Capacité', 'Quantité']],
          body: quote.quoteRooms.map((qr) => [
            qr.room.name,
            `${qr.room.capacity} personnes`,
            qr.quantity.toString()
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left'
          },
          bodyStyles: {
            fontSize: 10,
            textColor: [textColor.r, textColor.g, textColor.b],
            halign: 'left'
          },
          columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30 }
          },
          margin: { left: margin, right: margin }
        });
        
        yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
      
      // Section: Participants
      doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Participants", margin + 5, yPosition + 6);
      
      yPosition += 15;
      
      // Utiliser autoTable pour les participants
      const participantsData = quote.quoteParticipants
        .filter((p) => p.count > 0)
        .map((participant) => {
          const ageText = participant.ageRange.minAge !== null && participant.ageRange.maxAge !== null
            ? `${participant.ageRange.minAge}-${participant.ageRange.maxAge} ans`
            : "N/A";
          return [
            participant.ageRange.name,
            ageText,
            participant.count.toString()
          ];
        });
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Catégorie', 'Tranche d\'âge', 'Nombre']],
        body: participantsData,
        theme: 'grid',
        headStyles: {
          fillColor: [primaryColor.r, primaryColor.g, primaryColor.b],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [textColor.r, textColor.g, textColor.b],
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 }
        },
        margin: { left: margin, right: margin }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
      
      // Section: Demandes spéciales
      if (quote.specialRequests) {
        doc.setFillColor(lightGray.r, lightGray.g, lightGray.b);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Demandes Spéciales", margin + 5, yPosition + 6);
        
        yPosition += 15;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        // Gérer le texte long
        const lines = doc.splitTextToSize(quote.specialRequests, pageWidth - 2 * margin - 10);
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
      doc.text(`Prix Total Estimé : ${totalPrice.toFixed(2)} €`, pageWidth - margin, yPosition, { align: 'right' });
      
      // Footer
      yPosition = doc.internal.pageSize.height - 30;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(128, 128, 128);
      doc.text("Ce devis est une estimation. Le prix final sera confirmé par notre équipe.", pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Générer le buffer PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      
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
