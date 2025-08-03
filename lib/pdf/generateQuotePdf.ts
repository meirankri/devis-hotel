import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface QuoteData {
  quote: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    checkInDate: Date;
    checkOutDate: Date;
    status: string;
    createdAt: Date;
    stay: {
      name: string;
      hotel: {
        name: string;
        address: string | null;
      };
    };
    quoteParticipants: Array<{
      count: number;
      ageRange: {
        id: string;
        name: string;
        minAge: number | null;
        maxAge: number | null;
      };
    }>;
  };
  roomPrices: Array<{
    ageRangeId: string;
    roomId: string;
    price: number;
  }>;
}

export function generateQuotePdf({ quote, roomPrices }: QuoteData): Blob {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(33, 33, 33);
  doc.text('DEVIS', 105, 30, { align: 'center' });
  
  // Hotel info
  doc.setFontSize(16);
  doc.text(quote.stay.hotel.name, 105, 45, { align: 'center' });
  
  if (quote.stay.hotel.address) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(quote.stay.hotel.address, 105, 52, { align: 'center' });
  }
  
  // Quote info box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(15, 65, 180, 40);
  
  // Left side - Customer info
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text('Devis N°:', 20, 75);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.id.slice(0, 8).toUpperCase(), 45, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Client:', 20, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(`${quote.firstName} ${quote.lastName}`, 45, 85);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Email:', 20, 95);
  doc.text(quote.email, 45, 95);
  
  doc.text('Téléphone:', 20, 100);
  doc.text(quote.phone, 45, 100);
  
  // Right side - Stay info
  doc.text('Séjour:', 110, 75);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.stay.name, 135, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Arrivée:', 110, 85);
  doc.text(format(new Date(quote.checkInDate), 'dd/MM/yyyy', { locale: fr }), 135, 85);
  
  doc.text('Départ:', 110, 95);
  doc.text(format(new Date(quote.checkOutDate), 'dd/MM/yyyy', { locale: fr }), 135, 95);
  
  doc.text('Date devis:', 110, 100);
  doc.text(format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: fr }), 135, 100);
  
  // Calculate nights
  const nights = Math.ceil(
    (new Date(quote.checkOutDate).getTime() - new Date(quote.checkInDate).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  // Participants table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Participants', 15, 120);
  
  const participantsData = quote.quoteParticipants.map((participant: any) => {
    const ageRangeText = participant.ageRange.minAge !== null && participant.ageRange.maxAge !== null
      ? `${participant.ageRange.name} (${participant.ageRange.minAge}-${participant.ageRange.maxAge} ans)`
      : participant.ageRange.name;
    
    // Find average price for this age range
    const pricesForAgeRange = roomPrices.filter(p => p.ageRangeId === participant.ageRange.id);
    console.log(`Prices for age range ${participant.ageRange.name}:`, pricesForAgeRange);
    
    const avgPrice = pricesForAgeRange.length > 0
      ? pricesForAgeRange.reduce((sum, p) => sum + p.price, 0) / pricesForAgeRange.length
      : 0;
    
    // Prix par séjour complet, pas par nuit
    const totalPrice = avgPrice * participant.count;
    
    return [
      ageRangeText,
      participant.count.toString(),
      avgPrice > 0 ? `${avgPrice.toFixed(2)} €` : 'Non défini',
      avgPrice > 0 ? `${totalPrice.toFixed(2)} €` : 'À définir'
    ];
  });
  
  doc.autoTable({
    startY: 125,
    head: [['Catégorie', 'Nombre', 'Prix/séjour', 'Total']],
    body: participantsData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });
  
  // Calculate total
  const totalAmount = participantsData.reduce((sum, row) => {
    const priceText = row[3]; // Index 3 maintenant car on a retiré la colonne Durée
    if (priceText === 'À définir') return sum;
    return sum + parseFloat(priceText.replace(' €', ''));
  }, 0);
  
  // Total box
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(110, finalY, 85, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`TOTAL TTC (${nights} nuits):`, 115, finalY + 13);
  doc.setFontSize(16);
  doc.text(`${totalAmount.toFixed(2)} €`, 190, finalY + 13, { align: 'right' });
  
  // Check if some prices are not defined
  const hasUndefinedPrices = participantsData.some(row => row[3] === 'À définir');
  
  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  if (hasUndefinedPrices) {
    doc.setTextColor(255, 0, 0);
    doc.text('ATTENTION: Certains tarifs ne sont pas définis. Veuillez les configurer dans la gestion des chambres.', 105, finalY + 30, { align: 'center' });
    doc.setTextColor(100, 100, 100);
    doc.text('Ce devis est valable 30 jours à compter de sa date d\'émission.', 105, finalY + 40, { align: 'center' });
    doc.text('Conditions générales de vente disponibles sur demande.', 105, finalY + 45, { align: 'center' });
  } else {
    doc.text('Ce devis est valable 30 jours à compter de sa date d\'émission.', 105, finalY + 35, { align: 'center' });
    doc.text('Conditions générales de vente disponibles sur demande.', 105, finalY + 40, { align: 'center' });
  }
  
  // Return as blob
  return doc.output('blob');
}