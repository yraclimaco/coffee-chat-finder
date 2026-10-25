import type { ContactPathway, Education, Person, PersonProject, RoleCategory } from '../types'

/**
 * DEMO DATA. Every profile below is fictional. Names, careers and details are invented
 * for development; any resemblance to a real person is coincidence. Company names are real
 * only so scoring against your target list can be exercised. No URLs here are real profiles.
 */

type Job = [company: string, role: string, start: number, end: number | 'Present']
type Intern = [company: string, role: string, year: number]

export function inferCategory(role: string): RoleCategory {
  const r = role.toLowerCase()
  if (/recruit|talent/.test(r)) return 'Recruiting'
  if (/sports|basketball|esports|hoops/.test(r)) return 'Sports Analytics'
  if (/product manag|\bapm\b|\bpm\b|director of product/.test(r)) return 'Product Management'
  if (/product analy|growth analy/.test(r)) return 'Product Analytics'
  if (/data scien/.test(r)) return 'Data Science'
  if (/business analy|strategy/.test(r)) return 'Business Analytics'
  if (/data analy|analytics|analyst/.test(r)) return 'Data Analytics'
  if (/engineer|developer/.test(r)) return 'Engineering'
  if (/vp|head of|chief/.test(r)) return 'Leadership'
  return 'Other'
}

interface Seed {
  id: string
  name: string
  role: string
  company: string
  loc: string
  yo: number
  edu: [school: string, degree: string, field: string, gradYear: number][]
  jobs: Job[]
  interns?: Intern[]
  ind: string[]
  int: string[]
  sk: string[]
  clubs?: string[]
  proj?: [title: string, note: string, domains: string[]][]
  mut?: string[]
  recent?: boolean
  contact: ContactPathway
  source: string
  site?: boolean
  cat?: RoleCategory
  note?: string
}

function mk(s: Seed): Person {
  const education: Education[] = s.edu.map(([school, degree, field, gradYear]) => ({ school, degree, field, gradYear }))
  const careerHistory = s.jobs.map(([company, role, start, end]) => ({ company, role, start, end, category: inferCategory(role) }))
  const internshipHistory = (s.interns ?? []).map(([company, role, year]) => ({ company, role, year, category: inferCategory(role) }))
  const prior = new Set<string>()
  careerHistory.forEach((j) => j.company !== s.company && prior.add(j.company))
  internshipHistory.forEach((i) => i.company !== s.company && prior.add(i.company))
  const projects: PersonProject[] = (s.proj ?? []).map(([title, note, domains]) => ({ title, note, domains }))
  const slug = s.name.toLowerCase().replace(/[^a-z]+/g, '-')
  return {
    id: s.id,
    name: s.name,
    headline: `${s.role} at ${s.company}`,
    company: s.company,
    role: s.role,
    roleCategory: s.cat ?? inferCategory(s.role),
    location: s.loc,
    yearsOut: s.yo,
    education,
    careerHistory,
    priorCompanies: [...prior],
    internshipHistory,
    industries: s.ind,
    interests: s.int,
    skills: s.sk,
    clubs: s.clubs ?? [],
    projects,
    mutuals: s.mut ?? [],
    recentlyJoined: s.recent ?? false,
    contactPathway: s.contact,
    websiteUrl: s.site ? `https://${slug}.example` : undefined,
    source: s.source,
    sourceUrl: undefined,
    tags: [],
    notes: s.note ?? '',
    isDemo: true,
  }
}

const UCSD = 'UC San Diego'
const ALUMNI = 'Demo seed: alumni directory'
const TEAM = 'Demo seed: company team page'
const SPEAKER = 'Demo seed: conference speaker bio'
const SITE = 'Demo seed: personal website'
const GH = 'Demo seed: public GitHub profile'

