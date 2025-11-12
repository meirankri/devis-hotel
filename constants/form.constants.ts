/**
 * Constantes utilisées dans les formulaires et l'application
 * Ces constantes remplacent les "magic numbers" pour améliorer la maintenabilité
 */

// ============================================
// TIMING & DELAYS
// ============================================

/**
 * Délai avant la navigation automatique dans SubPeriodsStep
 * Permet à React de mettre à jour l'état avant de naviguer
 * pour éviter les race conditions avec le batching des états
 */
export const NAVIGATION_DELAY_MS = 100;

// ============================================
// CAPACITY & LIMITS
// ============================================

/**
 * Facteur de sécurité pour la capacité des chambres
 * Permet 50% de capacité supplémentaire pour donner de la flexibilité
 * Ex: Une chambre de 4 personnes peut accepter jusqu'à 6 participants dans le formulaire
 */
export const ROOM_CAPACITY_SAFETY_FACTOR = 1.5;

/**
 * Nombre maximum de chambres identiques qu'on peut sélectionner
 */
export const MAX_ROOM_QUANTITY = 10;

// ============================================
// CACHING & PERFORMANCE
// ============================================

/**
 * Durée pendant laquelle les données sont considérées comme fraîches (en ms)
 * Utilisé par React Query pour éviter les refetch inutiles
 */
export const QUERY_STALE_TIME = 30000; // 30 secondes

/**
 * Durée de conservation des données en cache (en ms)
 * Les données restent en mémoire même après être devenues "stale"
 */
export const QUERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Durée du cache pour les données de séjour avec sous-périodes
 */
export const STAYS_CACHE_TIME = 60000; // 1 minute

// ============================================
// UPLOAD LIMITS
// ============================================

/**
 * Taille maximale d'un fichier uploadé (en octets)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Nombre maximum d'images par séjour
 */
export const MAX_IMAGES_PER_STAY = 10;

// ============================================
// PAGINATION
// ============================================

/**
 * Nombre d'éléments par page par défaut
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Nombre maximum d'éléments qu'on peut charger en une fois
 */
export const MAX_PAGE_SIZE = 100;

// ============================================
// VALIDATION
// ============================================

/**
 * Longueur minimale d'un mot de passe
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Durée de validité d'un magic link (en minutes)
 */
export const MAGIC_LINK_VALIDITY_MINUTES = 5;

/**
 * Nombre de tentatives de connexion avant blocage temporaire
 */
export const MAX_LOGIN_ATTEMPTS = 5;

// ============================================
// UI BEHAVIOR
// ============================================

/**
 * Durée d'affichage d'un toast (en ms)
 */
export const TOAST_DURATION = 4000;

/**
 * Délai avant d'afficher un spinner de chargement (en ms)
 * Évite les spinners qui flashent pour les chargements rapides
 */
export const LOADING_SPINNER_DELAY = 200;

/**
 * Durée des animations (en ms)
 */
export const ANIMATION_DURATION = 200;

// ============================================
// BUSINESS RULES
// ============================================

/**
 * Nombre de jours avant la date de début où on peut encore modifier un devis
 */
export const QUOTE_MODIFICATION_DEADLINE_DAYS = 7;

/**
 * Durée de validité d'un devis en jours
 */
export const QUOTE_VALIDITY_DAYS = 30;

/**
 * Pourcentage d'acompte par défaut
 */
export const DEFAULT_DEPOSIT_PERCENTAGE = 30;