# Système de Gestion de Réservations Hôtelières - Documentation Ultra Détaillée

## 🏨 Vue d'ensemble

Cette application est un système professionnel complet de gestion de réservations hôtelières développé spécifiquement pour gérer des séjours organisés (Pessah, Summer, Sukkot). Elle fournit une solution end-to-end permettant aux hôteliers de :

- **Gérer plusieurs organisations** avec isolation complète des données
- **Configurer leurs établissements** avec chambres et galeries d'images
- **Définir des tarifs dynamiques** par tranche d'âge (bébé, enfant, adulte, etc.)
- **Créer et gérer des séjours** avec réservations partielles possibles
- **Recevoir et traiter des demandes de devis** via un formulaire multi-étapes sophistiqué
- **Calculer automatiquement les prix** avec répartition détaillée par chambre
- **Générer des devis PDF** professionnels

L'application est divisée en deux parties principales :
1. **Interface publique** : Pour les clients souhaitant demander des devis
2. **Back-office** : Pour les administrateurs gérant les hôtels, séjours et devis

### Architecture Multi-Organisation

Le système supporte **plusieurs organisations** avec une isolation totale des données :
- Chaque organisation a ses propres hôtels, chambres, tranches d'âge et séjours
- URLs publiques par organisation : `/[orga]/[slug]`
- Slug unique par organisation (pas globalement)
- Comptes utilisateurs liés à une organisation

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
- **framer-motion 12.23** pour les animations (Modal, transitions)
- **lucide-react 0.335** pour les icônes

### Backend
- **tRPC 11.0** pour les API type-safe avec validation automatique
- **Prisma 5.17** comme ORM avec migrations automatiques
- **PostgreSQL** (via Neon) comme base de données
- **Lucia Auth v3** pour l'authentification sécurisée
- **Cloudflare R2** pour le stockage d'images (S3-compatible)

### Génération de Documents
- **jsPDF 3.0** + **jspdf-autotable 5.0** pour la génération de PDF professionnels

### Architecture
- **Ports & Adapters** (Hexagonal Architecture)
- **Domain Driven Design** (DDD)
- **SOLID Principles**
- **Separation of Concerns**

## 📁 Structure Détaillée du Projet

