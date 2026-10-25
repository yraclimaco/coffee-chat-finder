import { ALL_COMPANY_NAMES } from '../data/companies'
import { INDUSTRIES, ROLE_CATEGORIES } from '../types'
import type { RoleCategory, UserProfile } from '../types'
import { Field, PillSelect, Toggle, TokenInput } from './ui'

const TARGET_ROLE_OPTIONS = ROLE_CATEGORIES.filter((r) => !['Recruiting', 'Engineering', 'Leadership', 'Other'].includes(r))

export function ProfileForm({ profile, onChange }: { profile: UserProfile; onChange: (patch: Partial<UserProfile>) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className="field" value={profile.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
        <Field label="School"><input className="field" value={profile.school} onChange={(e) => onChange({ school: e.target.value })} /></Field>
        <Field label="Degree"><input className="field" value={profile.degree} onChange={(e) => onChange({ degree: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Minor"><input className="field" value={profile.minor} onChange={(e) => onChange({ minor: e.target.value })} /></Field>
          <Field label="Grad year"><input className="field" value={profile.gradYear} onChange={(e) => onChange({ gradYear: e.target.value })} /></Field>
        </div>
      </div>
      <Field label="Target roles"><PillSelect options={TARGET_ROLE_OPTIONS} value={profile.targetRoles} onChange={(v) => onChange({ targetRoles: v as RoleCategory[] })} /></Field>
      <Field label="Target industries"><PillSelect options={INDUSTRIES} value={profile.industries} onChange={(v) => onChange({ industries: v })} /></Field>
      <Field label="Target companies" hint="Type to add. 'NBA' and 'NBA teams' cover league and team staff."><TokenInput value={profile.targetCompanies} onChange={(v) => onChange({ targetCompanies: v })} suggestions={ALL_COMPANY_NAMES} placeholder="Add a company" /></Field>
      <Field label="Career goals"><TokenInput value={profile.careerGoals} onChange={(v) => onChange({ careerGoals: v })} placeholder="Add a goal" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Locations you want to be near"><TokenInput value={profile.locations} onChange={(v) => onChange({ locations: v })} placeholder="City or metro" suggestions={['San Diego', 'Los Angeles', 'Bay Area', 'Seattle', 'New York']} /></Field>
        <div className="flex flex-col justify-end gap-2.5 pb-1.5">
          <Toggle checked={profile.remoteOk} onChange={(v) => onChange({ remoteOk: v })} label="Remote is okay" />
          <Toggle checked={profile.openToRelocate} onChange={(v) => onChange({ openToRelocate: v })} label="Open to relocating nationwide" />
        </div>
      </div>
      <Field label="Other schools you follow" hint="Alumni from these get a smaller bonus than your own school."><TokenInput value={profile.extraSchools} onChange={(v) => onChange({ extraSchools: v })} placeholder="e.g. UCLA" /></Field>
      <Field label="Clubs and orgs"><TokenInput value={profile.clubs} onChange={(v) => onChange({ clubs: v })} placeholder="Add a club" /></Field>
      <Field label="Hobbies and interests" hint="Used as tie-breakers and personalization hooks, never as the main reason."><TokenInput value={profile.hobbies} onChange={(v) => onChange({ hobbies: v })} placeholder="Add an interest" /></Field>
      <Field label="Skills"><TokenInput value={profile.skills} onChange={(v) => onChange({ skills: v })} placeholder="Add a skill" /></Field>
    </div>
  )
}
