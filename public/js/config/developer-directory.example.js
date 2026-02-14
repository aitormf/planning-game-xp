/**
 * Directory of developers with their canonical names and known aliases.
 * This structure is used to normalize developer assignments across the app
 * and avoid duplicates caused by accents, casing, or alternative emails.
 *
 * Copy this file to developer-directory.js and fill in real emails.
 */
export const developerDirectory = [
  {
    id: 'sin-asignar',
    name: 'Sin asignar',
    primaryEmail: '',
    emails: [''],
    aliases: ['Sin asignar', 'No developer assigned', ''],
    isUnassigned: true
  },
  {
    id: 'dev-one',
    name: 'Developer One',
    primaryEmail: 'dev1@yourdomain.com',
    emails: ['dev1@yourdomain.com'],
    aliases: ['Developer One', 'Dev One']
  },
  {
    id: 'dev-two',
    name: 'Developer Two',
    primaryEmail: 'dev2@yourdomain.com',
    emails: ['dev2@yourdomain.com'],
    aliases: ['Developer Two']
  }
];

/**
 * Utility accessor in case the directory needs to be extended dynamically.
 */
export function getDeveloperDirectory() {
  return developerDirectory.slice();
}
