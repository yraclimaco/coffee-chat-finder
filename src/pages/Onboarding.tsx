import { Coffee } from 'lucide-react'
import { useState } from 'react'
import { ProfileForm } from '../components/ProfileForm'
import { DEMO_PEOPLE } from '../data/demoPeople'
import { actions, getState } from '../lib/store'
import type { UserProfile } from '../types'

export default function Onboarding() {
  const [profile, setProfile] = useState<UserProfile>(() => structuredClone(getState().profile))
  return (
    <div className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white"><Coffee size={19} /></span>
          <span className="font-display text-xl font-semibold">Coffee Chat Finder</span>
        </div>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-4xl">Who is worth a 15 minute conversation?</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          I pre-filled this from what you told me. Confirm or edit it, and your matches will reflect it. You can change everything later in Profile.
        </p>
        <div className="mt-3 rounded-xl border border-dashed border-line px-3.5 py-2.5 text-xs leading-relaxed text-ink-faint">
          Everything runs locally on <b>{DEMO_PEOPLE.length} fictional demo profiles</b>. Nothing is scraped, sent, or contacted. You approve every message yourself.
        </div>
        <div className="card mt-6 p-5 sm:p-6">
          <ProfileForm profile={profile} onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))} />
        </div>
        <div className="sticky bottom-0 -mx-4 mt-6 flex justify-end border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
          <button className="btn-accent !px-6 !py-3 text-base" onClick={() => actions.completeOnboarding(profile)}>Show my matches</button>
        </div>
      </div>
    </div>
  )
}
