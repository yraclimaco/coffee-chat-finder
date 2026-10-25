import type { Company } from '../types'

// Hiring and open-role flags are ILLUSTRATIVE demo signals, not live data.
// A live provider (careers-page crawler / jobs API) would replace them.
export const COMPANIES: Company[] = [
  { name: 'Riot Games', aliases: ['riot', 'riot games'], industries: ['Gaming'], hiringSummer2027: true, openRoles: ['Product Analytics', 'Data Science', 'Product Management'], hooks: ['how player behavior data shapes balance and live-service decisions'] },
  { name: 'Spotify', aliases: ['spotify'], industries: ['Consumer tech', 'Media / entertainment'], hiringSummer2027: true, openRoles: ['Data Science', 'Product Analytics'], hooks: ['how experimentation works on a product with this many listening surfaces'] },
  { name: 'Uber', aliases: ['uber'], industries: ['Consumer tech', 'Consumer apps'], hiringSummer2027: true, openRoles: ['Data Analytics', 'Product Analytics', 'Business Analytics'], hooks: ['how marketplace metrics get balanced between riders and drivers'] },
  { name: 'Disney', aliases: ['disney', 'the walt disney company', 'disney streaming'], industries: ['Media / entertainment'], hiringSummer2027: false, openRoles: ['Data Analytics', 'Business Analytics'], hooks: ['how streaming and parks data teams work with product partners'] },
  { name: 'Xbox (Microsoft)', aliases: ['xbox', 'microsoft', 'xbox / microsoft', 'xbox microsoft'], industries: ['Gaming', 'Consumer tech'], hiringSummer2027: true, openRoles: ['Product Management', 'Product Analytics', 'Data Science'], hooks: ['how Game Pass engagement is measured across platforms'] },
  { name: 'Crunchyroll', aliases: ['crunchyroll'], industries: ['Media / entertainment', 'Consumer apps'], hiringSummer2027: true, openRoles: ['Product Analytics', 'Data Analytics'], hooks: ['how a fandom-driven subscription product thinks about retention'] },
  { name: 'Nintendo', aliases: ['nintendo', 'nintendo of america'], industries: ['Gaming'], hiringSummer2027: false, openRoles: ['Business Analytics'], hooks: ['how a hardware-and-software company uses data without losing its creative identity'] },
  { name: 'NBA', aliases: ['nba', 'nba league office'], industries: ['Sports'], hiringSummer2027: true, openRoles: ['Sports Analytics', 'Data Analytics', 'Business Analytics'], hooks: ['how league-level data work differs from team-level work'] },
  { name: 'Oklahoma City Thunder', aliases: ['okc thunder', 'thunder', 'nba', 'nba teams', 'individual nba teams'], industries: ['Sports'], hiringSummer2027: false, openRoles: ['Sports Analytics'], hooks: ['how analysts partner with coaches and player development staff'] },
  { name: 'Golden State Warriors', aliases: ['warriors', 'nba', 'nba teams', 'individual nba teams'], industries: ['Sports'], hiringSummer2027: true, openRoles: ['Sports Analytics', 'Business Analytics'], hooks: ['how business analytics and basketball analytics teams divide the work'] },
  { name: 'Los Angeles Lakers', aliases: ['lakers', 'nba', 'nba teams', 'individual nba teams'], industries: ['Sports'], hiringSummer2027: true, openRoles: ['Business Analytics', 'Data Analytics'], hooks: ['how fan and ticketing data informs the business side'] },
  { name: 'Patreon', aliases: ['patreon'], industries: ['Creator economy', 'Consumer apps'], hiringSummer2027: true, openRoles: ['Product Management', 'Product Analytics'], hooks: ['how creator success gets turned into a product metric'] },
  { name: 'Sephora', aliases: ['sephora'], industries: ['E-commerce', 'Consumer tech'], hiringSummer2027: true, openRoles: ['Product Management', 'Data Analytics', 'Product Analytics'], hooks: ['how personalization works across app, web and stores'] },
  { name: 'Capital One', aliases: ['capital one'], industries: ['Financial services'], hiringSummer2027: true, openRoles: ['Business Analytics', 'Data Analytics', 'Data Science'], hooks: ['how analyst rotations work and what the first year looks like'] },
  { name: 'Roblox', aliases: ['roblox'], industries: ['Gaming', 'Creator economy'], hiringSummer2027: true, openRoles: ['Product Analytics', 'Data Science', 'Product Management'], hooks: ['how a platform balances creator earnings with player experience'] },
  { name: 'YouTube', aliases: ['youtube', 'google'], industries: ['Creator economy', 'Media / entertainment', 'Consumer tech'], hiringSummer2027: true, openRoles: ['Data Science', 'Product Analytics', 'Product Management'], hooks: ['how creator and viewer incentives get measured together'] },
  { name: 'Discord', aliases: ['discord'], industries: ['Gaming', 'Consumer apps'], hiringSummer2027: false, openRoles: ['Product Analytics'], hooks: ['how community health is measured on a social product'] },
  { name: 'Reddit', aliases: ['reddit'], industries: ['Consumer apps', 'Media / entertainment'], hiringSummer2027: true, openRoles: ['Data Science', 'Product Analytics'], hooks: ['how community-level and user-level metrics trade off'] },
  { name: 'Airbnb', aliases: ['airbnb'], industries: ['Consumer tech', 'Consumer apps'], hiringSummer2027: true, openRoles: ['Data Science', 'Product Analytics'], hooks: ['how two-sided marketplace experiments are designed'] },
  { name: 'DoorDash', aliases: ['doordash'], industries: ['Consumer apps', 'E-commerce'], hiringSummer2027: true, openRoles: ['Data Analytics', 'Business Analytics', 'Product Analytics'], hooks: ['how ops analytics and product analytics split responsibilities'] },
  { name: 'Qualcomm', aliases: ['qualcomm'], industries: ['Enterprise software'], hiringSummer2027: false, openRoles: ['Data Science'], hooks: ['what data work looks like in a hardware-heavy company in San Diego'] },
  { name: 'Intuit', aliases: ['intuit'], industries: ['Financial services', 'Enterprise software'], hiringSummer2027: true, openRoles: ['Data Science', 'Product Management'], hooks: ['how product teams use experimentation on financial tools'] },
  { name: 'Sunridge Energy Analytics', aliases: ['sunridge'], industries: ['Energy / climate'], hiringSummer2027: false, openRoles: ['Data Analytics'], hooks: ['how clean-energy data work compares with consumer product work'] },
]

const norm = (s: string) => s.toLowerCase().trim()

export function findCompany(name: string): Company | undefined {
  const n = norm(name)
  return COMPANIES.find((c) => norm(c.name) === n || c.aliases.includes(n))
}

/** Does a user-entered target (e.g. "Xbox / Microsoft", "NBA") cover this company? */
export function targetCoversCompany(target: string, companyName: string): boolean {
  const t = norm(target)
  const c = findCompany(companyName)
  if (!c) return norm(companyName) === t
  return norm(c.name) === t || c.aliases.includes(t)
}

export const ALL_COMPANY_NAMES = COMPANIES.map((c) => c.name)
