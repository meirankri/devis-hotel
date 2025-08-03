import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const quote = await prisma.quote.findUnique({
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
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Calculer le prix total
    const nights = Math.ceil(
      (new Date(quote.checkOut).getTime() - new Date(quote.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let totalPrice = 0;

    quote.quoteParticipants.forEach((participant) => {
      if (participant.count > 0) {
        const roomPrices: number[] = [];
        
        quote.quoteRooms.forEach((qr) => {
          const pricing = qr.room.roomPricings.find(
            (rp) => rp.ageRangeId === participant.ageRangeId
          );
          if (pricing) {
            roomPrices.push(Number(pricing.price) * qr.quantity);
          }
        });

        if (roomPrices.length > 0) {
          const avgPrice = roomPrices.reduce((sum, price) => sum + price, 0) / roomPrices.length;
          totalPrice += avgPrice * participant.count * nights;
        }
      }
    });

    // Générer le HTML pour le PDF
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0066cc;
            margin-bottom: 10px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        .section h2 {
            color: #0066cc;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            margin-bottom: 5px;
        }
        .info-value {
            color: #333;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table th, .table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .table th {
            background-color: #0066cc;
            color: white;
        }
        .table tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .total {
            text-align: right;
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin-top: 20px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            ${quote.status === 'PENDING' ? 'background-color: #fef3c7; color: #d97706;' : ''}
            ${quote.status === 'ACCEPTED' ? 'background-color: #d1fae5; color: #059669;' : ''}
            ${quote.status === 'REJECTED' ? 'background-color: #fee2e2; color: #dc2626;' : ''}
            ${quote.status === 'EXPIRED' ? 'background-color: #e5e7eb; color: #6b7280;' : ''}
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Devis #${quote.quoteNumber}</h1>
        <p>Date de création : ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
        <span class="status">${quote.status === 'PENDING' ? 'En attente' : quote.status === 'ACCEPTED' ? 'Accepté' : quote.status === 'REJECTED' ? 'Refusé' : 'Expiré'}</span>
    </div>

    <div class="section">
        <h2>Informations Client</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Nom complet</div>
                <div class="info-value">${quote.firstName} ${quote.lastName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${quote.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Téléphone</div>
                <div class="info-value">${quote.phone}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Détails du Séjour</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Séjour</div>
                <div class="info-value">${quote.stay.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Hôtel</div>
                <div class="info-value">${quote.stay.hotel.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Dates</div>
                <div class="info-value">
                    Du ${new Date(quote.checkIn).toLocaleDateString('fr-FR')} 
                    au ${new Date(quote.checkOut).toLocaleDateString('fr-FR')}
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Nombre de nuits</div>
                <div class="info-value">${nights} nuits</div>
            </div>
            ${quote.stay.organization ? `
            <div class="info-item">
                <div class="info-label">Organisation</div>
                <div class="info-value">${quote.stay.organization.name}</div>
            </div>
            ` : ''}
        </div>
    </div>

    ${quote.quoteRooms.length > 0 ? `
    <div class="section">
        <h2>Chambres Sélectionnées</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Chambre</th>
                    <th>Capacité</th>
                    <th>Quantité</th>
                </tr>
            </thead>
            <tbody>
                ${quote.quoteRooms.map((qr: any) => `
                <tr>
                    <td>${qr.room.name}</td>
                    <td>${qr.room.capacity} personnes</td>
                    <td>${qr.quantity}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>Participants</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Catégorie</th>
                    <th>Tranche d'âge</th>
                    <th>Nombre</th>
                </tr>
            </thead>
            <tbody>
                ${quote.quoteParticipants.filter((p: any) => p.count > 0).map((participant: any) => `
                <tr>
                    <td>${participant.ageRange.name}</td>
                    <td>${participant.ageRange.minAge !== null && participant.ageRange.maxAge !== null 
                        ? `${participant.ageRange.minAge}-${participant.ageRange.maxAge} ans` 
                        : 'N/A'}</td>
                    <td>${participant.count}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${quote.specialRequests ? `
    <div class="section">
        <h2>Demandes Spéciales</h2>
        <p>${quote.specialRequests}</p>
    </div>
    ` : ''}

    <div class="total">
        Prix Total Estimé : ${totalPrice.toFixed(2)} €
    </div>

    <div class="footer">
        <p>Ce devis est une estimation. Le prix final sera confirmé par notre équipe.</p>
        <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    </div>
</body>
</html>
    `;

    // Convertir le HTML en PDF en utilisant l'API de conversion
    // Pour cette démonstration, nous retournons le HTML avec les headers appropriés pour le téléchargement
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="devis-${quote.quoteNumber}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}