export const DEMO_PEOPLE: Person[] = [
  mk({ id: 'p01', name: 'Maya Okafor', role: 'Product Analyst', company: 'Riot Games', loc: 'Los Angeles, CA', yo: 4,
    edu: [[UCSD, 'B.S.', 'Data Science', 2022]],
    jobs: [['Riot Games', 'Data Analyst', 2022, 2024], ['Riot Games', 'Product Analyst', 2024, 'Present']],
    interns: [['Riot Games', 'Data Analytics Intern', 2021]],
    ind: ['Gaming'], int: ['League of Legends', 'Brazilian Jiu-Jitsu', 'Music', 'Gaming'],
    sk: ['SQL', 'Python', 'A/B testing', 'Tableau', 'Behavioral analytics', 'Experimentation'],
    clubs: ['Data Science Student Society'],
    proj: [['Queue-time fairness study', 'Hypothesis tests on ranked matchmaking waits', ['gaming', 'league of legends', 'hypothesis testing']]],
    mut: ['Dana R. (demo)'], contact: 'alumni-directory', source: ALUMNI,
    note: 'Intern-to-full-time at the same studio. Good example of the path you are on.' }),
  mk({ id: 'p02', name: 'Jordan Ellis', role: 'Associate Product Manager', company: 'Patreon', loc: 'San Francisco, CA (Remote friendly)', yo: 3,
    edu: [['UC Berkeley', 'B.A.', 'Cognitive Science', 2023]],
    jobs: [['Patreon', 'Associate Product Manager', 2023, 'Present']],
    interns: [['Patreon', 'Product Management Intern', 2022]],
    ind: ['Creator economy', 'Consumer apps'], int: ['Basketball', 'Music', 'Creative web/product experiences'],
    sk: ['User research', 'Product prioritization', 'SQL', 'Stakeholder interviews', 'Experimentation'],
    proj: [['Creator onboarding teardown', 'Public write-up on first-week creator drop-off', ['creator', 'user research']]],
    mut: ['Priya S. (demo)'], recent: false, contact: 'public-site', source: TEAM, site: true }),
  mk({ id: 'p03', name: 'Sofia Reyes', role: 'Basketball Strategy Analyst', company: 'Golden State Warriors', loc: 'San Francisco, CA', yo: 6,
    edu: [['UCLA', 'B.S.', 'Statistics', 2020]],
    jobs: [['NBA', 'Analytics Associate', 2020, 2023], ['Golden State Warriors', 'Basketball Strategy Analyst', 2023, 'Present']],
    interns: [['NBA', 'Basketball Analytics Intern', 2019]],
    ind: ['Sports'], int: ['Basketball', 'Brazilian Jiu-Jitsu', 'Sports analytics'],
    sk: ['Python', 'R', 'Statistics', 'Player tracking', 'Gradient boosting', 'SQL'],
    proj: [['Lineup synergy model', 'Conference talk on five-man lineup effects', ['nba', 'basketball', 'player tracking', 'sports']]],
    mut: ['Marcus T. (demo)'], contact: 'public-site', source: SPEAKER }),
  mk({ id: 'p04', name: 'Theo Nakamura', role: 'Product Analyst', company: 'Spotify', loc: 'Los Angeles, CA', yo: 3,
    edu: [[UCSD, 'B.S.', 'Cognitive Science', 2023]],
    jobs: [['Spotify', 'Associate Product Analyst', 2023, 2025], ['Spotify', 'Product Analyst', 2025, 'Present']],
    interns: [['Intuit', 'Data Analyst Intern', 2022]],
    ind: ['Consumer tech', 'Media / entertainment'], int: ['Music', 'Surf', 'Basketball'],
    sk: ['SQL', 'A/B testing', 'Python', 'Looker', 'Behavioral analytics'],
    clubs: ['Triton Product Club'], mut: ['Leo A. (demo)', 'Jess K. (demo)'], contact: 'alumni-directory', source: ALUMNI }),
  mk({ id: 'p05', name: 'Priya Raman', role: 'Product Manager', company: 'Airbnb', loc: 'San Francisco, CA', yo: 7,
    edu: [['UC Davis', 'B.S.', 'Statistics', 2019]],
    jobs: [['Intuit', 'Data Scientist', 2019, 2022], ['Airbnb', 'Senior Data Scientist', 2022, 2024], ['Airbnb', 'Product Manager', 2024, 'Present']],
    ind: ['Consumer tech', 'Consumer apps'], int: ['Basketball', 'Music'],
    sk: ['Python', 'SQL', 'Experimentation', 'A/B testing', 'Statistics', 'Product prioritization'],
    proj: [['DS to PM: what changed', 'Panel talk on moving from data science into product', ['career transition', 'product']]],
    mut: ['Dana R. (demo)'], contact: 'public-site', source: SPEAKER,
    note: 'Moved from data science into product management. Open about the transition in public talks.' }),
  mk({ id: 'p06', name: 'Devon Brooks', role: 'Data Analyst, Basketball Insights', company: 'Courtside Labs', loc: 'San Diego, CA', yo: 2,
    edu: [[UCSD, 'B.S.', 'Mathematics-Computer Science', 2024]],
    jobs: [['Courtside Labs', 'Data Analyst, Basketball Insights', 2024, 'Present']],
    interns: [['Oklahoma City Thunder', 'Basketball Analytics Intern', 2023]],
    ind: ['Sports'], int: ['Basketball', 'Brazilian Jiu-Jitsu', 'Surf', 'Sports analytics'],
    sk: ['Python', 'SQL', 'Player tracking', 'Gradient boosting', 'pandas'],
    clubs: ['Data Science Student Society'],
    proj: [['Shot quality model', 'Open GitHub repo on shot make probability', ['nba', 'basketball', 'sports', 'gradient boosting', 'player tracking']]],
    mut: ['Jess K. (demo)'], recent: true, contact: 'public-site', source: GH, site: true, cat: 'Sports Analytics',
    note: 'Former NBA team analytics intern, UCSD alum, based in San Diego. Very close to your NBA shot model project.' }),
  mk({ id: 'p07', name: 'Hannah Cho', role: 'Associate Product Manager', company: 'Sephora', loc: 'San Francisco, CA', yo: 3,
    edu: [['Cal Poly SLO', 'B.S.', 'Business Administration', 2023]],
    jobs: [['Sephora', 'Associate Product Manager', 2023, 'Present']],
    interns: [['Sephora', 'Product Management Intern', 2022]],
    ind: ['E-commerce', 'Consumer tech'], int: ['Music', 'Creative web/product experiences'],
    sk: ['Product prioritization', 'User research', 'SQL', 'Requirements gathering'],
    mut: ['Priya S. (demo)'], contact: 'public-site', source: TEAM }),
  mk({ id: 'p08', name: 'Marcus Delgado', role: 'Business Analyst', company: 'Capital One', loc: 'Richmond, VA', yo: 3,
    edu: [[UCSD, 'B.S.', 'Management Science', 2023]],
    jobs: [['Capital One', 'Business Analyst', 2023, 'Present']],
    interns: [['Capital One', 'Business Analyst Intern', 2022]],
    ind: ['Financial services'], int: ['Basketball', 'Brazilian Jiu-Jitsu'],
    sk: ['SQL', 'Excel', 'Tableau', 'Stakeholder interviews', 'Requirements gathering'],
    clubs: ['Triton Product Club'], mut: ['Leo A. (demo)'], contact: 'alumni-directory', source: ALUMNI }),
  mk({ id: 'p09', name: 'Lena Fischer', role: 'Data Scientist, Product', company: 'Roblox', loc: 'San Mateo, CA', yo: 6,
    edu: [['University of Washington', 'B.S.', 'Statistics', 2020]],
    jobs: [['Xbox (Microsoft)', 'Data Scientist', 2020, 2023], ['Roblox', 'Data Scientist, Product', 2023, 'Present']],
    ind: ['Gaming', 'Creator economy'], int: ['Gaming', 'Nintendo', 'Music'],
    sk: ['Python', 'Causal inference', 'A/B testing', 'SQL', 'Experimentation'],
    proj: [['Creator earnings experiments', 'Blog post on testing creator payout changes', ['creator', 'gaming', 'experimentation']]],
    contact: 'public-site', source: SPEAKER }),
  mk({ id: 'p10', name: 'Aaron Whitfield', role: 'Senior Product Manager', company: 'Xbox (Microsoft)', loc: 'Redmond, WA', yo: 10,
    edu: [['Oregon State University', 'B.S.', 'Computer Science', 2016]],
    jobs: [['Uber', 'Data Analyst', 2016, 2019], ['Xbox (Microsoft)', 'Product Manager', 2019, 2023], ['Xbox (Microsoft)', 'Senior Product Manager', 2023, 'Present']],
    ind: ['Gaming', 'Consumer tech'], int: ['Gaming', 'Basketball'],
    sk: ['Product prioritization', 'SQL', 'Roadmapping', 'Stakeholder interviews'],
    contact: 'professional-network', source: TEAM }),
  mk({ id: 'p11', name: 'Nadia Haddad', role: 'Data Analyst', company: 'Crunchyroll', loc: 'Los Angeles, CA', yo: 3,
    edu: [[UCSD, 'B.S.', 'Data Science', 2023]],
    jobs: [['Crunchyroll', 'Data Analyst', 2023, 'Present']],
    interns: [['Crunchyroll', 'Data Analytics Intern', 2022]],
    ind: ['Media / entertainment', 'Consumer apps'], int: ['Gaming', 'Nintendo', 'Brazilian Jiu-Jitsu', 'Music'],
    sk: ['SQL', 'Python', 'Tableau', 'Retention analysis', 'A/B testing'],
    clubs: ['Data Science Student Society'], mut: ['Dana R. (demo)', 'Jess K. (demo)'], recent: false,
    contact: 'alumni-directory', source: ALUMNI }),
  mk({ id: 'p12', name: 'Ethan Park', role: 'Product Analyst', company: 'Discord', loc: 'San Francisco, CA', yo: 2,
    edu: [['UC Davis', 'B.S.', 'Statistics', 2024]],
    jobs: [['Discord', 'Product Analyst', 2024, 'Present']],
    interns: [['Reddit', 'Data Science Intern', 2023]],
    ind: ['Gaming', 'Consumer apps'], int: ['Gaming', 'Basketball'],
    sk: ['SQL', 'Python', 'Behavioral analytics', 'A/B testing'], recent: true,
    contact: 'public-site', source: TEAM }),
  mk({ id: 'p13', name: 'Camila Torres', role: 'Associate Data Scientist', company: 'YouTube', loc: 'San Bruno, CA', yo: 4,
    edu: [[UCSD, 'B.S.', 'Data Science', 2022]],
    jobs: [['YouTube', 'Associate Data Scientist', 2022, 'Present']],
    interns: [['YouTube', 'Data Science Intern', 2021]],
    ind: ['Creator economy', 'Media / entertainment', 'Consumer tech'], int: ['Surf', 'Music', 'Creative web/product experiences'],
    sk: ['Python', 'Survival analysis', 'SQL', 'Experimentation', 'Statistics'],
    clubs: ['Data Science Student Society'],
    proj: [['Creator retention curves', 'Survival analysis on channel growth', ['youtube', 'creator', 'survival analysis']]],
    mut: ['Leo A. (demo)'], contact: 'alumni-directory', source: ALUMNI }),
  mk({ id: 'p14', name: 'Ravi Menon', role: 'Product Analyst II', company: 'Uber', loc: 'San Francisco, CA', yo: 4,
    edu: [['UC Santa Barbara', 'B.S.', 'Statistics and Data Science', 2022]],
    jobs: [['DoorDash', 'Data Analyst', 2022, 2024], ['Uber', 'Product Analyst II', 2024, 'Present']],
    ind: ['Consumer apps', 'Consumer tech'], int: ['Basketball', 'Music'],
    sk: ['SQL', 'Experimentation', 'Python', 'Looker'], contact: 'public-site', source: TEAM }),
  mk({ id: 'p15', name: 'Zoe Whitaker', role: 'Business Analyst', company: 'DoorDash', loc: 'Los Angeles, CA', yo: 5,
    edu: [['UCLA', 'B.A.', 'Economics', 2021]],
    jobs: [['DoorDash', 'Business Analyst', 2021, 2024], ['DoorDash', 'Senior Business Analyst', 2024, 'Present']],
    ind: ['Consumer apps', 'E-commerce'], int: ['Basketball', 'Surf'],
    sk: ['SQL', 'Excel', 'Tableau', 'Stakeholder interviews'], contact: 'professional-network', source: TEAM }),
  mk({ id: 'p16', name: 'Isaac Bernstein', role: 'Data Scientist', company: 'Reddit', loc: 'Remote (US)', yo: 5,
    edu: [['University of Michigan', 'B.S.', 'Data Science', 2021]],
    jobs: [['Reddit', 'Data Scientist', 2021, 'Present']],
    interns: [['Spotify', 'Data Science Intern', 2020]],
    ind: ['Consumer apps', 'Media / entertainment'], int: ['Music', 'Gaming', 'Brazilian Jiu-Jitsu'],
    sk: ['Python', 'Causal inference', 'SQL', 'A/B testing'], contact: 'public-site', source: GH, site: true }),
  mk({ id: 'p17', name: 'Keiko Tanaka', role: 'Product Manager', company: 'Nintendo', loc: 'Redmond, WA', yo: 6,
    edu: [['University of Washington', 'B.S.', 'Informatics', 2020]],
    jobs: [['Nintendo', 'Associate Product Manager', 2020, 2023], ['Nintendo', 'Product Manager', 2023, 'Present']],
    ind: ['Gaming', 'Consumer tech'], int: ['Nintendo', 'Gaming', 'Music'],
    sk: ['Product prioritization', 'User research', 'Requirements gathering'], contact: 'professional-network', source: TEAM }),
  mk({ id: 'p18', name: 'Brandon Lee', role: 'Associate Product Manager', company: 'Disney', loc: 'Burbank, CA', yo: 3,
    edu: [['USC', 'B.S.', 'Business Administration', 2023]],
    jobs: [['Disney', 'Associate Product Manager, Streaming', 2023, 'Present']],
    interns: [['Disney', 'Product Intern', 2022]],
    ind: ['Media / entertainment'], int: ['Basketball', 'Music'],
    sk: ['User research', 'SQL', 'Product prioritization'], contact: 'public-site', source: TEAM }),
  mk({ id: 'p19', name: 'Alicia Ford', role: 'University Recruiter', company: 'Riot Games', loc: 'Los Angeles, CA', yo: 6,
    edu: [['Cal State Long Beach', 'B.A.', 'Communications', 2020]],
    jobs: [['Riot Games', 'University Recruiter', 2022, 'Present']],
    ind: ['Gaming'], int: ['Gaming', 'Music'], sk: ['Campus recruiting'],
    contact: 'public-site', source: TEAM, note: 'Recruiter. Only worth a note when you have a specific question about the intern process.' }),
  mk({ id: 'p20', name: 'Samuel Okoro', role: 'Director of Product', company: 'Spotify', loc: 'New York, NY', yo: 15,
    edu: [['Cornell', 'B.S.', 'Operations Research', 2011]],
    jobs: [['Uber', 'Product Manager', 2013, 2018], ['Spotify', 'Director of Product', 2020, 'Present']],
    ind: ['Consumer tech', 'Media / entertainment'], int: ['Music', 'Basketball'],
    sk: ['Roadmapping', 'Product prioritization'], contact: 'none', source: SPEAKER, cat: 'Product Management',
    note: 'Senior leader. Included to show how the early-career preference ranks executives.' }),
  mk({ id: 'p21', name: 'Grace Liu', role: 'Sports Data Analyst', company: 'Pacific Hoops Network', loc: 'San Diego, CA', yo: 4,
    edu: [[UCSD, 'B.S.', 'Data Science', 2022]],
    jobs: [['Pacific Hoops Network', 'Sports Data Analyst', 2022, 'Present']],
    interns: [['Pacific Hoops Network', 'Analytics Intern', 2021]],
    ind: ['Sports', 'Media / entertainment'], int: ['Basketball', 'Brazilian Jiu-Jitsu', 'Surf', 'Sports analytics'],
    sk: ['Python', 'SQL', 'Tableau', 'Statistics'], clubs: ['Data Science Student Society'],
    proj: [['Broadcast stat engine', 'Live stat graphics pipeline for game broadcasts', ['sports', 'basketball', 'media']]],
    mut: ['Jess K. (demo)'], contact: 'alumni-directory', source: ALUMNI }),
  mk({ id: 'p22', name: 'Carlos Medina', role: 'Data Analyst', company: 'Qualcomm', loc: 'San Diego, CA', yo: 5,
    edu: [[UCSD, 'B.S.', 'Data Science', 2021]],
    jobs: [['Qualcomm', 'Data Analyst', 2021, 'Present']],
    ind: ['Enterprise software'], int: ['Surf', 'Brazilian Jiu-Jitsu'],
    sk: ['SQL', 'Python', 'Tableau', 'ETL'], clubs: ['Data Science Student Society'],
    mut: ['Leo A. (demo)'], contact: 'alumni-directory', source: ALUMNI,
    note: 'Not a target company, but a San Diego alum who mentors student teams. A good local, low-pressure chat.' }),
  mk({ id: 'p23', name: 'Tessa Brandt', role: 'Product Analyst', company: 'Airbnb', loc: 'San Francisco, CA', yo: 2,
    edu: [['University of Wisconsin', 'B.S.', 'Data Science', 2024]],
    jobs: [['Airbnb', 'Product Analyst', 2024, 'Present']],
    interns: [['Airbnb', 'Data Science Intern', 2023]],
    ind: ['Consumer tech', 'Consumer apps'], int: ['Basketball', 'Surf'],
    sk: ['SQL', 'Python', 'Experimentation', 'A/B testing'], recent: true, contact: 'public-site', source: TEAM }),
  mk({ id: 'p24', name: 'Omar Siddiqui', role: 'Product Analyst', company: 'Spotify', loc: 'New York, NY', yo: 5,
    edu: [['Rutgers', 'B.S.', 'Statistics', 2021]],
    jobs: [['Capital One', 'Data Scientist', 2021, 2023], ['Spotify', 'Product Analyst', 2023, 'Present']],
    interns: [['Capital One', 'Data Science Intern', 2020]],
    ind: ['Consumer tech', 'Media / entertainment'], int: ['Music', 'Basketball'],
    sk: ['Python', 'SQL', 'A/B testing', 'Product analytics'], contact: 'public-site', source: SPEAKER,
    note: 'Moved from data science at a bank into product analytics at a consumer company.' }),
  mk({ id: 'p25', name: 'Jenna Ortiz', role: 'Business Strategy Analyst', company: 'Los Angeles Lakers', loc: 'El Segundo, CA', yo: 4,
    edu: [['UC Irvine', 'B.A.', 'Economics', 2022]],
    jobs: [['Los Angeles Lakers', 'Business Strategy Analyst', 2022, 'Present']],
    interns: [['Los Angeles Lakers', 'Business Analytics Intern', 2021]],
    ind: ['Sports'], int: ['Basketball', 'Sports analytics'],
    sk: ['SQL', 'Excel', 'Tableau', 'Statistics'], contact: 'public-site', source: TEAM, cat: 'Business Analytics' }),
  mk({ id: 'p26', name: 'Victor Hsu', role: 'Associate Product Manager', company: 'Roblox', loc: 'San Mateo, CA', yo: 4,
    edu: [[UCSD, 'B.S.', 'Data Science', 2022]],
    jobs: [['Qualcomm', 'Data Analyst', 2022, 2024], ['Roblox', 'Associate Product Manager', 2024, 'Present']],
    interns: [['Roblox', 'Product Analytics Intern', 2021]],
    ind: ['Gaming', 'Creator economy'], int: ['Gaming', 'Brazilian Jiu-Jitsu', 'Nintendo'],
    sk: ['SQL', 'Product prioritization', 'User research', 'Python'], clubs: ['Triton Product Club'],
    mut: ['Dana R. (demo)'], recent: true, contact: 'alumni-directory', source: ALUMNI,
    note: 'Analyst-to-PM move after a former product analytics internship at the same company.' }),
  mk({ id: 'p27', name: 'Mei-Ling Zhou', role: 'Data Analyst', company: 'Sunridge Energy Analytics', loc: 'San Diego, CA', yo: 3,
    edu: [['San Diego State University', 'B.S.', 'Applied Mathematics', 2023]],
    jobs: [['Sunridge Energy Analytics', 'Data Analyst', 2023, 'Present']],
    ind: ['Energy / climate'], int: ['Surf', 'Music'], sk: ['SQL', 'PostgreSQL', 'ETL', 'Python', 'Data cleaning'],
    contact: 'public-site', source: SITE, site: true,
    note: 'Clean-energy data work, so the tie is your Center for Community Energy experience rather than product.' }),
  mk({ id: 'p28', name: 'Nate Kowalski', role: 'Growth Analyst', company: 'Patreon', loc: 'Remote (US)', yo: 2,
    edu: [['University of Michigan', 'B.S.', 'Data Science', 2024]],
    jobs: [['Patreon', 'Growth Analyst', 2024, 'Present']],
    interns: [['Patreon', 'Data Intern', 2023]],
    ind: ['Creator economy', 'Consumer apps'], int: ['Brazilian Jiu-Jitsu', 'Music', 'Gaming'],
    sk: ['SQL', 'Python', 'Experimentation', 'Behavioral analytics'], recent: true, contact: 'public-site', source: TEAM }),
  mk({ id: 'p29', name: 'Imani Carter', role: 'Data Analyst', company: 'Sephora', loc: 'San Francisco, CA', yo: 3,
    edu: [['San Jose State University', 'B.S.', 'Business Analytics', 2023]],
    jobs: [['Sephora', 'Data Analyst', 2023, 'Present']],
    interns: [['Sephora', 'Analytics Intern', 2022]],
    ind: ['E-commerce', 'Consumer tech'], int: ['Music', 'Creative web/product experiences'],
    sk: ['SQL', 'Tableau', 'Excel', 'A/B testing'], contact: 'public-site', source: TEAM }),
  mk({ id: 'p30', name: 'Diego Alvarez', role: 'Senior Data Scientist', company: 'Uber', loc: 'San Francisco, CA', yo: 8,
    edu: [['UC Berkeley', 'M.S.', 'Statistics', 2018]],
    jobs: [['Uber', 'Data Scientist', 2018, 2022], ['Uber', 'Senior Data Scientist', 2022, 'Present']],
    ind: ['Consumer tech', 'Consumer apps'], int: ['Basketball', 'Brazilian Jiu-Jitsu'],
    sk: ['Python', 'Causal inference', 'Experimentation', 'SQL'], contact: 'professional-network', source: SPEAKER }),
  mk({ id: 'p31', name: 'Chloe Bennett', role: 'Associate Product Manager', company: 'YouTube', loc: 'Playa Vista, CA', yo: 3,
    edu: [['USC', 'B.S.', 'Computer Science', 2023]],
    jobs: [['YouTube', 'Associate Product Manager, Creator Tools', 2023, 'Present']],
    interns: [['YouTube', 'Product Management Intern', 2022]],
    ind: ['Creator economy', 'Media / entertainment'], int: ['Music', 'Creative web/product experiences', 'Gaming'],
    sk: ['Product prioritization', 'SQL', 'User research'], mut: ['Priya S. (demo)'], contact: 'public-site', source: SPEAKER }),
  mk({ id: 'p32', name: 'Wei Zhang', role: 'Esports Data Analyst', company: 'Riot Games', loc: 'Los Angeles, CA', yo: 5,
    edu: [['UC Irvine', 'B.S.', 'Statistics', 2021]],
    jobs: [['Riot Games', 'Esports Data Analyst', 2021, 'Present']],
    interns: [['Riot Games', 'Esports Analytics Intern', 2020]],
    ind: ['Gaming', 'Sports'], int: ['League of Legends', 'Gaming', 'Basketball'],
    sk: ['Python', 'SQL', 'Hypothesis testing', 'Predictive modeling'],
    proj: [['Pro match snowball study', 'Public analysis of early-lead conversion in pro matches', ['gaming', 'league of legends', 'esports', 'hypothesis testing']]],
    contact: 'public-site', source: SPEAKER, site: true, cat: 'Sports Analytics' }),
  mk({ id: 'p33', name: 'Fiona Gallagher', role: 'Strategy & Analytics Manager', company: 'NBA', loc: 'New York, NY', yo: 6,
    edu: [['Duke', 'B.S.', 'Statistics', 2020]],
    jobs: [['NBA', 'Strategy & Analytics Associate', 2020, 2023], ['NBA', 'Strategy & Analytics Manager', 2023, 'Present']],
    interns: [['NBA', 'Strategy Intern', 2019]],
    ind: ['Sports', 'Media / entertainment'], int: ['Basketball', 'Sports analytics'],
    sk: ['SQL', 'Excel', 'Statistics', 'Tableau'], contact: 'professional-network', source: SPEAKER, cat: 'Business Analytics' }),
  mk({ id: 'p34', name: 'Andre Washington', role: 'Data Analyst', company: 'Disney', loc: 'Orlando, FL', yo: 3,
    edu: [['University of Florida', 'B.S.', 'Statistics', 2023]],
    jobs: [['Disney', 'Data Analyst', 2023, 'Present']],
    interns: [['Disney', 'Data Analytics Intern', 2022]],
    ind: ['Media / entertainment'], int: ['Basketball', 'Music', 'Gaming'],
    sk: ['SQL', 'Tableau', 'Python', 'Excel'], contact: 'public-site', source: TEAM }),
  mk({ id: 'p35', name: 'Kenji Sato', role: 'Associate Product Manager', company: 'Riot Games', loc: 'Los Angeles, CA', yo: 5,
    edu: [[UCSD, 'B.A.', 'Economics', 2021]],
    jobs: [['Riot Games', 'Business Analyst', 2021, 2023], ['Riot Games', 'Associate Product Manager', 2023, 'Present']],
    interns: [['Riot Games', 'Product Management Intern', 2020]],
    ind: ['Gaming'], int: ['League of Legends', 'Basketball', 'Brazilian Jiu-Jitsu', 'Gaming'],
    sk: ['SQL', 'Product prioritization', 'User research', 'A/B testing', 'Stakeholder interviews'],
    clubs: ['Triton Product Club'], mut: ['Dana R. (demo)'], contact: 'alumni-directory', source: ALUMNI,
    note: 'UCSD alum who went from business analyst to PM inside a gaming studio.' }),
]