```
devis-hotel/
├── app/                           # Next.js App Router
│   ├── [locale]/                 # Routes internationalisées (fr/en)
│   │   ├── (protected)/          # Routes protégées (authentification requise)
│   │   │   └── dashboard/        # Back-office administrateur
│   │   │       ├── page.tsx      # Statistiques et dashboard
│   │   │       ├── hotels/       # Gestion des hôtels
│   │   │       │   └── [hotelId]/rooms/  # Gestion chambres par hôtel
│   │   │       ├── stays/        # Gestion des séjours
│   │   │       └── quotes/       # Gestion des devis
│   │   │           └── [id]/     # Détail d'un devis admin
│   │   ├── (withLayout)/         # Routes publiques avec layout
│   │   │   ├── (home)/           # Page d'accueil
│   │   │   │   └── page.tsx      # Liste des séjours actifs
│   │   │   ├── (pages)/          # Pages statiques (contact, about, etc.)
│   │   │   └── [orga]/[slug]/    # Page séjour par organisation + formulaire
│   │   └── quotes/[id]/          # Vue publique d'un devis généré
│   ├── api/                      # Routes API REST
│   │   ├── upload/               # Upload d'images vers Cloudflare R2
│   │   ├── oauth/                # OAuth callbacks (Google, GitHub, Facebook)
│   │   │   ├── google/
│   │   │   ├── github/
│   │   │   └── facebook/
│   │   ├── quotes/[id]/pdf/      # Génération et téléchargement PDF
│   │   └── trpc/[trpc]/          # Endpoint tRPC
│   └── _trpc/                    # Configuration client tRPC
│
├── src/                          # Code métier (Ports & Adapters)
│   ├── domain/                   # Domaine métier (cœur de l'application)
│   │   ├── entities/             # Entités métier avec logique
│   │   │   ├── Hotel.ts
│   │   │   ├── Room.ts
│   │   │   ├── AgeRange.ts
│   │   │   ├── RoomPricing.ts
│   │   │   └── Stay.ts
│   │   └── ports/                # Interfaces (contrats)
│   │       ├── HotelRepository.ts
│   │       ├── RoomRepository.ts
│   │       ├── RoomPricingRepository.ts
│   │       └── AgeRangeRepository.ts
│   ├── application/              # Couche application
│   │   ├── dto/                  # Data Transfer Objects avec validation Zod
│   │   │   ├── hotel.dto.ts
│   │   │   ├── room.dto.ts
│   │   │   ├── age-range.dto.ts
│   │   │   ├── stay.dto.ts
│   │   │   └── quote.dto.ts
│   │   └── use-cases/            # Use cases métier
│   │       └── hotel/
│   │           ├── CreateHotelUseCase.ts
│   │           ├── GetHotelsUseCase.ts
│   │           ├── UpdateHotelUseCase.ts
│   │           └── DeleteHotelUseCase.ts
│   └── infrastructure/           # Implémentations concrètes
│       └── repositories/         # Repositories Prisma
│           ├── PrismaHotelRepository.ts
│           ├── PrismaRoomRepository.ts
│           ├── PrismaRoomPricingRepository.ts
│           └── PrismaAgeRangeRepository.ts
│
├── server/                       # Serveur tRPC
│   ├── routes/                   # Routers par domaine
│   │   ├── hotels.ts             # CRUD hôtels
│   │   ├── rooms.ts              # CRUD chambres + tarification
│   │   ├── age-ranges.ts         # CRUD tranches d'âge
│   │   ├── stays.ts              # CRUD séjours + images
│   │   ├── quotes.ts             # Gestion devis + statuts
│   │   └── contact.ts            # Formulaire de contact
│   ├── index.ts                  # Router principal (appRouter)
│   └── trpc.ts                   # Configuration tRPC
│
├── components/                   # Composants React réutilisables
│   ├── ui/                       # Composants UI de base (shadcn + custom)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx             # Modal réutilisable avec animations
│   │   ├── carousel.tsx          # Carousel d'images
│   │   ├── image-upload.tsx      # Upload simple avec preview
│   │   ├── multi-image-upload.tsx # Upload multiple pour galeries
│   │   └── rich-text-editor.tsx  # Éditeur TipTap
│   ├── Hotels/                   # Composants domaine hôtel
│   │   ├── HotelsList.tsx
│   │   └── HotelForm.tsx
│   ├── Rooms/                    # Composants domaine chambre
│   │   ├── RoomsList.tsx         # Liste avec sélection multiple
│   │   ├── RoomForm.tsx          # Formulaire avec capacité
│   │   └── PricingModal.tsx      # Modal tarification par âge
│   ├── AgeRanges/                # Composants tranches d'âge
│   │   ├── AgeRangesList.tsx
│   │   └── AgeRangeForm.tsx
│   ├── Stays/                    # Composants séjours
│   │   ├── StaysList.tsx         # Liste avec toggle actif
│   │   └── StayForm.tsx          # Formulaire avec multi-image
│   ├── Quotes/                   # Composants devis (admin)
│   │   ├── QuotesList.tsx        # Liste avec filtres statut
│   │   └── QuoteDetail.tsx       # Détail + actions admin
│   ├── public/                   # Composants partie publique
│   │   ├── Hero.tsx
│   │   ├── ActiveStays.tsx       # Liste séjours actifs (cards)
│   │   ├── StayDetailLuxury.tsx  # Page détail séjour (design moderne)
│   │   ├── QuoteFormV2.tsx       # Wrapper formulaire multi-étapes
│   │   ├── QuoteDetailView.tsx   # Vue publique d'un devis
│   │   └── ImageGalleryV2.tsx    # Galerie images avec carousel
│   └── quote/                    # Système formulaire multi-étapes
│       ├── MultiStepQuoteForm.tsx # Orchestrateur principal
│       ├── steps/                # Les 3 étapes du formulaire
│       │   ├── ParticipantsStep.tsx  # Étape 1: Sélection participants
│       │   ├── RoomsStep.tsx         # Étape 2: Sélection chambres
│       │   └── AssignmentStep.tsx    # Étape 3: Répartition par chambre
│       ├── ParticipantSelector.tsx
│       ├── RoomCard.tsx
│       ├── RoomInstance.tsx
│       └── RoomSelector.tsx
│
├── hooks/                        # Custom React Hooks
│   ├── useMultiStepQuoteForm.ts  # Hook formulaire multi-étapes
│   ├── useRoomOccupancy.ts       # Calcul occupation chambres
│   ├── usePriceCalculation.ts    # Calcul prix
│   ├── useSession.tsx            # Gestion session utilisateur
│   └── useQuota.tsx              # Gestion quotas
│
├── types/                        # TypeScript Types globaux
│   ├── quote.ts                  # Types pour devis
│   ├── multi-step-form.ts        # Types formulaire multi-étapes
│   └── index.ts
│
├── lib/                          # Utilitaires et configurations
│   ├── lucia/                    # Auth Lucia v3
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── oauth.ts              # Configuration OAuth providers
│   │   └── prismaAdapter.ts
│   ├── storage/                  # Services stockage
│   │   ├── StorageService.ts     # Interface
│   │   ├── CloudflareStorageService.ts
│   │   └── FirebaseStorageService.ts
│   ├── database/
│   │   ├── prismaClient.ts
│   │   └── db.ts
│   ├── pdf/
│   │   └── generateQuotePdf.ts   # Génération PDF devis
│   └── email.ts                  # Service email (SendGrid/Brevo)
│
├── utils/                        # Fonctions utilitaires
│   ├── priceCalculator.ts
│   ├── logger.ts
│   ├── cloudflare.ts
│   └── ...
│
├── prisma/
│   └── schema.prisma             # Schéma de base de données
│
└── locales/                      # Fichiers de traduction i18n
    ├── fr.json                   # Traductions françaises
    └── en.json                   # Traductions anglaises
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
  organizationId       String?   // Multi-organisation

  // Relations
  organization         Organization? @relation(...)
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

model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique      // Pour URLs publiques
  description String?  @db.Text
  logoUrl     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  hotels      Hotel[]
  ageRanges   AgeRange[]
  stays       Stay[]
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
  id                  String      @id @default(uuid())
  name                String
  slug                String      // URL publique (unique par organisation)
  description         String?     @db.Text
  startDate           DateTime
  endDate             DateTime
  hotelId             String
  organizationId      String?     // Multi-organisation
  allowPartialBooking Boolean     @default(false)
  minDays             Int?
  maxDays             Int?
  isActive            Boolean     @default(true)
  imageUrl            String?     // Image principale (rétrocompatibilité)

  hotel               Hotel       @relation(...)
  organization        Organization? @relation(...)
  images              StayImage[] // Galerie d'images
  quotes              Quote[]     // Devis associés

  @@unique([organizationId, slug]) // Slug unique par organisation
}

model StayImage {
  id        String   @id @default(uuid())
  stayId    String
  url       String   // URL Cloudflare R2
  order     Int      @default(0)    // Ordre d'affichage
  isMain    Boolean  @default(false) // Image principale
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stay      Stay     @relation(fields: [stayId], references: [id], onDelete: Cascade)

  @@index([stayId])
}
```

