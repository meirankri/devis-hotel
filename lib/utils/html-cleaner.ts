/**
 * Nettoie le HTML généré par TipTap pour éliminer les structures problématiques
 */
export function cleanTipTapHTML(html: string | null | undefined): string {
  if (!html) return '';
  
  let cleanedHtml = html;
  
  // Supprimer les <br> inutiles à la fin des paragraphes
  cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*<\/p>/gi, '</p>');
  
  // Supprimer les paragraphes dans les listes (convertir <li><p>...</p></li> en <li>...</li>)
  cleanedHtml = cleanedHtml.replace(/<li>\s*<p>/gi, '<li>');
  cleanedHtml = cleanedHtml.replace(/<\/p>\s*<\/li>/gi, '</li>');
  
  // Supprimer les <br> à la fin des éléments de liste
  cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*<\/li>/gi, '</li>');
  
  // Supprimer les <br> à la fin des titres
  cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*<\/(h[1-6])>/gi, '</$1>');
  
  // Supprimer les paragraphes vides
  cleanedHtml = cleanedHtml.replace(/<p>\s*<\/p>/gi, '');
  
  // Supprimer les espaces multiples
  cleanedHtml = cleanedHtml.replace(/\s+/g, ' ');
  
  // Supprimer les espaces entre les balises
  cleanedHtml = cleanedHtml.replace(/>\s+</g, '><');
  
  // Restaurer les espaces nécessaires après les balises inline
  cleanedHtml = cleanedHtml.replace(/(<\/(?:strong|em|b|i|span)>)([A-Za-zÀ-ÿ])/g, '$1 $2');
  
  return cleanedHtml.trim();
}

/**
 * Prépare le HTML pour l'affichage en ajoutant des classes CSS appropriées
 */
export function prepareHTMLForDisplay(html: string | null | undefined): string {
  if (!html) return '';
  
  // D'abord nettoyer le HTML
  let displayHtml = cleanTipTapHTML(html);
  
  // Ajouter des classes pour l'espacement si nécessaire
  // (Optionnel, car les classes prose de Tailwind gèrent déjà bien l'espacement)
  
  return displayHtml;
}