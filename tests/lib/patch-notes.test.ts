import { describe, it, expect } from 'vitest'
import { getAllPatchNotes, getPatchNoteContent } from '@/lib/patch-notes'

describe('getAllPatchNotes', () => {
  it('returns an array', () => {
    const notes = getAllPatchNotes()
    expect(Array.isArray(notes)).toBe(true)
  })

  it('returns at least one patch note', () => {
    const notes = getAllPatchNotes()
    expect(notes.length).toBeGreaterThan(0)
  })

  it('each note has required fields', () => {
    const notes = getAllPatchNotes()
    for (const note of notes) {
      expect(note.slug).toBeTruthy()
      expect(note.version).toBeTruthy()
      expect(note.title).toBeTruthy()
      expect(Array.isArray(note.tags)).toBe(true)
    }
  })

  it('returns notes sorted newest first by date', () => {
    const notes = getAllPatchNotes()
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i - 1].date >= notes[i].date).toBe(true)
    }
  })
})

describe('getPatchNoteContent', () => {
  it('returns meta and content for a valid slug', () => {
    const { meta, content } = getPatchNoteContent('2026-05')
    expect(meta.slug).toBe('2026-05')
    expect(meta.version).toBe('2026.05')
    expect(content.length).toBeGreaterThan(0)
  })
})