### Galerie d'Images Multiple

**Fonctionnalités:**
- Upload multiple d'images pour chaque séjour
- Désignation d'une image principale (`isMain`)
- Ordre personnalisable (drag & drop)
- Suppression automatique de Cloudflare R2

**Composants:**
```typescript
// components/ui/multi-image-upload.tsx
- Upload multiple avec preview
- Glisser-déposer pour réorganiser
- Désignation de l'image principale
- Indicateur de taille et progression

// components/public/ImageGalleryV2.tsx
- Carousel avec navigation
- Lightbox pour agrandissement
- Thumbnails cliquables
- Affichage responsive
```

**API:**
```typescript
// server/routes/stays.ts
stays.uploadImages({
  stayId,
  images: File[]
})

stays.deleteImage({ imageId })

stays.setMainImage({ imageId })

stays.reorderImages({
  stayId,
  imageIds: string[] // Ordre souhaité
})
```

## 📝 Module de Devis (Quotes)

### Nouveau Système de Chambres

**Architecture refonte complète:**

Le système a été entièrement revu pour permettre une **répartition précise des participants par chambre**. Au lieu de simplement compter les participants par tranche d'âge, le nouveau système associe explicitement chaque chambre et ses occupants.

**Modèles de Données:**

```prisma
model Quote {
  id              String      @id @default(uuid())
  stayId          String
  firstName       String
  lastName        String
  email           String
  phone           String?
  checkIn         DateTime
  checkOut        DateTime
  specialRequests String?     @db.Text
  status          QuoteStatus @default(PENDING)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  stay            Stay        @relation(...)
  quoteRooms      QuoteRoom[] // Nouveau: chambres sélectionnées
}

model QuoteRoom {
  id          String   @id @default(uuid())
  quoteId     String
  roomId      String
  quantity    Int      @default(1) // Nombre d'instances de cette chambre

  quote       Quote    @relation(...)
  room        Room     @relation(...)
  quoteRoomOccupants QuoteRoomOccupant[] // Occupants par chambre

  @@index([quoteId])
}

model QuoteRoomOccupant {
  id          String   @id @default(uuid())
  quoteRoomId String   // Référence à l'instance de chambre
  ageRangeId  String   // Tranche d'âge
  count       Int      // Nombre de personnes de cette tranche

  quoteRoom   QuoteRoom @relation(...)
  ageRange    AgeRange  @relation(...)

  @@unique([quoteRoomId, ageRangeId]) // Une tranche d'âge par chambre
}
```

