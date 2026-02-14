/**
 * Configuración de festivos para el cálculo de jornadas laborables.
 * Añadir fechas en formato 'YYYY-MM-DD'.
 *
 * Estos festivos se excluyen del cálculo de tiempo trabajado en /wip.
 */
export const holidays = [
  // 2024
  '2024-01-01', // Año Nuevo
  '2024-01-06', // Reyes
  '2024-03-28', // Jueves Santo
  '2024-03-29', // Viernes Santo
  '2024-05-01', // Día del Trabajador
  '2024-08-15', // Asunción
  '2024-10-12', // Fiesta Nacional
  '2024-11-01', // Todos los Santos
  '2024-12-06', // Día de la Constitución
  '2024-12-25', // Navidad

  // 2025
  '2025-01-01', // Año Nuevo
  '2025-01-06', // Reyes
  '2025-04-17', // Jueves Santo
  '2025-04-18', // Viernes Santo
  '2025-05-01', // Día del Trabajador
  '2025-08-15', // Asunción
  '2025-10-12', // Fiesta Nacional (cae domingo)
  '2025-11-01', // Todos los Santos
  '2025-12-06', // Día de la Constitución (cae sábado)
  '2025-12-08', // Inmaculada
  '2025-12-25', // Navidad

  // 2026
  '2026-01-01', // Año Nuevo
  '2026-01-06', // Reyes
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajador
  '2026-08-15', // Asunción (cae sábado)
  '2026-10-12', // Fiesta Nacional
  '2026-11-01', // Todos los Santos (cae domingo)
  '2026-12-06', // Día de la Constitución (cae domingo)
  '2026-12-08', // Inmaculada
  '2026-12-25', // Navidad
];

/**
 * Horas por jornada laboral.
 */
export const HOURS_PER_WORKDAY = 8;
