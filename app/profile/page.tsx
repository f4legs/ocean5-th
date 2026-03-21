'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    const profile = {
      age: age || null,
      sex: sex || null,
      occupation: occupation || null,
      goal: goal || null,
    }
    localStorage.setItem('ocean_profile', JSON.stringify(profile))
    router.push('/results')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              อายุ
            </label>
            <input
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เพศ
            </label>
            <div className="flex gap-2">
              {['ชาย', 'หญิง', 'ไม่ระบุ'].map(option => (
                <button
                  key={option}
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              อาชีพ
            </label>
            <input
              type="text"
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              placeholder="เช่น นักศึกษา, วิศวกร, ครู"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 transition"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              วัตถุประสงค์ในการทำแบบทดสอบ
            </label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(option => (
                <button
                  key={option}
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

        <p className="text-center text-xs text-slate-300 mt-4">
          ข้อมูลส่วนตัวจะถูกใช้เพื่อการวิเคราะห์เท่านั้น ไม่มีการจัดเก็บ
        </p>
      </div>
    </main>
  )
}