### Formulaire de Devis Multi-Étapes ⭐

**Le système de demande de devis utilise maintenant un formulaire sophistiqué en 3 étapes**

#### Architecture Générale

**Hook personnalisé: `useMultiStepQuoteForm.ts`**
```typescript
export const useMultiStepQuoteForm = (stay: Stay, rooms: Room[], ageRanges: AgeRange[]) => {
  // État du formulaire
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.PARTICIPANTS)
  const [participants, setParticipants] = useState<ParticipantData[]>([])
  const [selectedRooms, setSelectedRooms] = useState<SelectedRoom[]>([])
  const [roomAssignments, setRoomAssignments] = useState<RoomAssignment[]>([])

  // Fonctions de navigation
  const goNext = () => { /* Validation puis passage à l'étape suivante */ }
  const goPrevious = () => { /* Retour étape précédente */ }
  const goToStep = (step: FormStep) => { /* Aller à une étape spécifique */ }

  // Fonctions de mise à jour
  const updateParticipantCount = (ageRangeId: string, count: number) => { /* ... */ }
  const updateRoomQuantity = (roomId: string, quantity: number) => { /* ... */ }
  const updateRoomAssignment = (assignmentId: string, updates: Partial<RoomAssignment>) => { /* ... */ }

  // Validation
  const validateStep = (step: FormStep): boolean => { /* ... */ }

  // Calcul du prix
  const calculatePriceBreakdown = (): PriceBreakdown => { /* ... */ }

  return { /* ... */ }
}
```

#### Étape 1: Sélection des Participants (`ParticipantsStep.tsx`)

**Interface:**
- Compteurs +/- pour chaque tranche d'âge
- Affichage dynamique des tranches d'âge configurées pour l'organisation
- Total des participants calculé en temps réel
- Indicateur visuel du total

**Validation:**
- Au moins 1 participant requis pour continuer

**Données collectées:**
```typescript
type ParticipantData = {
  ageRangeId: string
  ageRangeName: string
  count: number
  priceRange: { min: number, max: number } // Prix moyen pour estimation
}
```

#### Étape 2: Sélection des Chambres (`RoomsStep.tsx`)

**Interface:**
- Grille de cards pour chaque type de chambre disponible
- Informations affichées par chambre:
  - Nom et description
  - Capacité maximale
  - Image
  - Prix par tranche d'âge
