import { useMemo } from 'react'
import type { Person, ScoreResult } from '../types'
import { scorePerson } from './scoring'
import { allPeople, useApp } from './store'

export function useScored() {
  const s = useApp()
  return useMemo(() => {
    const people = allPeople(s)
    const scores = new Map<string, ScoreResult>()
    people.forEach((p) => scores.set(p.id, scorePerson(p, s.profile)))
    const byId = new Map<string, Person>(people.map((p) => [p.id, p]))
    return { people, scores, byId }
  }, [s.profile, s.imported, s.hideDemo])
}
