# SaaS Boilerplate - Documentation Complète

## Vue d'ensemble

Ce projet est un boilerplate SaaS moderne construit avec Next.js 15, offrant une architecture complète pour lancer rapidement une application SaaS. Il inclut l'authentification, la gestion des abonnements, les quotas, le stockage de fichiers et l'internationalisation.

## Stack Technique

### Frontend
- **Next.js 15** avec App Router et React 19
- **TypeScript** pour le typage statique
- **Tailwind CSS** pour le styling
- **Shadcn/ui** pour les composants UI
- **React Hook Form** + **Zod** pour la validation des formulaires
- **next-intl** pour l'internationalisation (FR/EN)

### Backend
- **tRPC** pour les API type-safe
- **Prisma** comme ORM
- **PostgreSQL** comme base de données
- **Lucia Auth** pour l'authentification
- **Stripe** pour les paiements et abonnements

### Services Externes
- **SendGrid** pour l'envoi d'emails
- **Firebase Storage** / **Cloudflare R2** pour le stockage de fichiers
- **Google reCAPTCHA** pour la protection anti-spam

## Architecture du Projet

```
apply-backend/
├── app/                    # App Router Next.js
│   ├── [locale]/          # Routes internationalisées
│   │   ├── (protected)/   # Routes protégées (auth requise)
│   │   └── (withLayout)/  # Routes publiques avec layout
│   ├── api/               # Routes API REST
│   └── _trpc/             # Configuration tRPC
├── server/                # Serveur tRPC
│   ├── routes/            # Routes tRPC
│   └── trpc.ts           # Configuration de base tRPC
├── actions/               # Server Actions Next.js
├── components/            # Composants React
├── lib/                   # Utilitaires et configurations
│   ├── lucia/            # Configuration auth
│   ├── database/         # Configuration DB
│   └── storage/          # Services de stockage
├── prisma/                # Schéma et migrations DB
├── hooks/                 # Custom React hooks
├── providers/             # Context providers React
└── types/                 # Types TypeScript

```

## Système d'Authentification

### Vue d'ensemble
Le système utilise **Lucia Auth v3** avec plusieurs méthodes d'authentification :

1. **Magic Link** (Email)
2. **OAuth** (Google, GitHub, Facebook)

### Architecture de l'Auth

#### 1. Sessions avec Lucia
- Gestion des sessions côté serveur avec cookies HTTP-only
- Validation automatique des sessions via middleware
- Renouvellement automatique des sessions expirées

#### 2. Magic Link Flow
```typescript
// actions/magic-link.actions.ts
1. Utilisateur entre son email
2. Génération d'un JWT signé (5 min de validité)
3. Envoi du lien par email via SendGrid
4. Validation du token et création de session
5. Attribution automatique du plan "free_trial" aux nouveaux utilisateurs
```

#### 3. OAuth Flow
```typescript
// lib/lucia/oauth.ts
1. Redirection vers le provider OAuth
2. Callback avec code d'autorisation
3. Échange du code contre access token
4. Récupération des infos utilisateur
5. Création/mise à jour de l'utilisateur en DB
6. Création de session Lucia
```

### Modèles de Données Auth

```prisma
model User {
  id                   String    @id @default(uuid())
  email                String    @unique
  isEmailVerified      Boolean   @default(false)
  profilePictureUrl    String?
  stripeCustomerId     String?   @unique
  
  // Relations
  subscription         Subscription?
  oauthAccounts        OauthAccount[]
  magicLinks           MagicLink[]
  sessions             Session[]
  ProductUsage         ProductUsage[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  expiresAt DateTime
  expiresIn Int
  user      User     @relation(...)
}

model OauthAccount {
  id             String   @id
  userId         String
  provider       String   // "google", "github", "facebook"
  providerUserId String
  accessToken    String
  refreshToken   String?
  expiresAt      DateTime
  user           User     @relation(...)
}
```

### Protection des Routes

#### 1. Middleware (middleware.ts)
- Vérifie les sessions sur toutes les routes
- Met à jour automatiquement les cookies de session
- Renouvelle les quotas si nécessaire

#### 2. Layout Protégé
```typescript
// app/[locale]/(protected)/layout.tsx
- Vérifie l'authentification côté serveur
- Redirige vers /sign-in si non authentifié
- Charge les données utilisateur et abonnement
```

#### 3. Composants d'Autorisation
- `<HasAuthorization>` : Vérifie les permissions côté client
- `<HasAutorizationServer>` : Vérifie les permissions côté serveur
- `<CheckQuota>` : Vérifie les quotas avant d'afficher le contenu

## Système d'Abonnements et Quotas

### Architecture des Abonnements

```prisma
model Subscription {
  id            String    @id
  planTitle     String    // ex: "free_trial", "starter", "pro"
  price         Decimal
  timeline      Timeline  // MONTHLY, YEARLY, ONETIME
  stripePriceId String?
  
  // Relations
  features      Feature[]  // Liste des fonctionnalités
  products      Product[]  // Produits avec quotas
  users         User[]
}

model Product {
  id             String  @id
  name           String  // ex: "api_calls", "storage_gb"
  quota          Int     // Limite du quota
  subscription   Subscription
  ProductUsage   ProductUsage[]
}

model ProductUsage {
  id        String  @id
  userId    String
  productId String
  remaining Int     // Quota restant
  
  user      User    @relation(...)
  product   Product @relation(...)
}
```

### Gestion des Quotas

#### 1. Attribution des Quotas
- Automatique lors de l'inscription (free_trial)
- Lors du changement d'abonnement via Stripe