- Compteur de quantité par type de chambre
- Indicateurs en temps réel:
  - Capacité totale sélectionnée
  - Nombre de participants (de l'étape 1)
  - Warning si capacité insuffisante

**Validation:**
- Capacité totale ≥ nombre de participants
- Au moins 1 chambre sélectionnée
- Limite intelligente: maximum 1.5x le nombre de participants (évite sélections aberrantes)

**Données collectées:**
```typescript
type SelectedRoom = {
  roomId: string
  roomName: string
  capacity: number
  quantity: number // Nombre d'instances
  prices: { ageRangeId: string, price: number }[]
}
```

#### Étape 3: Répartition dans les Chambres (`AssignmentStep.tsx`)

**Interface:**
- Pour chaque instance de chambre sélectionnée
- Compteurs par tranche d'âge pour chaque chambre
- Indicateurs visuels avancés:
  - **Progression globale**: participants assignés / total
  - **Occupancy par chambre**: visualisation remplissage
  - **Participants restants par tranche d'âge**: combien il reste à assigner
  - **Avertissement** si une chambre est surchargée (> capacité)
- **Calcul du prix en temps réel** basé sur les assignations
- Récapitulatif détaillé:
  - Prix par chambre
  - Prix par tranche d'âge
  - Total TTC

**Validation:**
- 100% des participants doivent être assignés
- Aucune chambre ne peut dépasser sa capacité
- Au moins 1 personne par chambre sélectionnée

**Données collectées:**
```typescript
type RoomAssignment = {
  id: string // ID unique de l'instance
  roomId: string
  roomName: string
  capacity: number
  occupants: {
    ageRangeId: string
    ageRangeName: string
    count: number
    unitPrice: number
  }[]
}
```

#### Navigation Intelligente

**Indicateur d'étapes:**
- Affichage des 3 étapes avec progression
- Étapes cliquables pour revenir en arrière
- Étape courante mise en évidence
- Checkmark pour étapes complétées

**Boutons de navigation:**
- "Retour" : Revient à l'étape précédente (sauf étape 1)
- "Suivant" : Valide et passe à l'étape suivante
- "Soumettre" : Envoie le devis (étape 3 uniquement)

**État sauvegardé:**
- Les données sont conservées en naviguant entre les étapes
- Possibilité de revenir modifier les étapes précédentes
- Recalcul automatique si changements

### Routes Publiques

1. **Page d'Accueil** (`/[locale]`)
   - Liste des séjours actifs uniquement
   - Cards avec images et informations essentielles
   - CTA pour voir les détails et demander un devis

2. **Page de Séjour** (`/[locale]/[orga]/[slug]`)
   - Design luxueux avec gradients (StayDetailLuxury.tsx)
   - Galerie d'images complète avec carousel
   - Détails du séjour (dates, description riche)
   - Informations sur l'hôtel
   - Statistiques (capacité totale, durée)
   - Bouton d'action pour ouvrir le formulaire de devis

3. **Formulaire de Devis** (Modal Multi-Étapes)
   - Ouvert via Modal avec animations framer-motion
   - 3 étapes décrites ci-dessus (Participants → Chambres → Répartition)
   - Informations personnelles (nom, email, téléphone)
   - Dates (avec contraintes du séjour)
   - Demandes spéciales (textarea)
   - Calcul en temps réel du prix total
   - Validation complète Zod à chaque étape

4. **Page de Confirmation Devis** (`/[locale]/quotes/[id]`)
   - Vue publique du devis généré
   - Toutes les informations du devis
   - Récapitulatif des chambres et participants
   - Prix détaillé
   - Bouton pour télécharger le PDF
   - Statut du devis (en attente, accepté, refusé)

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

### Calcul Automatique des Prix ⚠️ IMPORTANT

**Les prix sont configurés PAR SÉJOUR COMPLET, pas par nuit !**

```typescript
// RoomPricing.price = Prix TOTAL pour le séjour
// Pas besoin de multiplier par le nombre de nuits
```

**Formule de calcul:**
```typescript
// lib/pdf/generateQuotePdf.ts & hooks/usePriceCalculation.ts
const calculatePrice = () => {
  let total = 0;

  // Pour chaque chambre sélectionnée
  quote.quoteRooms.forEach((quoteRoom) => {
    // Pour chaque instance de cette chambre
    for (let i = 0; i < quoteRoom.quantity; i++) {
      // Pour chaque tranche d'âge assignée à cette instance
      quoteRoom.quoteRoomOccupants.forEach((occupant) => {
        // Récupérer le prix pour cette chambre et cette tranche d'âge
        const pricing = roomPricings.find(p =>
          p.roomId === quoteRoom.roomId &&
          p.ageRangeId === occupant.ageRangeId
        );

        // Prix total = prix unitaire × nombre de personnes
        // (le prix est déjà pour tout le séjour)
        total += (pricing?.price || 0) * occupant.count;
      });
    }
  });

  return total;
};
```

**Affichage dans le PDF et les interfaces:**
- Les prix unitaires sont affichés avec mention "Prix/séjour"
- Pas de multiplication par nombre de nuits
- Le prix reflète exactement ce qui a été configuré dans RoomPricing

### Génération de Devis PDF

**Service: `lib/pdf/generateQuotePdf.ts`**

**Fonctionnalités:**
```typescript
export const generateQuotePdf = async (quote: QuoteWithRelations) => {
  const doc = new jsPDF();

  // 1. En-tête avec logo (si disponible)
  if (organizationLogo) {
    doc.addImage(organizationLogo, 'PNG', x, y, width, height);
  }

  // 2. Informations du devis
  doc.text(`Devis N° ${quote.id.substring(0, 8)}`);
  doc.text(`Date: ${format(quote.createdAt, 'dd/MM/yyyy')}`);

  // 3. Informations client
  doc.text(`Client: ${quote.firstName} ${quote.lastName}`);
  doc.text(`Email: ${quote.email}`);
  doc.text(`Téléphone: ${quote.phone}`);

  // 4. Informations séjour
  doc.text(`Séjour: ${quote.stay.name}`);
  doc.text(`Hôtel: ${quote.stay.hotel.name}`);
  doc.text(`Dates: ${checkIn} → ${checkOut}`);

  // 5. Tableau détaillé avec jspdf-autotable
  autoTable(doc, {
    head: [['Chambre', 'Tranche d\'âge', 'Quantité', 'Prix unitaire', 'Total']],
    body: rows, // Calculé à partir de quoteRooms
    foot: [['', '', '', 'TOTAL TTC', `${totalPrice} €`]]
  });

  // 6. Demandes spéciales (si présentes)
  if (quote.specialRequests) {
    doc.text('Demandes spéciales:', x, y);
    doc.text(quote.specialRequests, x, y+10);
  }

  // 7. Mentions légales et conditions
  doc.setFontSize(8);
  doc.text('Prix indiqué pour la durée totale du séjour.');
  doc.text('Devis valable 30 jours.');

  // 8. Avertissement si prix manquants
  if (hasMissingPrices) {
    doc.setTextColor(255, 0, 0);
    doc.text('⚠️ Certains prix ne sont pas configurés.');
  }

  return doc.output('blob');
};
```

**Route API:**
```typescript
// app/api/quotes/[id]/pdf/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // 1. Récupérer le devis avec toutes les relations
  const quote = await getQuoteWithRelations(params.id);

  // 2. Générer le PDF
  const pdfBlob = await generateQuotePdf(quote);

  // 3. Retourner en tant que téléchargement
  return new Response(pdfBlob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${params.id}.pdf"`,
    },
  });
}
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

