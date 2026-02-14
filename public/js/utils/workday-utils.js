import { holidays, HOURS_PER_WORKDAY } from '../config/holidays-config.js';

const holidaySet = new Set(holidays);

/**
 * Comprueba si una fecha es fin de semana (sábado o domingo).
 * @param {Date} date
 * @returns {boolean}
 */
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Comprueba si una fecha es festivo.
 * @param {Date} date
 * @returns {boolean}
 */
function isHoliday(date) {
  const dateStr = date.toISOString().slice(0, 10);
  return holidaySet.has(dateStr);
}

/**
 * Comprueba si una fecha es día laborable (ni fin de semana ni festivo).
 * @param {Date} date
 * @returns {boolean}
 */
export function isWorkday(date) {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Calcula las jornadas laborables transcurridas entre dos fechas.
 * Devuelve un número decimal (ej: 2.5 jornadas).
 *
 * @param {string|Date} startDate - Fecha/hora de inicio (ISO string o Date)
 * @param {string|Date} [endDate=new Date()] - Fecha/hora de fin
 * @returns {number} Jornadas laborables (decimal)
 */
export function calculateWorkdays(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  if (end <= start) {
    return 0;
  }

  // Normalizar a inicio del día para contar días completos
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let fullWorkdays = 0;
  const current = new Date(startDay);

  // Contar días laborables completos entre las dos fechas (excluyendo el día de inicio y fin)
  current.setDate(current.getDate() + 1);
  while (current < endDay) {
    if (isWorkday(current)) {
      fullWorkdays++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Calcular horas del día de inicio (si es laborable)
  let startDayHours = 0;
  if (isWorkday(startDay)) {
    // Horas desde el momento de inicio hasta fin del día laboral (asumiendo 9-18h)
    const startHour = start.getHours() + start.getMinutes() / 60;
    const workdayEnd = 18; // Fin de jornada a las 18:00
    const workdayStart = 9; // Inicio de jornada a las 9:00

    if (startHour < workdayStart) {
      // Si empieza antes de las 9, cuenta toda la jornada
      startDayHours = HOURS_PER_WORKDAY;
    } else if (startHour < workdayEnd) {
      // Horas restantes del día
      startDayHours = Math.max(0, workdayEnd - startHour);
    }
    // Si empieza después de las 18, no cuenta ese día
  }

  // Calcular horas del día de fin (si es laborable y es diferente al día de inicio)
  let endDayHours = 0;
  if (startDay.getTime() !== endDay.getTime() && isWorkday(endDay)) {
    const endHour = end.getHours() + end.getMinutes() / 60;
    const workdayStart = 9;
    const workdayEnd = 18;

    if (endHour >= workdayEnd) {
      // Si termina después de las 18, cuenta toda la jornada
      endDayHours = HOURS_PER_WORKDAY;
    } else if (endHour > workdayStart) {
      // Horas trabajadas desde inicio de jornada
      endDayHours = Math.max(0, endHour - workdayStart);
    }
    // Si termina antes de las 9, no cuenta ese día
  } else if (startDay.getTime() === endDay.getTime() && isWorkday(startDay)) {
    // Mismo día: calcular diferencia de horas dentro de jornada laboral
    const startHour = Math.max(9, start.getHours() + start.getMinutes() / 60);
    const endHour = Math.min(18, end.getHours() + end.getMinutes() / 60);
    startDayHours = Math.max(0, endHour - startHour);
    endDayHours = 0; // Ya está contado en startDayHours
  }

  const totalHours = (fullWorkdays * HOURS_PER_WORKDAY) + startDayHours + endDayHours;
  const totalWorkdays = totalHours / HOURS_PER_WORKDAY;

  return Math.round(totalWorkdays * 10) / 10; // Redondear a 1 decimal
}

/**
 * Formatea las jornadas laborables para mostrar en la UI.
 * @param {number} workdays - Número de jornadas (decimal)
 * @returns {string} Texto formateado (ej: "2.5 jornadas", "1 jornada", "< 1h")
 */
export function formatWorkdays(workdays) {
  if (workdays === 0) {
    return '< 1h';
  }

  if (workdays < 0.1) {
    // Menos de ~45 minutos
    return '< 1h';
  }

  if (workdays === 1) {
    return '1 jornada';
  }

  return `${workdays} jornadas`;
}

/**
 * Calcula y formatea las jornadas laborables desde una fecha de inicio.
 * Función de conveniencia que combina calculateWorkdays y formatWorkdays.
 *
 * @param {string|Date} startDate - Fecha/hora de inicio
 * @returns {string} Texto formateado
 */
export function getWorkdaysDuration(startDate) {
  if (!startDate) {
    return '-';
  }
  const workdays = calculateWorkdays(startDate);
  return formatWorkdays(workdays);
}
