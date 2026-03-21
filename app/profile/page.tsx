'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
    <main id="main" className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-3">📝</span>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลเพิ่มเติม</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            ข้อมูลเหล่านี้ช่วยให้ AI วิเคราะห์บุคลิกภาพได้ตรงกับคุณมากขึ้น
            <br />
            <span className="text-indigo-500 font-medium">สามารถข้ามได้ทุกข้อ</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-semibold text-slate-700 mb-1.5">
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
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 transition"
            />
          </div>

          {/* Sex */}
          <div>
            <p className="block text-sm font-semibold text-slate-700 mb-1.5">เพศ</p>
            <div className="flex gap-2" role="group" aria-label="เพศ">
              {['ชาย', 'หญิง', 'ไม่ระบุ'].map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={sex === option}
                  onClick={() => setSex(sex === option ? '' : option)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    sex === option
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Occupation */}
          <div>
            <label htmlFor="occupation" className="block text-sm font-semibold text-slate-700 mb-1.5">
              อาชีพ
            </label>
            <input
              id="occupation"
              type="text"
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              placeholder="เช่น นักศึกษา, วิศวกร, ครู"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 transition"
            />
          </div>

          {/* Goal */}
          <div>
            <p className="block text-sm font-semibold text-slate-700 mb-1.5">
              วัตถุประสงค์ในการทำแบบทดสอบ
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="วัตถุประสงค์">
              {GOALS.map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={goal === option}
                  onClick={() => setGoal(goal === option ? '' : option)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                    goal === option
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base py-4 rounded-2xl shadow-md transition-colors"
        >
          ดูผลลัพธ์ →
        </button>

        {/* Back to quiz */}
        <div className="flex justify-center mt-4">
          <Link
            href="/quiz"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← ย้อนกลับแก้ไขคำตอบ
          </Link>
        </div>

        <p className="text-center text-xs text-slate-300 mt-4">
          ข้อมูลส่วนตัวจะถูกใช้เพื่อการวิเคราะห์เท่านั้น ไม่มีการจัดเก็บ
        </p>
      </div>
    </main>
  )
}
