export const ROLE_CATEGORIES = [
  'Product Analytics',
  'Product Management',
  'Data Analytics',
  'Business Analytics',
  'Data Science',
  'Sports Analytics',
  'Recruiting',
  'Engineering',
  'Leadership',
  'Other',
] as const
export type RoleCategory = (typeof ROLE_CATEGORIES)[number]

export const INDUSTRIES = [
  'Consumer tech',
  'Gaming',
  'Sports',
  'Media / entertainment',
  'Creator economy',
  'E-commerce',
  'Consumer apps',
  'Financial services',
  'Enterprise software',
  'Energy / climate',
] as const

export type Seniority = 'Intern' | 'Early career' | 'Mid-level' | 'Senior' | 'Executive'
export type ContactPathway = 'public-site' | 'alumni-directory' | 'professional-network' | 'none'

export interface Education {
  school: string
  degree: string
  field: string
  gradYear: number
}

export interface Job {
  company: string
  role: string
  start: number
  end: number | 'Present'
  category?: RoleCategory
}

export interface Internship {
  company: string
  role: string
  year: number
  category?: RoleCategory
}

export interface PersonProject {
  title: string
  note: string
  domains: string[]
}

export interface Person {
  id: string
  name: string
  headline: string
  company: string
  role: string
  roleCategory: RoleCategory
  location: string
  yearsOut: number
  education: Education[]
  careerHistory: Job[]
  priorCompanies: string[]
  internshipHistory: Internship[]
  industries: string[]
  interests: string[]
  skills: string[]
  clubs: string[]
  projects: PersonProject[]
  mutuals: string[]
  recentlyJoined: boolean
  contactPathway: ContactPathway
  linkedinUrl?: string
  websiteUrl?: string
  githubUrl?: string
  source: string
  sourceUrl?: string
  tags: string[]
  notes: string
  isDemo: boolean
}

export interface Company {
  name: string
  aliases: string[]
  industries: string[]
  hiringSummer2027: boolean
  openRoles: RoleCategory[]
  hooks: string[]
}

export type FactorId =
  | 'roleMatch'
  | 'companyMatch'
  | 'internMatch'
  | 'academic'
  | 'careerPath'
  | 'productDataOverlap'
  | 'focusFit'
  | 'alumni'
  | 'club'
  | 'geography'
  | 'hobby'
  | 'projectDomain'
  | 'mutuals'
  | 'hiring'
  | 'roleOpen'
  | 'recent'
  | 'earlyCareer'
  | 'contact'

export type FactorGroup = 'Professional alignment' | 'Connection strength' | 'Timing relevance' | 'Accessibility'

export type SliderId =
  | 'alumni'
  | 'formerInterns'
  | 'gaming'
  | 'sports'
  | 'pm'
  | 'productAnalytics'
  | 'sameSchool'
  | 'earlyCareer'

export interface FactorResult {
  id: FactorId
  group: FactorGroup
  label: string
  max: number
  earned: number
  detail: string | null
}

export interface ScoreResult {
  percent: number
  raw: number
  max: number
  factors: FactorResult[]
  reasons: string[]
}

export interface UserProject {
  title: string
  summary: string
  domains: string[]
}

export interface UserProfile {
  name: string
  school: string
  degree: string
  minor: string
  gradYear: string
  gpa: string
  careerGoals: string[]
  targetRoles: RoleCategory[]
  industries: string[]
  targetCompanies: string[]
  locations: string[]
  remoteOk: boolean
  openToRelocate: boolean
  extraSchools: string[]
  hobbies: string[]
  skills: string[]
  clubs: string[]
  projects: UserProject[]
  sliders: Record<SliderId, number>
  weights: Record<FactorId, number>
}

export const PIPELINE_STATUSES = [
  'Not Contacted',
  'Ready to Contact',
  'Contacted',
  'Follow-Up Due',
  'Responded',
  'Coffee Chat Scheduled',
  'Coffee Chat Completed',
  'Stay in Touch',
  'Referral Discussion',
  'Closed',
] as const
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number]

export const CHANNELS = ['LinkedIn', 'Email', 'Alumni directory', 'In person', 'Other'] as const
export type Channel = (typeof CHANNELS)[number]

export interface Outreach {
  personId: string
  status: PipelineStatus
  channel: Channel
  dateContacted: string
  message: string
  response: string
  followUpDate: string
  chatDate: string
  notes: string
  nextAction: string
  contactedAt?: string
  respondedAt?: string
  updatedAt: string
}

export interface SearchFilters {
  keyword: string
  company: string
  role: string
  school: string
  industry: string
  location: string
  interest: string
  internship: string
  seniority: string
  field: string
  alumniOnly: boolean
  formerInternOnly: boolean
}

export const EMPTY_FILTERS: SearchFilters = {
  keyword: '',
  company: '',
  role: '',
  school: '',
  industry: '',
  location: '',
  interest: '',
  internship: '',
  seniority: '',
  field: '',
  alumniOnly: false,
  formerInternOnly: false,
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: SearchFilters
}

export interface SavedEntry {
  savedAt: string
  lists: string[]
}
