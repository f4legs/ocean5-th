export type Factor = 'E' | 'A' | 'C' | 'N' | 'O'

export interface Item {
  id: number
  th: string
  en: string    // original English from IPIP (for cross-referencing)
  factor: Factor
  reverse: boolean
}

// Official Thai translation by Panida Yomaboot & Dr. Andrew J. Cooper
// Source: https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm
// IPIP materials are in the public domain.
//
// REPLACED ITEMS (deviations from the validated Thai translation):
//
// Item 16: REPLACED
//   Original EN:  "Tend to vote for liberal political candidates" (O, not reversed)
//   Original TH:  "ฉันมีแนวโน้มที่จะลงคะแนนให้กับนักการเมืองที่มีความเป็นเสรีนิยม"
//   Replacement:  "ฉันชอบใช้เวลาคิดทบทวนเรื่องราวต่างๆ อย่างลึกซึ้ง"
//   EN equivalent: "Spend time reflecting deeply on things"
//   Reason: Political items are not culturally appropriate for the Thai context.
//   Note: Replacement item may have minor cross-loading with Conscientiousness.
//
// Item 48: REPLACED
//   Original EN:  "Tend to vote for conservative political candidates" (O, reversed)
//   Original TH:  "ฉันมีแนวโน้มที่จะลงคะแนนให้นักการเมืองที่มีความเป็นอนุรักษ์นิยม"
//   Replacement:  "ฉันชอบทำตามขนบธรรมเนียมและสิ่งที่คุ้นเคย"
//   EN equivalent: "Prefer following traditions and familiar things"
//   Reason: Same as item 16; politically neutral O- content is a valid substitute.

