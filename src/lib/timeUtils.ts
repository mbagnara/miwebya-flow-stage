/**
 * Calcula el tiempo transcurrido desde una fecha hasta ahora
 * @param fromDate - Fecha ISO string desde la cual calcular
 * @returns Formato "HH:mm" si es menor a 24h, o "Xd HH:mm" si es mayor
 */
export function getElapsedTime(fromDate: string): string {
  const from = new Date(fromDate);
  const now = new Date();
  const diffMs = now.getTime() - from.getTime();

  // Si la fecha es futura, retornar 00:00
  if (diffMs < 0) {
    return "00:00";
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Si es más de 24 horas, mostrar días también
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Determina si el tiempo transcurrido supera un umbral (en horas)
 * @param fromDate - Fecha ISO string desde la cual calcular
 * @param thresholdHours - Umbral en horas
 * @returns true si el tiempo transcurrido es mayor o igual al umbral
 */
export function isOverThreshold(fromDate: string, thresholdHours: number): boolean {
  const from = new Date(fromDate);
  const now = new Date();
  const diffHours = (now.getTime() - from.getTime()) / (1000 * 60 * 60);
  return diffHours >= thresholdHours;
}

/**
 * Obtiene el número total de horas transcurridas
 * @param fromDate - Fecha ISO string desde la cual calcular
 * @returns Número de horas transcurridas
 */
export function getElapsedHours(fromDate: string): number {
  const from = new Date(fromDate);
  const now = new Date();
  return (now.getTime() - from.getTime()) / (1000 * 60 * 60);
}
