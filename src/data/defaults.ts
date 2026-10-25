import type { FactorId, SliderId, UserProfile } from '../types'

export const FACTOR_DEFAULTS: Record<FactorId, number> = {
  roleMatch: 20,
  companyMatch: 15,
  internMatch: 15,
  academic: 10,
  careerPath: 10,
  productDataOverlap: 10,
  focusFit: 10,
  alumni: 15,
  club: 8,
  geography: 5,
  hobby: 5,
  projectDomain: 5,
  mutuals: 5,
  hiring: 10,
  roleOpen: 8,
  recent: 5,
  earlyCareer: 5,
  contact: 5,
}

export const SLIDER_DEFAULTS: Record<SliderId, number> = {
  alumni: 50,
  formerInterns: 50,
  gaming: 50,
  sports: 50,
  pm: 50,
  productAnalytics: 50,
  sameSchool: 50,
  earlyCareer: 50,
}

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Yra Climaco',
  school: 'UC San Diego',
  degree: 'B.S. Data Science',
  minor: 'Business Analytics',
  gradYear: '2028',
  gpa: '3.82',
  careerGoals: ['Product Analytics', 'Product Management', 'Data / Business Analytics', 'Data Science', 'Consumer-tech roles'],
  targetRoles: ['Product Analytics', 'Product Management', 'Data Analytics', 'Business Analytics', 'Data Science'],
  industries: ['Consumer tech', 'Gaming', 'Sports', 'Media / entertainment', 'Creator economy', 'E-commerce', 'Consumer apps'],
  targetCompanies: ['Riot Games', 'Spotify', 'Uber', 'Disney', 'Xbox / Microsoft', 'Crunchyroll', 'Nintendo', 'NBA', 'NBA teams', 'Patreon', 'Sephora', 'Capital One', 'Roblox', 'YouTube', 'Discord', 'Reddit', 'Airbnb', 'DoorDash'],
  locations: ['San Diego', 'Los Angeles'],
  remoteOk: true,
  openToRelocate: true,
  extraSchools: [],
  hobbies: ['Brazilian Jiu-Jitsu', 'Basketball', 'Gaming', 'League of Legends', 'Nintendo', 'Music', 'Consumer tech', 'Surf', 'Sports analytics', 'Creative web/product experiences'],
  skills: ['Python', 'SQL', 'PostgreSQL', 'pandas', 'scikit-learn', 'Statistics', 'Hypothesis testing', 'A/B testing', 'Behavioral analytics', 'Tableau', 'Excel', 'ETL', 'GCP', 'AWS', 'User research', 'Stakeholder interviews', 'Product analytics', 'Requirements gathering', 'Product prioritization', 'Experimentation', 'AI workflows'],
  clubs: ['Data Science Student Society'],
  projects: [
    { title: 'SurfCast SD', summary: 'Live ML surf forecasting on 303,000+ hourly observations', domains: ['surf', 'forecasting', 'machine learning', 'gcp'] },
    { title: 'TubeScope', summary: 'YouTube virality and audience behavior, survival analysis, 3rd place DS3 Showcase', domains: ['youtube', 'creator', 'survival analysis', 'dashboard'] },
    { title: 'League of Legends Snowball Effect', summary: '9,236 pro matches, behavioral analysis and prediction', domains: ['gaming', 'league of legends', 'esports', 'hypothesis testing'] },
    { title: 'NBA Shot Make Probability Model', summary: '425,000+ shots, gradient boosting, cross-season validation', domains: ['nba', 'basketball', 'sports', 'player tracking', 'gradient boosting'] },
  ],
  sliders: { ...SLIDER_DEFAULTS },
  weights: { ...FACTOR_DEFAULTS },
}

export const DEFAULT_LISTS = ['High Priority', 'Reach Out This Week', 'Sports', 'Gaming', 'PM', 'Product Analytics', 'Alumni', 'Applied Company']

export const SCHOOL_ALIASES: Record<string, string[]> = {
  'uc san diego': ['ucsd', 'uc san diego', 'university of california, san diego', 'university of california san diego'],
}
