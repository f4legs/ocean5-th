export type Factor = 'E' | 'A' | 'C' | 'N' | 'O'

export interface Item {
  id: number
  th: string
  factor: Factor
  reverse: boolean
}

// Official Thai translation by Panida Yomaboot & Dr. Andrew J. Cooper
// Source: https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm
// IPIP materials are in the public domain.
// Items 16 & 48 (political candidate references) replaced with neutral IPIP equivalents.
export const items: Item[] = [
  { id: 1,  th: 'ฉันรู้สึกหม่นหมองอยู่บ่อยๆ',                                                             factor: 'N', reverse: false },
  { id: 2,  th: 'ฉันรู้สึกสบายใจแม้ว่าจะอยู่ท่ามกลางผู้คน',                                               factor: 'E', reverse: false },
  { id: 3,  th: 'ฉันเชื่อในความสำคัญของศิลปะ',                                                              factor: 'O', reverse: false },
  { id: 4,  th: 'ฉันเป็นมิตรและมักพูดจาดีๆ กับผู้อื่น',                                                    factor: 'A', reverse: false },
  { id: 5,  th: 'ฉันเตรียมพร้อมอยู่เสมอ',                                                                   factor: 'C', reverse: false },
  { id: 6,  th: 'ฉันไม่ค่อยรู้สึกหงุดหงิด',                                                                 factor: 'N', reverse: true  },
  { id: 7,  th: 'ฉันพูดน้อย',                                                                                factor: 'E', reverse: true  },
  { id: 8,  th: 'ฉันไม่สนใจแนวคิดหรือเรื่องที่เป็นนามธรรม',                                                factor: 'O', reverse: true  },
  { id: 9,  th: 'ฉันปากร้าย',                                                                               factor: 'A', reverse: true  },
  { id: 10, th: 'ฉันปล่อยเวลาให้ผ่านไปโดยเปล่าประโยชน์',                                                   factor: 'C', reverse: true  },
  { id: 11, th: 'ฉันเชื่อว่าผู้อื่นมีเจตนาและความตั้งใจดี',                                               factor: 'A', reverse: false },
  { id: 12, th: 'ฉันทำเพื่อนใหม่ได้ง่าย',                                                                   factor: 'E', reverse: false },
  { id: 13, th: 'ฉันมีจินตนาการที่ชัดเจน',                                                                  factor: 'O', reverse: false },
  { id: 14, th: 'ฉันใส่ใจกับรายละเอียด',                                                                    factor: 'C', reverse: false },
  { id: 15, th: 'ฉันใช้คำพูดทำร้ายผู้อื่นหรือจงใจทำให้ผู้อื่นรู้สึกไม่ดี',                               factor: 'A', reverse: true  },
  { id: 16, th: 'ฉันชอบใช้เวลาคิดทบทวนเรื่องราวต่างๆ อย่างลึกซึ้ง',                                       factor: 'O', reverse: false },
  { id: 17, th: 'ฉันไม่ชอบตัวเอง',                                                                          factor: 'N', reverse: false },
  { id: 18, th: 'ฉันไม่ค่อยพูด',                                                                            factor: 'E', reverse: true  },
  { id: 19, th: 'เวลาคุยกับใครฉันมักขยายหัวข้อการสนทนาให้กว้างและลึกมากขึ้น',                              factor: 'E', reverse: false },
  { id: 20, th: 'ฉันมีทักษะในการรับมือกับสถานการณ์ทางสังคม',                                               factor: 'E', reverse: false },
  { id: 21, th: 'ฉันหลีกเลี่ยงที่จะทำงานตามความรับผิดชอบของตน',                                           factor: 'C', reverse: true  },
  { id: 22, th: 'ฉันมักรู้สึกหดหู่',                                                                        factor: 'N', reverse: false },
  { id: 23, th: 'ฉันเคารพผู้อื่น',                                                                          factor: 'A', reverse: false },
  { id: 24, th: 'ฉันทำให้ผู้อื่นรู้สึกผ่อนคลายและสบายใจ',                                                 factor: 'A', reverse: false },
  { id: 25, th: 'ฉันเป็นคนมีชีวิตชีวาและมักเป็นสีสันของงานสังสรรค์',                                      factor: 'E', reverse: false },
  { id: 26, th: 'ฉันยอมรับผู้อื่นในแบบที่เขาเป็น',                                                         factor: 'A', reverse: false },
  { id: 27, th: 'ฉันสนุกกับการฟังหรือเรียนรู้แนวคิดใหม่ๆ',                                                 factor: 'O', reverse: false },
  { id: 28, th: 'อารมณ์ของฉันเปลี่ยนแปลงบ่อย',                                                             factor: 'N', reverse: false },
  { id: 29, th: 'ฉันมักทำสิ่งต่างๆ ไม่สำเร็จจนถึงที่สุด',                                                  factor: 'C', reverse: true  },
  { id: 30, th: 'ฉันจัดการงานหรือภารกิจต่างๆ ได้อย่างรวดเร็ว',                                             factor: 'C', reverse: false },
  { id: 31, th: 'ฉันพอใจในตัวเองเป็นอย่างมาก',                                                             factor: 'N', reverse: true  },
  { id: 32, th: 'ฉันทำตามแผนการที่วางไว้',                                                                  factor: 'C', reverse: false },
  { id: 33, th: 'ฉันรู้ว่าจะทำให้ผู้อื่นประทับใจได้อย่างไร',                                              factor: 'E', reverse: false },
  { id: 34, th: 'ฉันไม่ชอบศิลปะ',                                                                           factor: 'O', reverse: true  },
  { id: 35, th: 'ฉันมักสงสัยในแรงจูงใจที่ซ่อนอยู่ของผู้อื่น',                                             factor: 'A', reverse: true  },
  { id: 36, th: 'ฉันตื่นตระหนกตกใจได้ง่าย',                                                                factor: 'N', reverse: false },
  { id: 37, th: 'ฉันทำงานเพียงแค่ให้มันผ่านๆ ไป',                                                          factor: 'C', reverse: true  },
  { id: 38, th: 'ฉันไม่ชอบเป็นที่สนใจของผู้อื่น',                                                         factor: 'E', reverse: true  },
  { id: 39, th: 'ฉันวางแผนและทำตามแผนอย่างเคร่งครัด',                                                      factor: 'C', reverse: false },
  { id: 40, th: 'ฉันไม่ค่อยรู้สึกหดหู่',                                                                   factor: 'N', reverse: true  },
  { id: 41, th: 'ฉันหลีกเลี่ยงการพูดคุยเรื่องเชิงปรัชญา',                                                 factor: 'O', reverse: true  },
  { id: 42, th: 'ฉันรู้สึกสบายใจกับตัวเอง',                                                                 factor: 'N', reverse: true  },
  { id: 43, th: 'ฉันไม่รู้สึกสนุกกับการไปพิพิธภัณฑ์ศิลปะ',                                               factor: 'O', reverse: true  },
  { id: 44, th: 'ฉันพยายามไม่ทำตัวให้เป็นจุดเด่นหรือที่สนใจ',                                             factor: 'E', reverse: true  },
  { id: 45, th: 'ฉันแก้แค้นคนอื่น',                                                                         factor: 'A', reverse: true  },
  { id: 46, th: 'ฉันไม่ค่อยถูกรบกวนง่ายๆ โดยสิ่งต่างๆ',                                                   factor: 'N', reverse: true  },
  { id: 47, th: 'ฉันประชดประชันหรือเหน็บแนมผู้อื่น',                                                       factor: 'A', reverse: true  },
  { id: 48, th: 'ฉันชอบทำตามขนบธรรมเนียมและสิ่งที่คุ้นเคย',                                               factor: 'O', reverse: true  },
  { id: 49, th: 'ฉันรู้สึกว่าประสบการณ์ในชีวิตของฉันค่อนข้างน่าเบื่อ',                                    factor: 'O', reverse: true  },
  { id: 50, th: 'ฉันรู้สึกว่ามันยากที่จะเริ่มต้นทำงานอย่างตั้งใจ',                                        factor: 'C', reverse: true  },
]

export const ITEMS_PER_PAGE = 10
export const TOTAL_PAGES = Math.ceil(items.length / ITEMS_PER_PAGE)

export function getPageItems(page: number): Item[] {
  const start = (page - 1) * ITEMS_PER_PAGE
  return items.slice(start, start + ITEMS_PER_PAGE)
}
