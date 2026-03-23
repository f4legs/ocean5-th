"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setItem } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";

interface ImportedJson {
  version?: string;
  testId?: string;
  sessionId?: string;
  startedAt?: string;
  completedAt?: string;
  profile?: Record<string, string | null>;
  answers?: Record<string, number>;
  metadata?: {
    pageDurations?: Record<string, number>;
    responseTimes?: Record<string, number>;
  };
}

export default function ImportJsonButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result;
        if (typeof raw !== "string") throw new Error();

        const data = JSON.parse(raw) as ImportedJson;

        if (!data.answers || typeof data.answers !== "object") {
          setError("ไฟล์ไม่ถูกต้อง: ไม่พบข้อมูลคำตอบ");
          return;
        }

        // Write answers (key: item number, value: score 1-5)
        setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(data.answers));

        // Write profile
        if (data.profile) {
          setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
        }

        // Write session
        const session = {
          sessionId: data.sessionId ?? crypto.randomUUID(),
          startedAt: data.startedAt ?? new Date().toISOString(),
          ...(data.completedAt ? { quizCompletedAt: data.completedAt } : {}),
        };
        setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));

        // Write timing metadata if available
        if (data.metadata?.pageDurations) {
          setItem(
            STORAGE_KEYS.PAGE_DURATIONS,
            JSON.stringify(data.metadata.pageDurations),
          );
        }
        if (data.metadata?.responseTimes) {
          setItem(
            STORAGE_KEYS.RESPONSE_TIMES,
            JSON.stringify(data.metadata.responseTimes),
          );
        }

        router.push("/results");
      } catch {
        setError("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์");
      }
    };
    reader.readAsText(file);

    // Reset so the same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={handleFile}
        aria-label="นำเข้าไฟล์ผลลัพธ์ JSON"
      />
      <button
        onClick={handleClick}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-2.5 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-[var(--text-faint)]"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span className="body-faint text-sm">นำเข้าผลลัพธ์เดิม ( JSON )</span>
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