### Composants Upload

**Image Upload Simple (`components/ui/image-upload.tsx`):**
```typescript
- Preview en temps réel
- Validation taille/type (max 5MB)
- Progress bar pendant upload
- Suppression possible
- Totalement optionnel
```

**Multi Image Upload (`components/ui/multi-image-upload.tsx`):**
```typescript
- Upload de plusieurs images simultanément
- Drag & drop pour réorganiser l'ordre
- Désignation de l'image principale
- Preview de toutes les images
- Suppression individuelle
- Indicateur de progression pour chaque image
```

## 🎨 Composants UI Réutilisables

### Modal avec Animations (`components/ui/modal.tsx`)

**Fonctionnalités:**
```typescript
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
}

// Caractéristiques
- Animations d'entrée/sortie avec framer-motion
- Overlay avec backdrop-blur
- Empêche le scroll du body quand ouvert
- Support ESC pour fermer
- Tailles configurables
- Option pour désactiver la fermeture au clic sur overlay
```

**Utilisation:**
```typescript
import { Modal } from '@/components/ui/modal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Ouvrir Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mon Formulaire"
        size="xl"
        closeOnOverlayClick={false}
      >
        <MultiStepQuoteForm {...props} />
      </Modal>
    </>
  )
}
```

### Carousel (`components/ui/carousel.tsx`)

