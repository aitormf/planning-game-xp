#!/usr/bin/env node

/**
 * Security Check Script
 *
 * Verifica vulnerabilidades de seguridad antes de builds.
 *
 * Política de severidad (por defecto):
 * - LOW: Permitido (solo warning)
 * - MODERATE, HIGH, CRITICAL: Bloquea build (excepto allowlist)
 *
 * Allowlist:
 * Crea un archivo .audit-allowlist.json en la raíz del proyecto para
 * ignorar vulnerabilidades conocidas y aceptadas:
 * {
 *   "allowedAdvisories": ["GHSA-xxxx-xxxx-xxxx"],
 *   "allowedPackages": ["package-name"],
 *   "reason": "Motivo documentado de por qué se permiten"
 * }
 *
 * Opciones:
 * --fix          Intenta corregir con npm audit fix (sin --force)
 * --strict       Bloquea cualquier vulnerabilidad (ignora allowlist)
 *
 * Uso:
 *   node scripts/security-check-and-fix.js           # Solo verificar
 *   node scripts/security-check-and-fix.js --fix    # Verificar e intentar fix seguro
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const execAsync = promisify(exec);

// Colores para la consola
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

/**
 * Carga el archivo de allowlist si existe
 */
function loadAllowlist() {
  const allowlistPath = join(__dirname, '..', '.audit-allowlist.json');

  if (!existsSync(allowlistPath)) {
    return { allowedAdvisories: [], allowedPackages: [], reason: '' };
  }

  try {
    const content = readFileSync(allowlistPath, 'utf8');
    const allowlist = JSON.parse(content);
    return {
      allowedAdvisories: allowlist.allowedAdvisories || [],
      allowedPackages: allowlist.allowedPackages || [],
      reason: allowlist.reason || ''
    };
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Error leyendo .audit-allowlist.json: ${error.message}${colors.reset}`);
    return { allowedAdvisories: [], allowedPackages: [], reason: '' };
  }
}

/**
 * Filtra vulnerabilidades excluyendo las que están en el allowlist
 */
function filterVulnerabilities(auditResult, allowlist) {
  if (!auditResult.vulnerabilities) {
    return { filtered: {}, allowedCount: 0 };
  }

  const filtered = {};
  let allowedCount = 0;

  for (const [pkgName, vulnData] of Object.entries(auditResult.vulnerabilities)) {
    // Verificar si el paquete está en allowlist
    if (allowlist.allowedPackages.includes(pkgName)) {
      allowedCount++;
      continue;
    }

    // Verificar si los advisories están en allowlist
    const vias = vulnData.via || [];
    const hasAllowedAdvisory = vias.some(via => {
      if (typeof via === 'object' && via.url) {
        const ghsaMatch = via.url.match(/GHSA-[\w-]+/);
        return ghsaMatch && allowlist.allowedAdvisories.includes(ghsaMatch[0]);
      }
      return false;
    });

    if (hasAllowedAdvisory) {
      allowedCount++;
      continue;
    }

    filtered[pkgName] = vulnData;
  }

  return { filtered, allowedCount };
}

/**
 * Cuenta vulnerabilidades por severidad
 */
function countBySeverity(vulnerabilities) {
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };

  for (const vulnData of Object.values(vulnerabilities)) {
    const severity = vulnData.severity?.toLowerCase() || 'low';
    if (counts[severity] !== undefined) {
      counts[severity]++;
    }
  }

  return counts;
}

/**
 * Ejecuta npm audit y retorna el resultado parseado
 */
async function runAudit() {
  try {
    const { stdout } = await execAsync('npm audit --json', { maxBuffer: 1024 * 1024 * 10 });
    return JSON.parse(stdout);
  } catch (error) {
    // npm audit sale con código 1 si hay vulnerabilidades
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

/**
 * Intenta corregir vulnerabilidades de forma segura (sin --force)
 */
async function trySafeFix() {
  console.log(`${colors.cyan}🔧 Intentando corregir vulnerabilidades (modo seguro, sin --force)...${colors.reset}\n`);

  try {
    // IMPORTANTE: NO usar --force para evitar breaking changes
    const { stdout, stderr } = await execAsync('npm audit fix', { maxBuffer: 1024 * 1024 * 10 });
    console.log(`${colors.green}✅ npm audit fix ejecutado${colors.reset}`);

    if (stdout.includes('found 0 vulnerabilities')) {
      console.log(`${colors.green}✅ Todas las vulnerabilidades fueron corregidas${colors.reset}\n`);
      return true;
    }

    return false;
  } catch (error) {
    // npm audit fix puede salir con código > 0 si no puede arreglar todo
    console.log(`${colors.yellow}⚠️  Algunas vulnerabilidades no pudieron corregirse automáticamente${colors.reset}`);
    console.log(`${colors.gray}   (Esto es normal si requieren major version upgrades)${colors.reset}\n`);
    return false;
  }
}

/**
 * Muestra el resumen de vulnerabilidades
 */
function showVulnerabilitySummary(vulnerabilities) {
  const { critical = 0, high = 0, moderate = 0, low = 0 } = vulnerabilities;
  const total = critical + high + moderate + low;

  if (total === 0) {
    console.log(`${colors.green}✅ No se encontraron vulnerabilidades${colors.reset}`);
    return;
  }

  console.log(`${colors.yellow}📊 Resumen de vulnerabilidades:${colors.reset}`);

  if (critical > 0) {
    console.log(`${colors.red}   🚨 CRITICAL: ${critical}${colors.reset}`);
  }
  if (high > 0) {
    console.log(`${colors.red}   ⚠️  HIGH: ${high}${colors.reset}`);
  }
  if (moderate > 0) {
    console.log(`${colors.yellow}   ⚡ MODERATE: ${moderate}${colors.reset}`);
  }
  if (low > 0) {
    console.log(`${colors.gray}   ℹ️  LOW: ${low}${colors.reset}`);
  }
  console.log('');
}

/**
 * Determina si debe bloquear el build basado en las vulnerabilidades
 */
function shouldBlockBuild(vulnerabilities, strictMode = false) {
  const { critical = 0, high = 0, moderate = 0, low = 0 } = vulnerabilities;

  if (strictMode) {
    // Modo estricto: bloquea cualquier vulnerabilidad
    return (critical + high + moderate + low) > 0;
  }

  // Modo default: bloquea MODERATE o superior, permite LOW
  return (critical + high + moderate) > 0;
}

/**
 * Función principal
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix') || args.includes('--auto-fix');
  const strictMode = args.includes('--strict');

  console.log(`${colors.blue}🔒 Verificación de seguridad${colors.reset}`);
  console.log(`${colors.gray}   Política: ${strictMode ? 'Estricta (bloquea todo, ignora allowlist)' : 'Standard (permite LOW, respeta allowlist)'}${colors.reset}\n`);

  // Cargar allowlist
  const allowlist = strictMode ? { allowedAdvisories: [], allowedPackages: [], reason: '' } : loadAllowlist();

  if (!strictMode && (allowlist.allowedAdvisories.length > 0 || allowlist.allowedPackages.length > 0)) {
    console.log(`${colors.cyan}📋 Allowlist activo:${colors.reset}`);
    if (allowlist.allowedPackages.length > 0) {
      console.log(`${colors.gray}   Paquetes: ${allowlist.allowedPackages.join(', ')}${colors.reset}`);
    }
    if (allowlist.allowedAdvisories.length > 0) {
      console.log(`${colors.gray}   Advisories: ${allowlist.allowedAdvisories.join(', ')}${colors.reset}`);
    }
    if (allowlist.reason) {
      console.log(`${colors.gray}   Razón: ${allowlist.reason}${colors.reset}`);
    }
    console.log('');
  }

  try {
    // Primera verificación
    let auditResult = await runAudit();
    let rawVulnerabilities = auditResult.metadata?.vulnerabilities || {};

    console.log(`${colors.yellow}📊 Vulnerabilidades totales detectadas:${colors.reset}`);
    showVulnerabilitySummary(rawVulnerabilities);

    // Si hay vulnerabilidades y está habilitado el fix, intentar corregir
    const total = Object.values(rawVulnerabilities).reduce((sum, count) => sum + count, 0);

    if (total > 0 && shouldFix) {
      await trySafeFix();

      // Re-verificar después del fix
      console.log(`${colors.blue}🔍 Verificando estado post-fix...${colors.reset}\n`);
      auditResult = await runAudit();
      rawVulnerabilities = auditResult.metadata?.vulnerabilities || {};
      showVulnerabilitySummary(rawVulnerabilities);
    }

    // Guardar resultado para CI/CD
    writeFileSync('npm-audit.json', JSON.stringify(auditResult, null, 2));

    // Filtrar vulnerabilidades según allowlist
    const { filtered, allowedCount } = filterVulnerabilities(auditResult, allowlist);
    const effectiveVulnerabilities = countBySeverity(filtered);

    if (allowedCount > 0 && !strictMode) {
      console.log(`${colors.cyan}ℹ️  ${allowedCount} vulnerabilidad(es) ignorada(s) por allowlist${colors.reset}\n`);
    }

    // Decidir si bloquear basándose en vulnerabilidades efectivas
    const totalEffective = Object.values(effectiveVulnerabilities).reduce((sum, count) => sum + count, 0);

    if (totalEffective === 0) {
      console.log(`${colors.green}✅ No hay vulnerabilidades bloqueantes${colors.reset}`);
      console.log(`${colors.green}✅ Build autorizada${colors.reset}\n`);
      process.exit(0);
    }

    if (shouldBlockBuild(effectiveVulnerabilities, strictMode)) {
      console.log(`${colors.yellow}📊 Vulnerabilidades efectivas (post-filtro):${colors.reset}`);
      showVulnerabilitySummary(effectiveVulnerabilities);

      const blockingLevel = strictMode ? 'cualquier vulnerabilidad' : 'MODERATE, HIGH o CRITICAL';
      console.log(`${colors.red}❌ Build bloqueada: Se encontraron vulnerabilidades de nivel ${blockingLevel}${colors.reset}`);
      console.log(`${colors.yellow}💡 Opciones:${colors.reset}`);
      console.log(`${colors.gray}   1. Ejecuta 'npm audit' para ver detalles${colors.reset}`);
      console.log(`${colors.gray}   2. Si es aceptable, añade al .audit-allowlist.json${colors.reset}`);
      console.log(`${colors.gray}   3. Ejecuta 'npm audit fix --force' manualmente (cuidado con breaking changes)${colors.reset}\n`);
      process.exit(1);
    } else {
      // Solo hay vulnerabilidades LOW
      console.log(`${colors.yellow}⚠️  Existen vulnerabilidades LOW (no bloquean el build)${colors.reset}`);
      console.log(`${colors.green}✅ Build autorizada con advertencias${colors.reset}\n`);
      process.exit(0);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Error inesperado: ${error.message}${colors.reset}`);
    console.error(`${colors.gray}${error.stack}${colors.reset}`);
    process.exit(1);
  }
}

main();