export const items: Item[] = [
  { id: 1,  en: 'Often feel blue',                              th: 'ฉันรู้สึกหม่นหมองอยู่บ่อยๆ',                                             factor: 'N', reverse: false },
  { id: 2,  en: 'Feel comfortable around people',               th: 'ฉันรู้สึกสบายใจแม้ว่าจะอยู่ท่ามกลางผู้คน',                               factor: 'E', reverse: false },
  { id: 3,  en: 'Believe in the importance of art',             th: 'ฉันเชื่อในความสำคัญของศิลปะ',                                             factor: 'O', reverse: false },
  { id: 4,  en: 'Have a good word for everyone',                th: 'ฉันเป็นมิตรและมักพูดจาดีๆ กับผู้อื่น',                                    factor: 'A', reverse: false },
  { id: 5,  en: 'Am always prepared',                           th: 'ฉันเตรียมพร้อมอยู่เสมอ',                                                   factor: 'C', reverse: false },
  { id: 6,  en: 'Rarely get irritated',                         th: 'ฉันไม่ค่อยรู้สึกหงุดหงิด',                                               factor: 'N', reverse: true  },
  { id: 7,  en: 'Have little to say',                           th: 'ฉันพูดน้อย',                                                                factor: 'E', reverse: true  },
  { id: 8,  en: 'Am not interested in abstract ideas',          th: 'ฉันไม่สนใจแนวคิดหรือเรื่องที่เป็นนามธรรม',                                factor: 'O', reverse: true  },
  { id: 9,  en: 'Have a sharp tongue',                          th: 'ฉันปากร้าย',                                                               factor: 'A', reverse: true  },
  { id: 10, en: 'Waste my time',                                th: 'ฉันปล่อยเวลาให้ผ่านไปโดยเปล่าประโยชน์',                                   factor: 'C', reverse: true  },
  { id: 11, en: 'Believe that others have good intentions',     th: 'ฉันเชื่อว่าผู้อื่นมีเจตนาและความตั้งใจดี',                               factor: 'A', reverse: false },
  { id: 12, en: 'Make friends easily',                          th: 'ฉันหาเพื่อนใหม่ได้ง่าย',                                                   factor: 'E', reverse: false },
  { id: 13, en: 'Have a vivid imagination',                     th: 'ฉันมีจินตนาการที่ชัดเจน',                                                  factor: 'O', reverse: false },
  { id: 14, en: 'Pay attention to details',                     th: 'ฉันใส่ใจกับรายละเอียด',                                                    factor: 'C', reverse: false },
  { id: 15, en: 'Cut others to pieces',                         th: 'ฉันใช้คำพูดทำร้ายผู้อื่นหรือจงใจทำให้ผู้อื่นรู้สึกไม่ดี',               factor: 'A', reverse: true  },
  { id: 16, en: 'Spend time reflecting deeply on things',       th: 'ฉันชอบใช้เวลาคิดทบทวนเรื่องราวต่างๆ อย่างลึกซึ้ง',                       factor: 'O', reverse: false },
  { id: 17, en: 'Dislike myself',                               th: 'ฉันไม่ชอบตัวเอง',                                                          factor: 'N', reverse: false },
  { id: 18, en: "Don't talk a lot",                             th: 'ฉันไม่ค่อยพูด',                                                            factor: 'E', reverse: true  },
  { id: 19, en: 'Carry the conversation to a higher level',     th: 'เวลาคุยกับใครฉันมักขยายหัวข้อการสนทนาให้กว้างและลึกมากขึ้น',              factor: 'E', reverse: false },
  { id: 20, en: 'Am skilled in handling social situations',     th: 'ฉันมีทักษะในการรับมือกับสถานการณ์ทางสังคม',                               factor: 'E', reverse: false },
  { id: 21, en: 'Shirk my duties',                              th: 'ฉันหลีกเลี่ยงที่จะทำงานตามความรับผิดชอบของตน',                           factor: 'C', reverse: true  },
  { id: 22, en: 'Am often down in the dumps',                   th: 'ฉันมักรู้สึกหดหู่',                                                        factor: 'N', reverse: false },
  { id: 23, en: 'Respect others',                               th: 'ฉันเคารพผู้อื่น',                                                          factor: 'A', reverse: false },
  { id: 24, en: 'Make people feel at ease',                     th: 'ฉันทำให้ผู้อื่นรู้สึกผ่อนคลายและสบายใจ',                                 factor: 'A', reverse: false },
  { id: 25, en: 'Am the life of the party',                     th: 'ฉันเป็นคนมีชีวิตชีวาและมักเป็นสีสันของงานสังสรรค์',                      factor: 'E', reverse: false },
  { id: 26, en: 'Accept people as they are',                    th: 'ฉันยอมรับผู้อื่นในแบบที่เขาเป็น',                                         factor: 'A', reverse: false },
  { id: 27, en: 'Enjoy hearing new ideas',                      th: 'ฉันสนุกกับการฟังหรือเรียนรู้แนวคิดใหม่ๆ',                                 factor: 'O', reverse: false },
  { id: 28, en: 'Have frequent mood swings',                    th: 'อารมณ์ของฉันเปลี่ยนแปลงบ่อย',                                             factor: 'N', reverse: false },
  { id: 29, en: "Don't see things through",                     th: 'ฉันมักทำสิ่งต่างๆ ไม่สำเร็จ หรือไม่ทำจนจบ',                                  factor: 'C', reverse: true  },
  { id: 30, en: 'Get chores done right away',                   th: 'ฉันจัดการงานหรือภารกิจต่างๆ ได้อย่างรวดเร็ว',                             factor: 'C', reverse: false },
  { id: 31, en: 'Am very pleased with myself',                  th: 'ฉันพอใจในตัวเองเป็นอย่างมาก',                                             factor: 'N', reverse: true  },
  { id: 32, en: 'Carry out my plans',                           th: 'ฉันทำตามแผนการที่วางไว้',                                                  factor: 'C', reverse: false },
  { id: 33, en: 'Know how to captivate people',                 th: 'ฉันรู้ว่าจะทำให้ผู้อื่นประทับใจได้อย่างไร',                              factor: 'E', reverse: false },
  { id: 34, en: 'Do not like art',                              th: 'ฉันไม่ชอบศิลปะ',                                                           factor: 'O', reverse: true  },
  { id: 35, en: 'Suspect hidden motives in others',             th: 'ฉันมักสงสัยในแรงจูงใจที่ซ่อนอยู่ของผู้อื่น',                             factor: 'A', reverse: true  },
  { id: 36, en: 'Panic easily',                                 th: 'ฉันตื่นตระหนกตกใจได้ง่าย',                                                factor: 'N', reverse: false },
  { id: 37, en: 'Do just enough work to get by',                th: 'ฉันทำงานเพียงแค่ให้มันผ่านๆ ไป',                                          factor: 'C', reverse: true  },
  { id: 38, en: "Don't like to draw attention to myself",       th: 'ฉันไม่ชอบเป็นที่สนใจของผู้อื่น',                                         factor: 'E', reverse: true  },
  { id: 39, en: 'Make plans and stick to them',                 th: 'ฉันวางแผนและทำตามแผนอย่างเคร่งครัด',                                      factor: 'C', reverse: false },
  { id: 40, en: 'Seldom feel blue',                             th: 'ฉันไม่ค่อยรู้สึกหดหู่',                                                   factor: 'N', reverse: true  },
  { id: 41, en: 'Avoid philosophical discussions',              th: 'ฉันหลีกเลี่ยงการพูดคุยเรื่องเชิงปรัชญา',                                 factor: 'O', reverse: true  },
  { id: 42, en: 'Feel comfortable with myself',                 th: 'ฉันรู้สึกสบายใจกับตัวเอง',                                                 factor: 'N', reverse: true  },
  { id: 43, en: 'Do not enjoy going to art museums',            th: 'ฉันไม่รู้สึกสนุกกับการไปพิพิธภัณฑ์ศิลปะ',                               factor: 'O', reverse: true  },
  { id: 44, en: 'Keep in the background',                       th: 'ฉันพยายามไม่ทำตัวให้เป็นจุดเด่นหรือที่สนใจ',                             factor: 'E', reverse: true  },
  { id: 45, en: 'Get back at others',                           th: 'ฉันแก้แค้นคนอื่น',                                                         factor: 'A', reverse: true  },
  { id: 46, en: 'Am not easily bothered by things',             th: 'ฉันไม่ค่อยถูกรบกวนง่ายๆ โดยสิ่งต่างๆ',                                   factor: 'N', reverse: true  },
  { id: 47, en: 'Insult people',                                th: 'ฉันประชดประชันหรือเหน็บแนมผู้อื่น',                                       factor: 'A', reverse: true  },
  { id: 48, en: 'Prefer following traditions and familiar things', th: 'ฉันชอบทำตามขนบธรรมเนียมและสิ่งที่คุ้นเคย',                             factor: 'O', reverse: true  },
  { id: 49, en: 'Would describe experiences as somewhat dull',  th: 'ฉันรู้สึกว่าประสบการณ์ในชีวิตของฉันค่อนข้างน่าเบื่อ',                    factor: 'O', reverse: true  },
  { id: 50, en: 'Find it difficult to get down to work',        th: 'ฉันรู้สึกว่ามันยากที่จะเริ่มต้นทำงานอย่างตั้งใจ',                        factor: 'C', reverse: true  },
]

export const ITEMS_PER_PAGE = 10
export const TOTAL_PAGES = Math.ceil(items.length / ITEMS_PER_PAGE)

export function getPageItems(page: number): Item[] {
  const start = (page - 1) * ITEMS_PER_PAGE
  return items.slice(start, start + ITEMS_PER_PAGE)
}

/**
 * Returns items in a shuffled order that preserves mixed-dimension property:
 * no two consecutive items belong to the same factor.
 * Useful for research settings to reduce order effects.
 */
export function shuffleItems(): Item[] {
  const byFactor: Record<Factor, Item[]> = { E: [], A: [], C: [], N: [], O: [] }
  for (const item of items) byFactor[item.factor].push({ ...item })
  for (const factor of Object.keys(byFactor) as Factor[]) {
    byFactor[factor].sort(() => Math.random() - 0.5)
  }

  const result: Item[] = []
  const pools = Object.values(byFactor).filter(p => p.length > 0)
  let lastFactor: Factor | null = null

  while (result.length < items.length) {
    const available = pools.filter(p => p.length > 0 && p[0].factor !== lastFactor)
    const pool = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pools.filter(p => p.length > 0)[0]
    const item = pool.shift()!
    result.push(item)
    lastFactor = item.factor
  }

  return result
}