#### 2. Vérification des Quotas
```typescript
// hooks/useQuota.tsx
const { hasQuota, remaining } = useQuota("api_calls");

// actions/quotas.ts
- checkAndRenewQuotas() : Renouvelle les quotas mensuels
- checkQuota() : Vérifie si l'utilisateur a du quota
- decrementQuota() : Décrémente le quota après utilisation
```

#### 3. Renouvellement Automatique
- Vérifié à chaque validation de session
- Basé sur `nextQuotaRenewalDate` de l'utilisateur
- Réinitialise les quotas aux valeurs du plan

## Système de Stockage de Fichiers

### Architecture Modulaire

Le système utilise le pattern Strategy pour supporter plusieurs providers :

```typescript
// lib/storage/StorageService.ts
interface StorageService {
  uploadFile(file: File, options: {...}): Promise<{...}>
  deleteFile(fileName: string): Promise<void>
  getSignedFileUrl?(fileName: string): Promise<string>
}
```

### Providers Disponibles

#### 1. Firebase Storage
```typescript
// lib/storage/FirebaseStorageService.ts
- Upload direct depuis le navigateur
- URLs publiques permanentes
- Gestion des permissions via Firebase Rules
```

#### 2. Cloudflare R2
```typescript
// lib/storage/CloudflareStorageService.ts
- Compatible S3
- URLs signées temporaires
- Stockage edge optimisé
```

### Modèle de Données

```prisma
model Document {
  id          String   @id
  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String
  entityId    String   // ID de l'entité liée
  entityType  String   // Type: "User", "Product", etc.
  createdBy   String   // ID de l'utilisateur
  createdAt   DateTime
  updatedAt   DateTime
}
```

### API Routes pour les Fichiers

```typescript
// app/api/documents/route.ts
POST   /api/documents         // Upload de fichier
GET    /api/documents         // Liste des fichiers

// app/api/files/[id]/route.ts  
GET    /api/files/[id]        // Télécharger un fichier
DELETE /api/files/[id]        // Supprimer un fichier
```

## API avec tRPC

### Configuration

```typescript
// server/trpc.ts
- Context avec session utilisateur
- Procedures publiques et protégées
- Gestion des erreurs centralisée
```

### Routes Disponibles

```typescript
// server/index.ts
export const appRouter = router({
  contact: contactRouter,  // Formulaire de contact
  // Ajouter d'autres routes ici
});
```

### Utilisation Côté Client

```typescript
// Composant React
import { api } from "@/app/_trpc/client";

function ContactForm() {
  const sendContact = api.contact.useMutation();
  
  const handleSubmit = async (data) => {
    await sendContact.mutateAsync(data);
  };
}
```

## Internationalisation (i18n)

### Configuration

```typescript
// i18n.config.ts
- Langues supportées : FR, EN
- Détection automatique de la langue
- Routing avec préfixe de locale
```

### Structure des Traductions

```
locales/
├── en.json
└── fr.json
```

### Utilisation

```typescript
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('HomePage');
  return <h1>{t('title')}</h1>;
}
```

## Intégration Stripe

### Webhooks

```typescript
// app/api/webhook/stripe/route.ts
- checkout.session.completed : Création d'abonnement
- customer.subscription.updated : Mise à jour
- customer.subscription.deleted : Annulation
```

### Flow de Paiement

1. Utilisateur sélectionne un plan
2. Redirection vers Stripe Checkout
3. Webhook reçu après paiement
4. Mise à jour de l'abonnement et des quotas
5. Redirection vers le dashboard

## Variables d'Environnement

```env
# Base
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FACEBOOK_CLIENT_ID=...
FACEBOOK_CLIENT_SECRET=...

# Email
SENDGRID_API_KEY=...
EMAIL_FROM=...

# Storage
STORAGE_TYPE=firebase|cloudflare
CLOUDFLARE_BUCKET=...
CLOUDFLARE_URL=...
CLOUDFLARE_ACCESS_KEY_ID=...
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_ENDPOINT=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```

## Commandes Utiles

```bash
# Développement
npm run dev

# Base de données
npm run generate     # Générer les migrations Prisma
npm run build       # Build avec migrations auto

# Stripe Products
npm run createProduct  # Créer les produits Stripe
```

## Sécurité

1. **Sessions sécurisées** : Cookies HTTP-only, secure en production
2. **CSRF Protection** : Via les tokens de session Lucia
3. **Rate Limiting** : Via les quotas par utilisateur
4. **reCAPTCHA** : Sur les formulaires publics
5. **Validation** : Zod schemas sur toutes les entrées
6. **Permissions** : Vérification côté serveur systématique

## Points d'Extension

1. **Ajouter un nouveau provider OAuth** : 
   - Configurer dans `lib/lucia/oauth.ts`
   - Ajouter la route API dans `app/api/oauth/`
   - Mettre à jour les actions dans `actions/auth.actions.ts`

2. **Ajouter un nouveau type de quota** :
   - Ajouter le Product dans la DB
   - Implémenter la logique dans `actions/quotas.ts`
   - Utiliser `useQuota` hook côté client

3. **Ajouter un provider de stockage** :
   - Implémenter l'interface `StorageService`
   - Ajouter la configuration dans `config/storage.ts`
   - Mettre à jour les variables d'environnement

4. **Ajouter une route tRPC** :
   - Créer le router dans `server/routes/`
   - L'ajouter dans `server/index.ts`
   - Utiliser via `api.routeName` côté client