Système de Gestion de Réservations Hôtelières — Résumé
Objectif

Plateforme end-to-end pour séjours organisés (Pessah, Summer, Sukkot) permettant aux clients de demander des devis et aux admins de gérer hôtels, chambres, séjours, tarification par âge et génération de devis PDF. Multi-organisation avec isolation stricte des données et URLs dédiées (/[orga]/[slug]).

Périmètre fonctionnel (vue rapide)

Multi-tenancy : organisations, utilisateurs, slugs uniques par orga.

Hôtels & Chambres : CRUD, capacités, descriptions riches, images.

Tranches d’âge : config nom/min/max/ordre, utilisées pour la tarification.

Séjours : dates, hôtel, galerie multi-images (main, ordre), partiel (min/max jours), actif/inactif.

Devis : formulaire multi-étapes (participants → chambres → répartition), calcul en temps réel, statut (PENDING/ACCEPTED/REJECTED/EXPIRED), PDF pro.

Public : liste des séjours actifs, page séjour luxueuse, demande de devis.

Back-office : listes filtrables, détails, actions rapides, dashboard (KPIs).

Points clés produit

Tarifs par séjour complet (pas par nuit).

Répartition fine par chambre (occupation par tranche d’âge, prix calculé instance par instance).

Galerie d’images par séjour (upload multiple, drag & drop, image principale).

i18n FR/EN complète.

Stack & archi (essentiel)

Frontend : Next.js 15 (App Router, React 19), TS strict, Tailwind, shadcn/ui, RHF + Zod, next-intl, TipTap, framer-motion.

Backend : tRPC 11, Prisma 5 (PostgreSQL/Neon), Lucia Auth v3, Cloudflare R2 (S3).

Docs/PDF : jsPDF + autotable.

Architecture : Hexagonale (Ports & Adapters), DDD, SOLID, SoC.

Dossiers : app/ (routes publiques/protégées + API), server/ (routers tRPC), src/domain|application|infrastructure/, components/, hooks/, lib/, prisma/.

Auth & sécurité

Magic link (JWT 5 min), OAuth (Google, GitHub, Facebook), sessions Lucia, cookies httpOnly/secure.

Middleware de protection (serveur + client).

Validation Zod partout, TS strict, contrôle d’accès, limites upload (5 MB), URLs signées R2.

Modèles de données (résumé)

Organization → Hotel, AgeRange, Stay, User.

Stay (slug unique par orga, dates, options partiel, images).

Quote → QuoteRoom (quantité) → QuoteRoomOccupant (tranche d’âge, count).

Tarifs : RoomPricing(roomId, ageRangeId, price) = prix total du séjour.

Formulaire de devis (3 étapes)

Participants par tranche d’âge (≥1 requis).

Chambres (quantités, capacité totale ≥ participants, garde-fou 1.5×).

Répartition par instance de chambre (progression, occupancy, restants, prix live).
Soumission → création du Quote + vue publique + PDF téléchargeable.

Calcul du prix (règle unique)

Pour chaque instance de chambre et chaque occupant (par tranche d’âge) :
total += pricing(roomId, ageRangeId).price × count

Le prix unitaire est par séjour → pas de multiplication par nuits.

Stockage d’images

Cloudflare R2 (S3) : upload unique, URL publique, suppression & ré-ordonnancement, image principale.

API & client (tRPC)

Routers par domaine (hotels, rooms, age-ranges, stays, quotes).
Côté client : hooks trpc.\*.useQuery/useMutation + toasts et refetch.

Déploiement rapide

npm install → config .env

npx prisma generate && prisma migrate deploy (optionnel seed)

npm run dev (ou build + start)

Onboarding : créer admin, tranches d’âge, hôtel, chambres, tarifs, séjour, activer.

Sécurité & qualité

Sessions sécurisées, CSRF natif, validations strictes, logs détaillés tRPC.

TS strict (pas de any), séparation claire domaines/couches, composants & hooks réutilisables.

Roadmap (extraits)

Rôles & permissions par orga, sous-domaines/white-label.

Réservations & paiements Stripe (acomptes, facturation).

Reporting/exports, API publique & webhooks, intégrations PMS/CRM, inventaire temps réel, promos, notifications.

TL;DR : une plateforme multi-tenants, typée de bout en bout, centrée sur des devis précis grâce à la répartition par chambre et des prix par séjour, avec workflow public → back-office → PDF, prête pour évoluer vers réservation & paiement.