**Fonctionnalités:**
- Navigation précédent/suivant
- Indicateurs de pagination (dots)
- Swipe tactile sur mobile
- Auto-play optionnel
- Thumbnails cliquables
- Transition fluide entre images

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

# Auth (JWT pour Magic Link)
JWT_SECRET=secret-long-et-securise-minimum-32-caracteres

# OAuth Providers
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# Email (SendGrid ou Brevo)
SENDGRID_API_KEY=SG...
EMAIL_FROM=noreply@votre-domaine.com
# OU
BREVO_API_KEY=xkeysib-...

# Storage (Cloudflare R2)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_ACCESS_KEY=...
CLOUDFLARE_SECRET_KEY=...
CLOUDFLARE_BUCKET=hotel-images
CLOUDFLARE_REGION=auto
CLOUDFLARE_URL=https://pub-xxx.r2.dev

# reCAPTCHA (Protection formulaires)
NEXT_PUBLIC_GOOGLE_RECAPTCHA_KEY=6Le...
RECAPTCHA_SECRET_KEY=6Le...

# Stripe (Optionnel - pour paiements futurs)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_BILLING_URL=https://billing.stripe.com/...

# Misc
NEXT_PUBLIC_MAX_FILE_SIZE=5242880  # 5MB en bytes
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

1. **Gestion des Réservations et Paiements**
   - Conversion devis accepté → réservation confirmée
   - Calendrier de disponibilité en temps réel
   - Intégration Stripe complète avec paiements
   - Gestion des acomptes et soldes
   - Facturation automatique

2. **Amélioration du Multi-Tenancy** ✅ (Partiellement implémenté)
   - Permissions granulaires par rôle (admin, manager, viewer)
   - Gestion des utilisateurs par organisation
   - Plans tarifaires par organisation (quotas personnalisés)
   - Sous-domaines personnalisés par organisation
   - White-labeling complet

3. **Reporting Avancé**
   - Tableaux de bord analytiques avec graphiques
   - Export Excel/PDF des rapports
   - Statistiques détaillées (taux de conversion, CA par séjour, etc.)
   - Analytics des demandes de devis
   - Prévisions de revenus

4. **API Publique et Intégrations**
   - API REST documentée (Swagger/OpenAPI)
   - Webhooks pour événements (nouveau devis, changement statut, etc.)
   - Intégration avec PMS hôteliers
   - Intégration calendriers externes (Google Calendar, iCal)
   - Synchronisation avec CRM

5. **Fonctionnalités Avancées**
   - Système de promotions et codes promo
   - Gestion des inventaires de chambres en temps réel
   - Module de CRM intégré (suivi clients)
   - Système de notifications (email, SMS, push)
   - Chat en direct pour support client

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

## 📋 Récapitulatif des Fonctionnalités Principales

### ✅ Fonctionnalités Implémentées

#### Multi-Organisation
- [x] Modèle Organization avec isolation complète des données
- [x] URLs par organisation (`/[orga]/[slug]`)
- [x] Slug unique par organisation (pas globalement)
- [x] Utilisateurs liés à une organisation

#### Gestion des Hôtels et Chambres
- [x] CRUD complet des hôtels
- [x] CRUD complet des chambres avec capacité
- [x] Upload d'images (Cloudflare R2)
- [x] Description riche avec TipTap
- [x] Liaison hôtel-chambres

#### Système de Tarification
- [x] Tranches d'âge configurables (nom, min, max, ordre)
- [x] Prix par chambre et par tranche d'âge
- [x] **Prix configurés par séjour complet** (pas par nuit)
- [x] Mise à jour groupée des tarifs
- [x] Affichage des prix dans le formulaire

#### Gestion des Séjours
- [x] CRUD complet des séjours
- [x] Dates de début/fin
- [x] **Galerie d'images multiples** avec ordre et image principale
- [x] Réservation partielle optionnelle (minDays, maxDays)
- [x] Toggle actif/inactif
- [x] Description riche
- [x] Liaison avec hôtel et organisation

#### Formulaire de Devis Multi-Étapes ⭐
- [x] **Étape 1**: Sélection des participants par tranche d'âge
- [x] **Étape 2**: Sélection des chambres avec quantités
- [x] **Étape 3**: Répartition précise des participants par chambre
- [x] Navigation intelligente entre étapes
- [x] Validation à chaque étape
- [x] Indicateurs visuels (progression, occupancy, participants restants)
- [x] Calcul du prix en temps réel
- [x] Modal avec animations framer-motion

#### Gestion des Devis
- [x] Nouveau système QuoteRoom + QuoteRoomOccupant
- [x] Liste des devis avec filtres par statut
- [x] Détail complet avec récapitulatif
- [x] Changement de statut (PENDING, ACCEPTED, REJECTED, EXPIRED)
- [x] Calcul automatique du prix total
- [x] **Génération de PDF professionnel** avec jsPDF
- [x] Route API pour téléchargement PDF
- [x] Page publique de visualisation du devis

#### Authentification et Sécurité
- [x] Lucia Auth v3
- [x] Magic Link (email avec JWT)
- [x] OAuth (Google, GitHub, Facebook)
- [x] Middleware de protection des routes
- [x] Sessions sécurisées avec cookies httpOnly
- [x] Validation Zod partout

#### UI/UX
- [x] Design moderne avec gradients
- [x] Composant Modal réutilisable
- [x] Carousel pour galeries d'images
- [x] Upload simple et multiple d'images
- [x] Animations framer-motion
- [x] Interface responsive (mobile, tablet, desktop)
- [x] Internationalisation FR/EN complète

#### Infrastructure
- [x] tRPC pour API type-safe
- [x] Prisma ORM avec migrations
- [x] PostgreSQL (Neon)
- [x] Cloudflare R2 pour stockage d'images
- [x] Architecture hexagonale (Ports & Adapters)
- [x] Domain Driven Design (DDD)
- [x] TypeScript strict (no any)

### 🚧 En Cours / Prévu

#### Amélioration Multi-Organisation
- [ ] Permissions granulaires par rôle
- [ ] Gestion des utilisateurs par organisation
- [ ] Sous-domaines personnalisés

#### Paiements et Réservations
- [ ] Intégration Stripe complète
- [ ] Conversion devis → réservation
- [ ] Gestion des acomptes
- [ ] Facturation automatique

#### Analytics et Reporting
- [ ] Dashboard avec graphiques
- [ ] Export Excel/PDF des rapports
- [ ] Statistiques avancées

---

## 🎯 Points Clés pour les Développeurs

### Architecture
- **Pas de type `any`** - TypeScript strict mode activé
- **Ports & Adapters** - Séparation domaine/infrastructure
- **DDD** - Entités métier avec logique métier
- **tRPC** - Type-safety complète client/serveur
- **Zod** - Validation partout (client + serveur)

### Principes de Code
1. **Réutilisation** : Composants, hooks et fonctions réutilisables
2. **Separation of Concerns** : Couches clairement définies
3. **Type-Safety** : Aucun `as any`, typage explicite partout
4. **Validation** : Zod schemas pour toutes les entrées
5. **Internationalisation** : Tous les textes via next-intl

### Flux de Données
```
Client → tRPC → Router → Use Case → Repository → Prisma → PostgreSQL
         ↓                                              ↓
      Validation Zod                          Auto-typed Response
```

### Structure de Fichiers
- `app/` : Routes Next.js (publiques + protégées)
- `src/domain/` : Entités métier (pure logic)
- `src/application/` : DTOs et use cases
- `src/infrastructure/` : Repositories Prisma
- `server/` : Routers tRPC
- `components/` : Composants React (UI + business)
- `hooks/` : Custom React hooks
- `types/` : Types TypeScript globaux
- `lib/` : Services (auth, storage, email, pdf)

### Nouveautés Récentes (Last 5 Commits)
1. ✅ Fix génération devis PDF
2. ✅ Fix formulaire multi-étapes (validation)
3. ✅ Implémentation formulaire multi-étapes complet
4. ✅ Améliorations design (StayDetailLuxury)
5. ✅ Fix sélection participants et chambres

---

**Note** : Cette application est conçue pour être facilement extensible et maintenue. L'architecture Ports & Adapters garantit une séparation claire des responsabilités et facilite les tests et évolutions futures.

**Dernière mise à jour de la documentation** : 11 novembre 2025