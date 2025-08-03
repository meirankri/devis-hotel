# Système de Gestion de Réservations Hôtelières - Documentation Ultra Détaillée

## 🏨 Vue d'ensemble

Cette application est un système professionnel complet de gestion de réservations hôtelières développé spécifiquement pour gérer des séjours organisés (Pessah, Summer, Sukkot). Elle fournit une solution end-to-end permettant aux hôteliers de :

- **Configurer leurs établissements** avec chambres et images
- **Définir des tarifs dynamiques** par tranche d'âge (bébé, enfant, adulte, etc.)
- **Créer et gérer des séjours** avec réservations partielles possibles
- **Recevoir et traiter des demandes de devis** de manière professionnelle
- **Calculer automatiquement les prix** basés sur la configuration

L'application est divisée en deux parties principales :
1. **Interface publique** : Pour les clients souhaitant demander des devis
2. **Back-office** : Pour les administrateurs gérant les hôtels et devis

## 🛠️ Stack Technique Complète

### Frontend
- **Next.js 15.1.6** avec App Router (React 19)
- **TypeScript 5.7.2** en mode strict (aucun type `any` autorisé)
- **Tailwind CSS 3.4** pour le styling
- **Shadcn/ui** pour les composants UI réutilisables
- **React Hook Form 7.51** + **Zod 3.23** pour la validation des formulaires
- **next-intl 3.12** pour l'internationalisation complète (FR/EN)
- **TipTap 2.4** pour l'édition de texte riche
- **date-fns 3.6** pour la manipulation des dates

### Backend
- **tRPC 11.0** pour les API type-safe avec validation automatique
- **Prisma 5.17** comme ORM avec migrations automatiques
- **PostgreSQL** (via Neon) comme base de données
- **Lucia Auth v3** pour l'authentification sécurisée
- **Cloudflare R2** pour le stockage d'images

### Architecture
- **Ports & Adapters** (Hexagonal Architecture)
- **Domain Driven Design** (DDD)
- **SOLID Principles**
- **Separation of Concerns**

## 📁 Structure Détaillée du Projet

