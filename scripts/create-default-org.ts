import { prisma } from '../lib/database/db';

async function createDefaultOrganization() {
  try {
    // Vérifier si l'organisation par défaut existe déjà
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: 'default' },
    });

    if (!existingOrg) {
      // Créer l'organisation par défaut
      const defaultOrg = await prisma.organization.create({
        data: {
          name: 'Organisation par défaut',
          slug: 'default',
          description: 'Organisation créée automatiquement pour les séjours existants',
        },
      });

      console.log('Organisation par défaut créée:', defaultOrg);

      // Mettre à jour tous les séjours sans organisation
      const updatedStays = await prisma.stay.updateMany({
        where: {
          organizationId: null,
        },
        data: {
          organizationId: defaultOrg.id,
        },
      });

      console.log(`${updatedStays.count} séjours mis à jour avec l'organisation par défaut`);
    } else {
      console.log('L\'organisation par défaut existe déjà');
      
      // Mettre à jour tous les séjours sans organisation
      const updatedStays = await prisma.stay.updateMany({
        where: {
          organizationId: null,
        },
        data: {
          organizationId: existingOrg.id,
        },
      });

      console.log(`${updatedStays.count} séjours mis à jour avec l'organisation par défaut`);
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'organisation par défaut:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultOrganization();