'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { setItem } from '@/lib/storage'

const GOALS = [
  'รู้จักตัวเองมากขึ้น',
  'พัฒนาตนเอง',
  'วางแผนอาชีพ',
  'ปรับปรุงความสัมพันธ์',
  'ความอยากรู้อยากเห็น',
  'อื่นๆ',
]

export default function ProfilePage() {
  const router = useRouter()
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [occupation, setOccupation] = useState('')
  const [goal, setGoal] = useState('')

  function handleSubmit() {
    const parsedAge = age ? parseInt(age) : null
    const validAge = parsedAge && parsedAge >= 10 && parsedAge <= 100 ? String(parsedAge) : null
    const profile = {
      age: validAge,
      sex: sex || null,
      occupation: occupation || null,
      goal: goal || null,
    }

    setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
    router.push('/results')
  }

  return (
    <main id="main" className="page-shell flex items-center">
      <div className="page-wrap">
        <section className="glass-panel rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.86fr)_minmax(320px,0.62fr)] lg:items-start">
            <div>
              <span className="eyebrow">
                <span className="accent-dot" aria-hidden="true" />
                Optional Context
              </span>

              <h1 className="display-title mt-6 text-4xl sm:text-5xl">
                เติมบริบทเล็กน้อย เพื่อให้รายงานอ่านเป็นคุณมากขึ้น
              </h1>

              <p className="body-soft mt-4 max-w-2xl text-base leading-8">
                ข้อมูลส่วนนี้ไม่บังคับ แต่ช่วยให้การอธิบายผลลัพธ์มีบริบทมากขึ้น เช่น
                ช่วงวัย งานที่ทำ หรือเหตุผลที่คุณสนใจแบบทดสอบครั้งนี้
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="section-panel rounded-[1.5rem] px-5 py-5">
                  <p className="text-sm font-semibold text-slate-800">ใช้เพื่อการตีความเท่านั้น</p>
                  <p className="body-soft mt-2 text-sm leading-7">
                    ระบบจะใช้ข้อมูลเพื่อช่วยสรุปผลให้เหมาะกับบริบทส่วนตัวของคุณมากขึ้น
                  </p>
                </div>
                <div className="section-panel rounded-[1.5rem] px-5 py-5">
                  <p className="text-sm font-semibold text-slate-800">ข้ามได้ทุกข้อ</p>
                  <p className="body-soft mt-2 text-sm leading-7">
                    หากไม่ต้องการระบุรายละเอียดบางอย่าง คุณสามารถปล่อยว่างไว้ได้ทั้งหมด
                  </p>
                </div>
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
                      max={100}
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="เช่น 28"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <p className="field-label">เพศ</p>
                    <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="เพศ">
                      {['ชาย', 'หญิง', 'ไม่ระบุ'].map(option => (
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
                      อาชีพ
                    </label>
                    <input
                      id="occupation"
                      type="text"
                      value={occupation}
                      onChange={e => setOccupation(e.target.value)}
                      placeholder="เช่น นักศึกษา วิศวกร ครู"
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
                  Before Results
                </p>
                <h2 className="section-title mt-3 text-2xl">
                  ขั้นตอนสุดท้ายก่อนดูรายงาน
                </h2>
                <p className="body-soft mt-3 text-sm leading-7">
                  เมื่อกดดูผลลัพธ์ ระบบจะนำคะแนนแบบทดสอบและข้อมูลเพิ่มเติมที่คุณเลือกกรอก
                  ไปสร้างคำอธิบายบุคลิกภาพแบบอ่านง่ายในภาษาไทย
                </p>
              </div>

              <div className="muted-panel rounded-[1.75rem] px-5 py-6 sm:px-6">
                <p className="text-sm font-semibold text-slate-800">หลักการความเป็นส่วนตัว</p>
                <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
                  <li>ข้อมูลส่วนตัวใช้เพื่อการวิเคราะห์เท่านั้น</li>
                  <li>ไม่มีการบังคับกรอกข้อมูลใด ๆ</li>
                  <li>คุณสามารถย้อนกลับไปแก้คำตอบแบบทดสอบได้ก่อนดูผล</li>
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

              <p className="body-faint px-2 text-center text-xs leading-6">
                ข้อมูลทั้งหมดถูกเก็บไว้เฉพาะในอุปกรณ์ของคุณเพื่อประสบการณ์การประเมินที่เป็นส่วนตัวมากขึ้น
              </p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