```
devis-hotel/
├── app/                           # Next.js App Router
│   ├── [locale]/                 # Routes internationalisées
│   │   ├── (protected)/          # Routes protégées (authentification requise)
│   │   │   ├── dashboard/        # Tableau de bord avec statistiques
│   │   │   ├── hotels/           # Gestion des hôtels
│   │   │   │   └── [hotelId]/    
│   │   │   │       └── rooms/    # Gestion des chambres par hôtel
│   │   │   ├── age-ranges/       # Configuration des tranches d'âge
│   │   │   ├── stays/            # Gestion des séjours
│   │   │   └── quotes/           # Gestion des devis
│   │   │       └── [id]/         # Détail d'un devis
│   │   └── (withLayout)/         # Routes publiques
│   │       ├── page.tsx          # Page d'accueil avec séjours actifs
│   │       └── [slug]/           # Page détail d'un séjour + formulaire devis
│   ├── api/                      # Routes API REST
│   │   ├── upload/               # Upload d'images vers Cloudflare R2
│   │   ├── documents/            # Gestion des documents
│   │   ├── auth/                 # Endpoints d'authentification
│   │   └── trpc/[trpc]/         # Endpoint tRPC
│   └── _trpc/                    # Configuration client tRPC
│
├── src/                          # Code métier (Ports & Adapters)
│   ├── domain/                   # Domaine métier (coeur de l'application)
│   │   ├── entities/             # Entités métier avec logique
│   │   │   ├── Hotel.ts         # Entité Hôtel
│   │   │   ├── Room.ts          # Entité Chambre
│   │   │   ├── AgeRange.ts      # Entité Tranche d'âge
│   │   │   ├── RoomPricing.ts   # Entité Tarification
│   │   │   └── Stay.ts          # Entité Séjour
│   │   └── ports/               # Interfaces (contrats)
│   │       ├── HotelRepository.ts
│   │       ├── RoomRepository.ts
│   │       └── ...
│   ├── application/              # Couche application
│   │   └── dto/                  # Data Transfer Objects avec validation Zod
│   │       ├── hotel.dto.ts
│   │       ├── room.dto.ts
│   │       ├── stay.dto.ts
│   │       └── quote.dto.ts
│   └── infrastructure/           # Implémentations concrètes
│       └── repositories/         # Repositories Prisma
│           ├── PrismaHotelRepository.ts
│           ├── PrismaRoomRepository.ts
│           └── ...
│
├── server/                       # Serveur tRPC
│   ├── routes/                   # Routes API organisées par domaine
│   │   ├── hotels.ts            # CRUD hôtels
│   │   ├── rooms.ts             # CRUD chambres + tarification
│   │   ├── age-ranges.ts        # CRUD tranches d'âge
│   │   ├── stays.ts             # CRUD séjours
│   │   └── quotes.ts            # Gestion des devis
│   ├── index.ts                 # Router principal
│   └── trpc.ts                  # Configuration tRPC
│
├── components/                   # Composants React réutilisables
│   ├── ui/                      # Composants UI de base (shadcn)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── image-upload.tsx     # Upload d'images avec preview
│   │   └── rich-text-editor.tsx # Éditeur TipTap
│   ├── Hotels/                  # Composants domaine hôtel
│   │   ├── HotelsList.tsx       # Liste avec actions
│   │   └── HotelForm.tsx        # Formulaire création/édition
│   ├── Rooms/                   # Composants domaine chambre
│   │   ├── RoomsList.tsx        # Liste avec sélection multiple
│   │   ├── RoomForm.tsx         # Formulaire avec capacité
│   │   └── PricingModal.tsx     # Modal tarification par âge
│   ├── AgeRanges/               # Composants tranches d'âge
│   ├── Stays/                   # Composants séjours
│   ├── Quotes/                  # Composants devis
│   └── public/                  # Composants partie publique
│       ├── Hero.tsx
│       ├── ActiveStays.tsx      # Liste des séjours actifs
│       ├── StayDetail.tsx       # Détail d'un séjour
│       └── QuoteForm.tsx        # Formulaire de demande
│
├── prisma/
│   └── schema.prisma            # Schéma de base de données
│
├── locales/                     # Fichiers de traduction
│   ├── fr.json                  # Traductions françaises
│   └── en.json                  # Traductions anglaises
│
└── lib/                         # Utilitaires et configurations
    ├── lucia/                   # Configuration auth
    ├── database/                # Client Prisma
    └── storage/                 # Services de stockage
```

## 🔐 Système d'Authentification Détaillé

### Architecture Multi-Méthodes

Le système utilise **Lucia Auth v3** avec une architecture flexible supportant :

1. **Magic Link (Email)**
   - L'utilisateur entre son email
   - Un JWT est généré avec 5 minutes de validité
   - Le lien est envoyé par SendGrid
   - Validation du token et création de session
   - Attribution automatique du plan "free_trial"

2. **OAuth Providers**
   - Google (avec refresh token)
   - GitHub
   - Facebook
   - Gestion automatique des comptes liés

### Protection des Routes

```typescript
// middleware.ts
- Vérifie toutes les requêtes
- Valide les sessions Lucia
- Renouvelle automatiquement les cookies
- Gère les redirections

// app/[locale]/(protected)/layout.tsx
- Protection côté serveur
- Vérification avant rendu
- Chargement des données utilisateur
```

### Modèles de Données Auth

```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  name                 String?
  isEmailVerified      Boolean   @default(false)
  profilePictureUrl    String?
  stripeCustomerId     String?   @unique
  nextQuotaRenewalDate DateTime?
  
  // Relations
  subscription         Subscription?
  oauthAccounts        OauthAccount[]
  sessions             Session[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  expiresAt DateTime
  expiresIn Int      // En secondes
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## 🏨 Module de Gestion des Hôtels

### Fonctionnalités

1. **CRUD Complet**
   - Création avec nom, description, adresse
   - Édition inline dans la liste
   - Suppression avec confirmation
   - Upload d'image optionnel

2. **Interface Utilisateur**
   - Grille responsive avec cards
   - Preview des images
   - Actions au survol
   - État vide avec CTA

### Entité Hotel

```typescript
// src/domain/entities/Hotel.ts
export class Hotel {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public address: string | null,
    public imageUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(params: {
    name: string;
    description?: string;
    address?: string;
    imageUrl?: string;
  }): Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'> {
    // Validation métier
    return { ...params };
  }

  update(params: Partial<...>): void {
    // Logique de mise à jour
  }
}
```

## 🛏️ Module de Gestion des Chambres

### Fonctionnalités Avancées

1. **Gestion par Hôtel**
   - Chaque hôtel a ses propres chambres
   - Navigation contextuelle
   - Breadcrumb pour la navigation

2. **Configuration des Chambres**
   - Nom descriptif
   - Capacité (nombre de personnes)
   - Description riche (TipTap)
   - Image optionnelle

3. **Système de Tarification**
   - Prix par tranche d'âge
   - Sélection multiple de chambres
   - Application groupée des tarifs
   - Affichage des prix actuels

### Interface de Tarification

```typescript
// components/Rooms/PricingModal.tsx
- Modal avec liste des tranches d'âge
- Input numérique pour chaque prix
- Validation en temps réel
- Application à plusieurs chambres
- Message d'aide pour l'utilisateur
```

## 👶 Module des Tranches d'Âge

### Configuration Flexible

Les tranches d'âge permettent une tarification granulaire :

```prisma
model AgeRange {
  id          String   @id @default(uuid())
  name        String   // Ex: "Adulte", "Enfant 3-12 ans", "Bébé"
  minAge      Int?     // Âge minimum (optionnel)
  maxAge      Int?     // Âge maximum (optionnel)
  order       Int      @default(0) // Ordre d'affichage
  
  roomPricings RoomPricing[]  // Tarifs associés
}
```

### Utilisation

1. Créer les tranches d'âge (ex: Bébé 0-2, Enfant 3-12, Adulte 13+)
2. Définir l'ordre d'affichage
3. Les tranches apparaissent automatiquement dans la tarification

## 🏖️ Module de Gestion des Séjours

### Fonctionnalités Complètes

1. **Configuration du Séjour**
   - Nom et slug (URL publique)
   - Dates de début/fin (format date uniquement)
   - Hôtel associé
   - Description riche
   - Image de présentation

2. **Réservation Partielle**
   - Option activable par séjour
   - Nombre minimum de jours
   - Nombre maximum de jours
   - Validation automatique

3. **Gestion de l'État**
   - Actif/Inactif
   - Seuls les séjours actifs sont publics
   - Toggle rapide dans la liste

### Modèle de Données

```prisma
model Stay {
  id                  String    @id @default(uuid())
  name                String
  slug                String    @unique  // URL publique
  description         String?   @db.Text
  startDate           DateTime
  endDate             DateTime
  hotelId             String
  allowPartialBooking Boolean   @default(false)
  minDays             Int?
  maxDays             Int?
  isActive            Boolean   @default(true)
  imageUrl            String?
  
  hotel               Hotel     @relation(...)
  quotes              Quote[]   // Devis associés
}
```

## 📝 Module de Devis (Quotes)

### Partie Publique

1. **Page d'Accueil**
   - Liste des séjours actifs
   - Cards avec images
   - Informations essentielles
   - CTA pour demander un devis

2. **Page de Séjour**
   - Détails complets
   - Informations sur l'hôtel
   - Formulaire de demande intégré

3. **Formulaire de Devis**
   - Informations personnelles (nom, email, téléphone)
   - Sélection des dates (avec contraintes)
   - Compteurs pour chaque tranche d'âge
   - Demandes spéciales
   - Validation complète Zod

### Back-Office

1. **Liste des Devis**
   - Filtrage par statut
   - Vue synthétique
   - Actions rapides (accepter/refuser)
   - Badges de statut colorés

2. **Détail d'un Devis**
   - Informations complètes
   - Participants détaillés
   - Calcul automatique du prix
   - Actions de changement de statut
   - Impression

### Statuts des Devis

```typescript
enum QuoteStatus {
  PENDING   // En attente de traitement
  ACCEPTED  // Accepté par l'admin
  REJECTED  // Refusé
  EXPIRED   // Expiré
}
```

### Calcul Automatique des Prix

```typescript
// components/Quotes/QuoteDetail.tsx
const calculatePrice = () => {
  // 1. Calcul du nombre de nuits
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  
  // 2. Pour chaque participant
  quote.quoteParticipants.forEach((participant) => {
    // 3. Trouver les prix pour cette tranche d'âge
    const prices = getRoomPricesForAgeRange(participant.ageRangeId);
    
    // 4. Calculer le prix moyen
    const avgPrice = prices.reduce((sum, price) => sum + price) / prices.length;
    
    // 5. Total = prix × nombre × nuits
    total += avgPrice * participant.count * nights;
  });
};
```

## 🖼️ Système de Stockage d'Images

### Architecture

Le système utilise **Cloudflare R2** (compatible S3) :

```typescript
// lib/storage/CloudflareStorageService.ts
export class CloudflareStorageService implements StorageService {
  async uploadFile(file: File, options: UploadOptions) {
    // 1. Génération nom unique
    const fileName = `${options.entityType}/${options.entityId}/${uuid()}_${file.name}`;
    
    // 2. Upload vers R2
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: fileName,
      Body: file,
      ContentType: file.type,
    });
    
    // 3. Retour URL publique
    return {
      url: `${process.env.CLOUDFLARE_URL}/${fileName}`,
      size: file.size,
      newFileName: fileName,
    };
  }
}
```

### Composant ImageUpload

```typescript
// components/ui/image-upload.tsx
- Preview en temps réel
- Validation taille/type
- Progress bar pendant upload
- Suppression possible
- Totalement optionnel
```

## 🌍 Internationalisation Complète

### Configuration

```typescript
// i18n.config.ts
export const locales = ['fr', 'en'] as const;
export const defaultLocale = 'fr';

// Middleware avec détection auto
const locale = getLocale(request) || defaultLocale;
```

### Structure des Traductions

```json
// locales/fr.json
{
  "Hotels": {
    "title": "Gestion des hôtels",
    "addHotel": "Ajouter un hôtel",
    "hotelName": "Nom de l'hôtel",
    // ... toutes les chaînes
  },
  "Rooms": {
    "title": "Gestion des chambres",
    "capacity": "Capacité",
    "setPrices": "Définir les tarifs",
    "pricingHelp": "Saisissez un prix pour chaque tranche d'âge..."
  }
  // ... autres modules
}
```

### Utilisation

```typescript
// Dans les composants
const t = useTranslations('Hotels');
return <h1>{t('title')}</h1>;

// Côté serveur
const t = await getTranslations('Hotels');
```

## 🔄 API tRPC Type-Safe

### Architecture

```typescript
// server/index.ts
export const appRouter = router({
  hotels: hotelsRouter,
  rooms: roomsRouter,
  ageRanges: ageRangesRouter,
  stays: staysRouter,
  quotes: quotesRouter,
});

// Type exporté pour le client
export type AppRouter = typeof appRouter;
```

### Exemple de Router

```typescript
// server/routes/rooms.ts
export const roomsRouter = router({
  getByHotelId: protectedProcedure
    .input(z.object({ hotelId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await roomRepository.findByHotelId(input.hotelId);
    }),
    
  updateMultiplePricing: protectedProcedure
    .input(z.object({
      roomIds: z.array(z.string().uuid()),
      ageRangeId: z.string().uuid(),
      price: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      // Mise à jour en masse
      for (const roomId of input.roomIds) {
        await pricingRepository.upsert({
          roomId,
          ageRangeId: input.ageRangeId,
          price: input.price,
        });
      }
    }),
});
```

### Utilisation Client

```typescript
// components/Rooms/RoomsList.tsx
const { data: rooms, isLoading, refetch } = trpc.rooms.getByHotelId.useQuery({ 
  hotelId 
});

const updatePricing = trpc.rooms.updateMultiplePricing.useMutation({
  onSuccess: () => {
    toast({ title: "Prix mis à jour" });
    refetch();
  }
});
```

## 📊 Dashboard et Statistiques

Le dashboard affiche en temps réel :

1. **Nombre d'hôtels** configurés
2. **Nombre de devis** reçus
3. **Séjours actifs**
4. **Revenu total** (devis acceptés)
5. **Derniers devis** avec aperçu rapide
6. **Actions rapides** vers les modules principaux

## 🚀 Guide de Démarrage Rapide

### 1. Installation

```bash
# Cloner le repo
git clone [repo-url]
cd devis-hotel

# Installer les dépendances
npm install

# Configuration environnement
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 2. Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Seed initial
npx prisma db seed
```

### 3. Lancement

```bash
# Mode développement
npm run dev

# Build production
npm run build
npm start
```

### 4. Première Configuration

1. **Créer un compte admin** via /sign-in
2. **Configurer les tranches d'âge** (Bébé, Enfant, Adulte...)
3. **Ajouter un hôtel** avec ses informations
4. **Créer des chambres** pour cet hôtel
5. **Définir les tarifs** par tranche d'âge
6. **Créer un séjour** avec dates et options
7. **Activer le séjour** pour le rendre public

## 🔧 Configuration Avancée

### Variables d'Environnement

```env
# Base
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth
JWT_SECRET=secret-long-et-securise
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (SendGrid)
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@votre-domaine.com

# Storage (Cloudflare R2)
CLOUDFLARE_BUCKET=hotel-images
CLOUDFLARE_URL=https://pub-xxx.r2.dev
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_ENDPOINT=https://xxx.r2.cloudflarestorage.com
CLOUDFLARE_REGION=auto
```

### Personnalisation

1. **Thème et Couleurs**
   - Modifier `tailwind.config.js`
   - Ajuster les gradients dans les composants

2. **Types de Séjours**
   - Adapter les labels dans les traductions
   - Modifier la logique métier si nécessaire

3. **Calcul des Prix**
   - Logique dans `QuoteDetail.tsx`
   - Possibilité d'ajouter des règles complexes

## 🛡️ Sécurité

### Mesures Implémentées

1. **Authentification**
   - Sessions sécurisées Lucia
   - Cookies httpOnly et secure
   - CSRF protection native

2. **Validation**
   - Schémas Zod stricts
   - Validation côté client ET serveur
   - Types TypeScript stricts

3. **Autorisation**
   - Middleware de protection
   - Vérification des permissions
   - Routes publiques/privées séparées

4. **Stockage**
   - URLs signées Cloudflare
   - Validation des types de fichiers
   - Limite de taille (5MB)

## 📈 Évolutions Possibles

1. **Gestion des Réservations**
   - Conversion devis → réservation
   - Calendrier de disponibilité
   - Gestion des paiements Stripe

2. **Multi-Tenancy**
   - Plusieurs organisations
   - Comptes utilisateurs par hôtel
   - Permissions granulaires

3. **Reporting Avancé**
   - Tableaux de bord analytiques
   - Export Excel/PDF
   - Statistiques détaillées

4. **API Publique**
   - Endpoints REST pour intégrations
   - Webhooks pour événements
   - Documentation Swagger

## 🐛 Troubleshooting

### Erreurs Communes

1. **"Invalid datetime"**
   - Vérifier le format des dates (YYYY-MM-DD)
   - Les champs date n'acceptent pas l'heure

2. **Images non affichées**
   - Vérifier les variables Cloudflare
   - Tester l'upload manuel
   - Vérifier les CORS

3. **"Quota exceeded"**
   - Système de quotas actif
   - Vérifier l'abonnement utilisateur
   - Ajuster dans la DB si nécessaire

### Logs et Debugging

```typescript
// Activer les logs détaillés
logger({ 
  message: "Description", 
  context: data 
}).info();

// Logs tRPC
export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error('tRPC Error:', error);
    return shape;
  },
});
```

## 📞 Support et Contact

Pour toute question ou problème :

1. Consulter cette documentation
2. Vérifier les logs serveur
3. Tester en environnement local
4. Créer une issue sur le repository

---

**Note** : Cette application est conçue pour être facilement extensible et maintenue. L'architecture Ports & Adapters garantit une séparation claire des responsabilités et facilite les tests et évolutions futures.