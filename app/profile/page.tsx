'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { getItemAsync, setItem } from '@/lib/storage'

const GOALS = [
  'รู้จักตัวเองมากขึ้น',
  'พัฒนาตนเอง',
  'วางแผนอาชีพ',
  'ปรับปรุงความสัมพันธ์',
  'ความอยากรู้อยากเห็น',
  'อื่นๆ',
]

function normalizeProfile(age: string, sex: string, occupation: string, goal: string) {
  const parsedAge = age ? parseInt(age, 10) : null
  const validAge = parsedAge && parsedAge >= 10 && parsedAge <= 100 ? String(parsedAge) : null

  return {
    age: validAge,
    sex: sex || null,
    occupation: occupation.trim() || null,
    goal: goal || null,
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [occupation, setOccupation] = useState('')
  const [goal, setGoal] = useState('')
  const hasRestored = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function restoreProfile() {
      const savedProfile = await getItemAsync(STORAGE_KEYS.PROFILE)
      if (cancelled) return
      if (!savedProfile) {
        hasRestored.current = true
        return
      }

      try {
        const parsed = JSON.parse(savedProfile) as {
          age?: string | null
          sex?: string | null
          occupation?: string | null
          goal?: string | null
        }

        setAge(parsed.age ?? '')
        setSex(parsed.sex ?? '')
        setOccupation(parsed.occupation ?? '')
        setGoal(parsed.goal ?? '')
      } catch {
        /* ignore corrupt profile */
      } finally {
        hasRestored.current = true
      }
    }

    void restoreProfile()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasRestored.current) return
    setItem(STORAGE_KEYS.PROFILE, JSON.stringify(normalizeProfile(age, sex, occupation, goal)))
  }, [age, goal, occupation, sex])

  function handleSubmit() {
    const profile = normalizeProfile(age, sex, occupation, goal)

    setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
    router.push('/results')
  }

  return (
    <main id="main" className="page-shell">
      <div className="page-wrap">
        <section className="glass-panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(320px,0.62fr)] lg:items-start">
            <div>
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                additional // b5
              </span>

              <h1 className="display-title mt-6 text-4xl sm:text-5xl">
                ข้อมูลประกอบการสรุปผล
              </h1>

              <p className="body-soft mt-4 max-w-2xl text-base leading-8">
                กรอกเท่าที่สะดวก เพื่อช่วยให้รายงานอ่านได้ตรงบริบทมากขึ้น
              </p>

              <div className="mt-8 section-panel rounded-[1.5rem] px-5 py-5">
                <p className="text-sm font-semibold text-slate-800">การกรอกข้อมูล (ไม่บังคับ)</p>
                <p className="body-soft mt-2 text-sm leading-[1.6]">
                  บางครั้งข้อมูลเพิ่มเติมช่วยให้การสรุปผลมีความเฉพาะตัวและเป็นประโยชน์มากขึ้น แต่หากไม่สะดวกที่จะกรอกก็สามารถข้ามไปดูผลลัพธ์ได้เลย
                </p>
              </div>

              <div className="mt-8 section-panel rounded-[1.75rem] p-5 sm:p-6">
                <div className="grid gap-5">
                  <div>
                    <label htmlFor="age" className="field-label">
                      อายุ
                    </label>
                    <input
                      id="age"
                      type="number"
                      min={10}
                      max={120}
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="เช่น 28"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <p className="field-label">เพศ</p>
                    <div className="grid gap-4 sm:grid-cols-4" role="group" aria-label="เพศ">
                      {['ชาย', 'หญิง', 'ไม่ระบุ', 'อื่นๆ'].map(option => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={sex === option}
                          onClick={() => setSex(sex === option ? '' : option)}
                          className={`choice-chip min-h-[3.3rem] px-4 text-sm font-medium ${
                            sex === option ? 'active' : ''
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="occupation" className="field-label">
                      อาชีพ หรือ ความเชี่ยวชาญ
                    </label>
                    <input
                      id="occupation"
                      type="text"
                      value={occupation}
                      onChange={e => setOccupation(e.target.value)}
                      placeholder="เช่น นักศึกษา วิศวกร ที่ปรึกษา ฯลฯ"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <p className="field-label">วัตถุประสงค์ในการทำแบบทดสอบ</p>
                    <div className="flex flex-wrap gap-3" role="group" aria-label="วัตถุประสงค์">
                      {GOALS.map(option => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={goal === option}
                          onClick={() => setGoal(goal === option ? '' : option)}
                          className={`choice-chip px-4 py-3 text-sm font-medium ${
                            goal === option ? 'active' : ''
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="section-panel rounded-[1.75rem] px-5 py-6 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  ก่อนดูผล
                </p>
                <h2 className="section-title mt-3 text-2xl">
                  ขั้นตอนสุดท้ายก่อนดูผลการประเมิน
                </h2>
                <p className="body-soft mt-3 text-sm leading-[1.6]">
                  คะแนนและข้อมูลที่คุณกรอกจะถูกใช้เพื่อจัดทำรายงานสรุปภาษาไทย
                </p>
              </div>

              <div className="muted-panel rounded-[1.75rem] px-5 py-6 sm:px-6">
                <p className="text-sm font-semibold text-slate-800">หลักการความเป็นส่วนตัว</p>
                <ul className="mt-3 space-y-3 text-sm leading-[1.6] text-slate-600">
                  <li>ข้อมูลใช้เพื่อการสรุปผลเท่านั้น</li>
                  <li>ไม่มีการบังคับกรอกข้อมูลใด ๆ</li>
                  <li>ย้อนกลับไปแก้คำตอบได้ก่อนดูผล</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSubmit}
                  className="primary-button w-full text-base"
                >
                  ดูผลลัพธ์
                  <span aria-hidden="true">→</span>
                </button>

                <Link href="/quiz" className="secondary-button w-full text-sm">
                  <span aria-hidden="true">←</span>
                  ย้อนกลับแก้ไขคำตอบ
                </Link>
              </div>

              <p className="body-faint px-2 text-center text-xs leading-[1.5]">
                ข้อมูลทั้งหมดถูกเก็บไว้เฉพาะในอุปกรณ์ของคุณ
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
