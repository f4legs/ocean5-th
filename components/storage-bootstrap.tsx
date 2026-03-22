'use client'

import { useEffect } from 'react'
import { ensurePersistentStorage } from '@/lib/storage'

export default function StorageBootstrap() {
  useEffect(() => {
    void ensurePersistentStorage()
  }, [])

  return null
}
