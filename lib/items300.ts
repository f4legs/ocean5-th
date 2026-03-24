import type { FacetCode, Factor } from './scoring120'

export interface Item300 {
  id: number       // 1-300, interleaved: id = (position-1)*30 + facetIndex
  th: string
  en: string
  facet: FacetCode
  facetName: string
  factor: Factor
  reverse: boolean
  inNeo120: boolean  // true if this item also appears in items120
}

export const items300: Item300[] = [
  // ── N1: Anxiety (facetIndex=1) ───────────────────────────────────────────
  { id: 1,   th: 'มักกังวลเรื่องต่างๆ',                                en: 'Worry about things.',                                    facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: false, inNeo120: true  },
  { id: 31,  th: 'มักจะคิดเผื่อในแง่ร้ายที่สุดไว้เสมอ',               en: 'Fear for the worst.',                                    facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: false, inNeo120: true  },
  { id: 61,  th: 'มีความหวาดกลัวต่อหลายสิ่งหลายอย่าง',               en: 'Am afraid of many things.',                              facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: false, inNeo120: true  },
  { id: 91,  th: 'เครียดง่าย',                                         en: 'Get stressed out easily.',                               facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: false, inNeo120: false },
  { id: 121, th: 'มักจมอยู่กับปัญหาของตัวเอง',                        en: 'Get caught up in my problems.',                          facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: false, inNeo120: false },
  { id: 151, th: 'ไม่ค่อยเก็บเรื่องต่างๆ มาว้าวุ่นใจ',               en: 'Am not easily bothered by things.',                      facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: true,  inNeo120: true  },
  { id: 181, th: 'รู้สึกผ่อนคลายเป็นส่วนใหญ่',                       en: 'Am relaxed most of the time.',                           facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: true,  inNeo120: false },
  { id: 211, th: 'ไม่ค่อยถูกรบกวนจากเหตุการณ์รอบข้าง',              en: 'Am not easily disturbed by events.',                     facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: true,  inNeo120: false },
  { id: 241, th: 'ไม่กังวลกับสิ่งที่เกิดขึ้นไปแล้ว',                 en: "Don't worry about things that have already happened.",   facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: true,  inNeo120: false },
  { id: 271, th: 'ปรับตัวเข้ากับสถานการณ์ใหม่ๆ ได้ง่าย',             en: 'Adapt easily to new situations.',                        facet: 'N1', facetName: 'Anxiety',             factor: 'N', reverse: true,  inNeo120: false },

  // ── N2: Anger (facetIndex=2) ──────────────────────────────────────────────
  { id: 2,   th: 'โกรธง่าย',                                           en: 'Get angry easily.',                                      facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: false, inNeo120: true  },
  { id: 32,  th: 'หงุดหงิดง่าย',                                       en: 'Get irritated easily.',                                  facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: false, inNeo120: false },
  { id: 62,  th: 'อารมณ์เสียได้ง่าย',                                  en: 'Get upset easily.',                                      facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: false, inNeo120: true  },
  { id: 92,  th: 'มักอยู่ในอารมณ์ไม่ดี',                               en: 'Am often in a bad mood.',                                facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: false, inNeo120: false },
  { id: 122, th: 'อารมณ์ขาดได้ง่าย',                                   en: 'Lose my temper.',                                        facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: false, inNeo120: false },
  { id: 152, th: 'ไม่ค่อยหงุดหงิดอะไรง่ายๆ',                          en: 'Rarely get irritated.',                                  facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: true,  inNeo120: true  },
  { id: 182, th: 'แทบไม่ค่อยโกรธ',                                     en: 'Seldom get mad.',                                        facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: true,  inNeo120: false },
  { id: 212, th: 'ไม่รำคาญง่าย',                                       en: 'Am not easily annoyed.',                                 facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: true,  inNeo120: false },
  { id: 242, th: 'สามารถรักษาความสงบของตัวเองได้',                    en: 'Keep my cool.',                                          facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: true,  inNeo120: false },
  { id: 272, th: 'ไม่ค่อยบ่นว่าอะไร',                                  en: 'Rarely complain.',                                       facet: 'N2', facetName: 'Anger',               factor: 'N', reverse: true,  inNeo120: false },

  // ── N3: Depression (facetIndex=3) ─────────────────────────────────────────
  { id: 3,   th: 'มักจะรู้สึกเศร้าซึม',                               en: 'Often feel blue.',                                       facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: true  },
  { id: 33,  th: 'ไม่ชอบตัวเอง',                                       en: 'Dislike myself.',                                        facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: true  },
  { id: 63,  th: 'มักหดหู่ใจ',                                         en: 'Am often down in the dumps.',                            facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: false },
  { id: 93,  th: 'มองตัวเองในแง่ลบ',                                   en: 'Have a low opinion of myself.',                          facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: false },
  { id: 123, th: 'อารมณ์แปรปรวนบ่อย',                                  en: 'Have frequent mood swings.',                             facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: true  },
  { id: 153, th: 'รู้สึกสิ้นหวัง',                                     en: 'Feel desperate.',                                        facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: false },
  { id: 183, th: 'รู้สึกว่าชีวิตไร้ทิศทาง',                           en: 'Feel that my life lacks direction.',                     facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: false, inNeo120: false },
  { id: 213, th: 'ไม่ค่อยรู้สึกเศร้า',                                en: 'Seldom feel blue.',                                      facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: true,  inNeo120: false },
  { id: 243, th: 'รู้สึกสบายใจกับตัวเอง',                             en: 'Feel comfortable with myself.',                          facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: true,  inNeo120: true  },
  { id: 273, th: 'พึงพอใจในตัวเองมาก',                                en: 'Am very pleased with myself.',                           facet: 'N3', facetName: 'Depression',          factor: 'N', reverse: true,  inNeo120: false },

  // ── N4: Self-Consciousness (facetIndex=4) ─────────────────────────────────
  { id: 4,   th: 'รู้สึกเกร็งหรือหวั่นเกรงได้ง่าย',                  en: 'Am easily intimidated.',                                 facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: false, inNeo120: false },
  { id: 34,  th: 'กลัวว่าจะทำสิ่งที่ผิดพลาด',                        en: 'Am afraid that I will do the wrong thing.',              facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: false, inNeo120: true  },
  { id: 64,  th: 'รู้สึกว่าการเข้าหาผู้อื่นเป็นเรื่องยาก',           en: 'Find it difficult to approach others.',                  facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: false, inNeo120: true  },
  { id: 94,  th: 'กลัวที่จะเป็นจุดสนใจ',                             en: 'Am afraid to draw attention to myself.',                 facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: false, inNeo120: false },
  { id: 124, th: 'รู้สึกสบายใจได้เฉพาะกับเพื่อนสนิท',               en: 'Only feel comfortable with friends.',                    facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: false, inNeo120: false },
  { id: 154, th: 'พูดติดขัดบ่อยๆ',                                   en: 'Stumble over my words.',                                 facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: false, inNeo120: false },
  { id: 184, th: 'ไม่รู้สึกอับอายอะไรง่ายๆ',                         en: 'Am not embarrassed easily.',                             facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: true,  inNeo120: true  },
  { id: 214, th: 'รู้สึกสบายใจในสถานการณ์ที่ไม่คุ้นเคย',            en: 'Am comfortable in unfamiliar situations.',               facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: true,  inNeo120: false },
  { id: 244, th: 'ไม่กังวลกับสถานการณ์ทางสังคมที่ยุ่งยาก',          en: 'Am not bothered by difficult social situations.',        facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: true,  inNeo120: false },
  { id: 274, th: 'สามารถยืนหยัดเพื่อตัวเองได้',                      en: 'Am able to stand up for myself.',                        facet: 'N4', facetName: 'Self-Consciousness',  factor: 'N', reverse: true,  inNeo120: false },

  // ── N5: Immoderation (facetIndex=5) ───────────────────────────────────────
  { id: 5,   th: 'มักกินมากเกินไป',                                    en: 'Often eat too much.',                                    facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: false, inNeo120: false },
  { id: 35,  th: 'บางครั้งไม่รู้ว่าทำไมถึงทำสิ่งที่ทำ',              en: "Don't know why I do some of the things I do.",           facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: false, inNeo120: false },
  { id: 65,  th: 'ทำสิ่งที่ทำให้เสียใจภายหลัง',                      en: 'Do things I later regret.',                              facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: false, inNeo120: false },
  { id: 95,  th: 'ชอบทำอะไรแบบสุดโต่ง',                              en: 'Go on binges.',                                          facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: false, inNeo120: false },
  { id: 125, th: 'รักการกิน',                                          en: 'Love to eat.',                                           facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: false, inNeo120: true  },
  { id: 155, th: 'ไม่ค่อยปล่อยตัวเกินพอดี',                          en: 'Rarely overindulge.',                                    facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: true,  inNeo120: false },
  { id: 185, th: 'สามารถต้านทานสิ่งเย้ายวนต่างๆ ได้ง่าย',           en: 'Easily resist temptations.',                             facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: true,  inNeo120: true  },
  { id: 215, th: 'สามารถควบคุมความอยากของตนเองได้',                  en: 'Am able to control my cravings.',                        facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: true,  inNeo120: false },
  { id: 245, th: 'ไม่เคยใช้จ่ายเกินกว่าที่มี',                       en: 'Never spend more than I can afford.',                    facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: true,  inNeo120: false },
  { id: 275, th: 'ไม่เคยใช้เงินสุรุ่ยสุร่าย',                        en: 'Never splurge.',                                         facet: 'N5', facetName: 'Immoderation',        factor: 'N', reverse: true,  inNeo120: false },

  // ── N6: Vulnerability (facetIndex=6) ──────────────────────────────────────
  { id: 6,   th: 'ตื่นตระหนกง่าย',                                    en: 'Panic easily.',                                          facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: false, inNeo120: true  },
  { id: 36,  th: 'ยอมแพ้ต่อสถานการณ์ต่างๆ อย่างรวดเร็ว',             en: 'Become overwhelmed by events.',                          facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: false, inNeo120: true  },
  { id: 66,  th: 'รู้สึกว่าตนเองไม่สามารถจัดการกับเรื่องต่างๆ ได้',  en: "Feel that I'm unable to deal with things.",              facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: false, inNeo120: true  },
  { id: 96,  th: 'ตัดสินใจอะไรแทบไม่ได้',                            en: "Can't make up my mind.",                                 facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: false, inNeo120: false },
  { id: 126, th: 'ถูกอารมณ์ท่วมท้นได้ง่าย',                          en: 'Get overwhelmed by emotions.',                           facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: false, inNeo120: false },
  { id: 156, th: 'ยังคงสงบสติอารมณ์ได้ภายใต้ความกดดัน',             en: 'Remain calm under pressure.',                            facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: true,  inNeo120: true  },
  { id: 186, th: 'รับมือกับปัญหาซับซ้อนได้',                         en: 'Can handle complex problems.',                           facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: true,  inNeo120: false },
  { id: 216, th: 'รู้วิธีรับมือกับเรื่องต่างๆ',                      en: 'Know how to cope.',                                      facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: true,  inNeo120: false },
  { id: 246, th: 'ฟื้นตัวจากความล้มเหลวได้รวดเร็ว',                 en: 'Readily overcome setbacks.',                             facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: true,  inNeo120: false },
  { id: 276, th: 'สงบได้แม้ในสถานการณ์ตึงเครียด',                   en: 'Am calm even in tense situations.',                      facet: 'N6', facetName: 'Vulnerability',       factor: 'N', reverse: true,  inNeo120: false },

  // ── E1: Friendliness (facetIndex=7) ───────────────────────────────────────
  { id: 7,   th: 'ผูกมิตรกับคนอื่นได้ง่าย',                          en: 'Make friends easily.',                                   facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: false, inNeo120: true  },
  { id: 37,  th: 'ทำความคุ้นเคยกับคนอื่นได้อย่างรวดเร็ว',           en: 'Warm up quickly to others.',                             facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: false, inNeo120: true  },
  { id: 67,  th: 'รู้สึกสบายใจเมื่ออยู่ท่ามกลางผู้คน',              en: 'Feel comfortable around people.',                        facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: false, inNeo120: true  },
  { id: 97,  th: 'วางตัวกับผู้อื่นได้อย่างเป็นธรรมชาติ',             en: 'Act comfortably with others.',                           facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: false, inNeo120: false },
  { id: 127, th: 'ชอบทำให้ผู้อื่นอารมณ์ดีขึ้น',                     en: 'Cheer people up.',                                       facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: false, inNeo120: false },
  { id: 157, th: 'เป็นคนที่เข้าถึงยาก',                              en: 'Am hard to get to know.',                                facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: true,  inNeo120: false },
  { id: 187, th: 'มักรู้สึกไม่สบายใจเมื่ออยู่กับผู้อื่น',           en: 'Often feel uncomfortable around others.',                facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: true,  inNeo120: false },
  { id: 217, th: 'หลีกเลี่ยงการติดต่อกับผู้อื่น',                   en: 'Avoid contacts with others.',                            facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: true,  inNeo120: false },
  { id: 247, th: 'ไม่ค่อยสนใจผู้อื่น',                               en: 'Am not really interested in others.',                    facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: true,  inNeo120: false },
  { id: 277, th: 'รักษาระยะห่างกับผู้อื่นเสมอ',                      en: 'Keep others at a distance.',                             facet: 'E1', facetName: 'Friendliness',        factor: 'E', reverse: true,  inNeo120: true  },

  // ── E2: Gregariousness (facetIndex=8) ─────────────────────────────────────
  { id: 8,   th: 'ชอบงานเลี้ยงใหญ่ๆ',                                en: 'Love large parties.',                                    facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: false, inNeo120: true  },
  { id: 38,  th: 'ได้พูดคุยกับผู้คนมากมายเวลาไปงานสังสรรค์',        en: 'Talk to a lot of different people at parties.',          facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: false, inNeo120: true  },
  { id: 68,  th: 'ชอบการเป็นส่วนหนึ่งของกลุ่ม',                     en: 'Enjoy being part of a group.',                           facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: false, inNeo120: false },
  { id: 98,  th: 'ชอบดึงคนอื่นมาร่วมในสิ่งที่ทำ',                   en: 'Involve others in what I am doing.',                     facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: false, inNeo120: false },
  { id: 128, th: 'ชอบงานเซอร์ไพรส์',                                  en: 'Love surprise parties.',                                 facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: false, inNeo120: false },
  { id: 158, th: 'ชอบอยู่คนเดียวมากกว่า',                            en: 'Prefer to be alone.',                                    facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: true,  inNeo120: true  },
  { id: 188, th: 'ต้องการอยู่ตามลำพัง',                              en: 'Want to be left alone.',                                 facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: true,  inNeo120: false },
  { id: 218, th: 'ไม่ชอบงานที่มีคนพลุกพล่าน',                       en: "Don't like crowded events.",                             facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: true,  inNeo120: false },
  { id: 248, th: 'หลีกเลี่ยงสถานที่ที่มีคนพลุกพล่าน',               en: 'Avoid crowds.',                                          facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: true,  inNeo120: true  },
  { id: 278, th: 'แสวงหาความสงบเงียบ',                                en: 'Seek quiet.',                                            facet: 'E2', facetName: 'Gregariousness',      factor: 'E', reverse: true,  inNeo120: false },

  // ── E3: Assertiveness (facetIndex=9) ──────────────────────────────────────
  { id: 9,   th: 'ชอบเป็นผู้นำและผู้จัดการ',                         en: 'Take charge.',                                           facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: false, inNeo120: true  },
  { id: 39,  th: 'พยายามเป็นผู้นำผู้อื่น',                           en: 'Try to lead others.',                                    facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: false, inNeo120: false },
  { id: 69,  th: 'ชักจูงผู้อื่นได้',                                  en: 'Can talk others into doing things.',                     facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: false, inNeo120: false },
  { id: 99,  th: 'แสวงหาอิทธิพลเหนือผู้อื่น',                        en: 'Seek to influence others.',                              facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: false, inNeo120: false },
  { id: 129, th: 'ชอบควบคุมสิ่งต่างๆ',                               en: 'Take control of things.',                                facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: false, inNeo120: false },
  { id: 159, th: 'รอให้คนอื่นเป็นคนนำทางเสมอ',                      en: 'Wait for others to lead the way.',                       facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: true,  inNeo120: true  },
  { id: 189, th: 'ชอบอยู่เบื้องหลัง',                                 en: 'Keep in the background.',                                facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: true,  inNeo120: false },
  { id: 219, th: 'ไม่ค่อยมีอะไรจะพูด',                               en: 'Have little to say.',                                    facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: true,  inNeo120: false },
  { id: 249, th: 'ไม่ชอบดึงความสนใจมาที่ตัวเอง',                    en: "Don't like to draw attention to myself.",                facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: true,  inNeo120: false },
  { id: 279, th: 'เก็บความคิดเห็นของตัวเองไว้',                      en: 'Hold back my opinions.',                                 facet: 'E3', facetName: 'Assertiveness',       factor: 'E', reverse: true,  inNeo120: false },

  // ── E4: Activity Level (facetIndex=10) ────────────────────────────────────
  { id: 10,  th: 'ยุ่งอยู่ตลอดเวลา',                                  en: 'Am always busy.',                                        facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: false, inNeo120: true  },
  { id: 40,  th: 'เดินทางหรือทำกิจกรรมอยู่เสมอ',                     en: 'Am always on the go.',                                   facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: false, inNeo120: true  },
  { id: 70,  th: 'มักหาอะไรทำมากมายในเวลาว่าง',                      en: 'Do a lot in my spare time.',                             facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: false, inNeo120: true  },
  { id: 100, th: 'จัดการหลายสิ่งพร้อมกันได้',                         en: 'Can manage many things at the same time.',               facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: false, inNeo120: false },
  { id: 130, th: 'ตอบสนองต่อสิ่งต่างๆ ได้รวดเร็ว',                   en: 'React quickly.',                                         facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: false, inNeo120: false },
  { id: 160, th: 'ชอบทำตัวสบายๆ',                                     en: 'Like to take it easy.',                                  facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: true,  inNeo120: true  },
  { id: 190, th: 'ชอบทำอะไรอย่างช้าๆ',                               en: 'Like to take my time.',                                  facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: true,  inNeo120: false },
  { id: 220, th: 'ชอบวิถีชีวิตที่ผ่อนคลาย',                          en: 'Like a leisurely lifestyle.',                            facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: true,  inNeo120: false },
  { id: 250, th: 'ปล่อยให้สิ่งต่างๆ ดำเนินไปตามจังหวะของมัน',       en: 'Let things proceed at their own pace.',                  facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: true,  inNeo120: false },
  { id: 280, th: 'ตอบสนองต่อสิ่งต่างๆ ได้ช้า',                       en: 'React slowly.',                                          facet: 'E4', facetName: 'Activity Level',      factor: 'E', reverse: true,  inNeo120: false },

  // ── E5: Excitement-Seeking (facetIndex=11) ────────────────────────────────
  { id: 11,  th: 'ชอบความตื่นเต้นเร้าใจ',                            en: 'Love excitement.',                                       facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: true  },
  { id: 41,  th: 'แสวงหาการผจญภัย',                                   en: 'Seek adventure.',                                        facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: true  },
  { id: 71,  th: 'ชอบความสนุกสนานและการเคลื่อนไหว',                  en: 'Love action.',                                           facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: false },
  { id: 101, th: 'สนุกที่ได้เป็นส่วนหนึ่งของฝูงชนที่ส่งเสียงดัง',  en: 'Enjoy being part of a loud crowd.',                      facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: true  },
  { id: 131, th: 'สนุกกับการทำอะไรโดยไม่ระวัง',                      en: 'Enjoy being reckless.',                                  facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: false },
  { id: 161, th: 'ชอบทำตัวบ้าระห่ำ',                                  en: 'Act wild and crazy.',                                    facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: false },
  { id: 191, th: 'พร้อมลองทำอะไรใหม่ๆ สักครั้ง',                    en: 'Am willing to try anything once.',                       facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: false },
  { id: 221, th: 'แสวงหาความเสี่ยงและอันตราย',                        en: 'Seek danger.',                                           facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: false, inNeo120: false },
  { id: 251, th: 'ไม่มีทางไปร่วมกิจกรรมที่เสี่ยงอันตรายสูง',        en: 'Would never go hang gliding or bungee jumping.',         facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: true,  inNeo120: false },
  { id: 281, th: 'ไม่ชอบเพลงเสียงดัง',                               en: 'Dislike loud music.',                                    facet: 'E5', facetName: 'Excitement-Seeking',  factor: 'E', reverse: true,  inNeo120: true  },

  // ── E6: Cheerfulness (facetIndex=12) ──────────────────────────────────────
  { id: 12,  th: 'เป็นคนร่าเริงและเปล่งประกายความสุข',               en: 'Radiate joy.',                                           facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: true  },
  { id: 42,  th: 'สนุกสนานเฮฮาอยู่เสมอ',                             en: 'Have a lot of fun.',                                     facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: true  },
  { id: 72,  th: 'แสดงความสุขออกมาแบบเด็กๆ อย่างเต็มที่',            en: 'Express childlike joy.',                                 facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: true  },
  { id: 102, th: 'ใช้ชีวิตด้วยเสียงหัวเราะ',                         en: 'Laugh my way through life.',                             facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: false },
  { id: 132, th: 'รักชีวิต',                                          en: 'Love life.',                                             facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: false },
  { id: 162, th: 'มองโลกในแง่ดีเสมอ',                                 en: 'Look at the bright side of life.',                       facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: false },
  { id: 192, th: 'หัวเราะออกเสียงดังบ่อยๆ',                          en: 'Laugh aloud.',                                           facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: false },
  { id: 222, th: 'ชอบทำให้เพื่อนๆ ขำขัน',                            en: 'Amuse my friends.',                                      facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false, inNeo120: false },
  { id: 252, th: 'ยากที่อะไรจะทำให้รู้สึกขบขัน',                    en: 'Am not easily amused.',                                  facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: true,  inNeo120: true  },
  { id: 282, th: 'ไม่ค่อยพูดเล่นหรือตลก',                            en: 'Seldom joke around.',                                    facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: true,  inNeo120: false },

  // ── O1: Imagination (facetIndex=13) ───────────────────────────────────────
  { id: 13,  th: 'มีจินตนาการโลดแล่นและมีชีวิตชีวา',                 en: 'Have a vivid imagination.',                              facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false, inNeo120: true  },
  { id: 43,  th: 'สนุกไปกับความคิดเพ้อฝันที่หลุดโลก',               en: 'Enjoy wild flights of fantasy.',                         facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false, inNeo120: true  },
  { id: 73,  th: 'ชอบที่จะฝันกลางวัน',                               en: 'Love to daydream.',                                      facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false, inNeo120: true  },
  { id: 103, th: 'ชอบจมอยู่กับความคิด',                              en: 'Like to get lost in thought.',                           facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false, inNeo120: false },
  { id: 133, th: 'หมกมุ่นอยู่กับจินตนาการของตนเอง',                 en: 'Indulge in my fantasies.',                               facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false, inNeo120: false },
  { id: 163, th: 'ใช้เวลาครุ่นคิดทบทวนสิ่งต่างๆ',                   en: 'Spend time reflecting on things.',                       facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false, inNeo120: false },
  { id: 193, th: 'ไม่ค่อยจะฝันกลางวัน',                              en: 'Seldom daydream.',                                       facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: true,  inNeo120: true  },
  { id: 223, th: 'ไม่ค่อยมีจินตนาการ',                               en: 'Do not have a good imagination.',                        facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: true,  inNeo120: false },
  { id: 253, th: 'ไม่ค่อยหลงอยู่กับความคิด',                         en: 'Seldom get lost in thought.',                            facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: true,  inNeo120: false },
  { id: 283, th: 'ยากที่จะนึกภาพสิ่งต่างๆ ในหัว',                   en: 'Have difficulty imagining things.',                      facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: true,  inNeo120: false },

  // ── O2: Artistic Interests (facetIndex=14) ────────────────────────────────
  { id: 14,  th: 'เชื่อในความสำคัญของศิลปะ',                         en: 'Believe in the importance of art.',                      facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: false, inNeo120: true  },
  { id: 44,  th: 'ชอบดนตรี',                                          en: 'Like music.',                                            facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: false, inNeo120: false },
  { id: 74,  th: 'เห็นความสวยงามในสิ่งที่คนอื่นมักมองข้าม',          en: 'See beauty in things that others might not notice.',     facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: false, inNeo120: true  },
  { id: 104, th: 'รักดอกไม้',                                         en: 'Love flowers.',                                          facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: false, inNeo120: false },
  { id: 134, th: 'ชื่นชมความงามของธรรมชาติ',                          en: 'Enjoy the beauty of nature.',                            facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: false, inNeo120: false },
  { id: 164, th: 'ไม่ชอบศิลปะ',                                       en: 'Do not like art.',                                       facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: true,  inNeo120: true  },
  { id: 194, th: 'ไม่ชอบบทกวี',                                       en: 'Do not like poetry.',                                    facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: true,  inNeo120: false },
  { id: 224, th: 'ไม่ชอบไปพิพิธภัณฑ์ศิลปะ',                          en: 'Do not enjoy going to art museums.',                     facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: true,  inNeo120: false },
  { id: 254, th: 'ไม่ชอบคอนเสิร์ต',                                   en: 'Do not like concerts.',                                  facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: true,  inNeo120: false },
  { id: 284, th: 'ไม่ชอบดูการแสดงเต้นรำ',                            en: 'Do not enjoy watching dance performances.',              facet: 'O2', facetName: 'Artistic Interests',  factor: 'O', reverse: true,  inNeo120: false },

  // ── O3: Emotionality (facetIndex=15) ──────────────────────────────────────
  { id: 15,  th: 'สัมผัสอารมณ์ความรู้สึกของตนเองได้อย่างลึกซึ้ง',   en: 'Experience my emotions intensely.',                      facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false, inNeo120: true  },
  { id: 45,  th: 'รับรู้และรู้สึกถึงอารมณ์ของผู้อื่นได้',            en: "Feel others' emotions.",                                 facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false, inNeo120: true  },
  { id: 75,  th: 'หลงใหลและมีอารมณ์ร่วมไปกับอุดมการณ์ต่างๆ',        en: 'Am passionate about causes.',                            facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false, inNeo120: true  },
  { id: 105, th: 'ชอบตรวจสอบตนเองและชีวิตของตน',                     en: 'Enjoy examining myself and my life.',                    facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false, inNeo120: false },
  { id: 135, th: 'พยายามทำความเข้าใจตัวเอง',                          en: 'Try to understand myself.',                              facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false, inNeo120: false },
  { id: 165, th: 'ไม่ค่อยแสดงอารมณ์',                                 en: 'Seldom get emotional.',                                  facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: true,  inNeo120: false },
  { id: 195, th: 'อารมณ์ไม่ค่อยมีผลต่อตนเอง',                        en: 'Am not easily affected by my emotions.',                 facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: true,  inNeo120: false },
  { id: 225, th: 'ไม่ค่อยสังเกตปฏิกิริยาทางอารมณ์ของตนเอง',         en: 'Rarely notice my emotional reactions.',                  facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: true,  inNeo120: false },
  { id: 255, th: 'อารมณ์ไม่ค่อยขึ้นๆ ลงๆ',                          en: 'Experience very few emotional highs and lows.',          facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: true,  inNeo120: false },
  { id: 285, th: 'ไม่เข้าใจคนที่ใช้อารมณ์เยอะ',                     en: "Don't understand people who get emotional.",             facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: true,  inNeo120: true  },

  // ── O4: Adventurousness (facetIndex=16) ───────────────────────────────────
  { id: 16,  th: 'ชอบความหลากหลายมากกว่ากิจวัตรจำเจ',               en: 'Prefer variety to routine.',                             facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false, inNeo120: true  },
  { id: 46,  th: 'ชอบไปเที่ยวชมสถานที่ใหม่ๆ',                       en: 'Like to visit new places.',                              facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false, inNeo120: true  },
  { id: 76,  th: 'มีความสนใจในเรื่องต่างๆ มากมาย',                   en: 'Am interested in many things.',                          facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false, inNeo120: true  },
  { id: 106, th: 'ชอบเริ่มต้นสิ่งใหม่ๆ',                             en: 'Like to begin new things.',                              facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false, inNeo120: false },
  { id: 136, th: 'ชอบยึดติดกับสิ่งที่ตัวเองคุ้นเคยอยู่แล้ว',        en: 'Prefer to stick with things that I know.',               facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true,  inNeo120: true  },
  { id: 166, th: 'ไม่ชอบการเปลี่ยนแปลง',                             en: 'Dislike changes.',                                       facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true,  inNeo120: false },
  { id: 196, th: 'ไม่ชอบแนวคิดเรื่องการเปลี่ยนแปลง',                en: "Don't like the idea of change.",                         facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true,  inNeo120: false },
  { id: 226, th: 'ยึดติดกับนิสัยเดิมๆ',                              en: 'Am a creature of habit.',                                facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true,  inNeo120: false },
  { id: 256, th: 'ไม่ชอบลองอาหารใหม่ๆ',                              en: 'Dislike new foods.',                                     facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true,  inNeo120: false },
  { id: 286, th: 'ยึดติดกับวิธีการแบบเดิม',                          en: 'Am attached to conventional ways.',                      facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true,  inNeo120: false },

  // ── O5: Intellect (facetIndex=17) ─────────────────────────────────────────
  { id: 17,  th: 'ชอบแก้ปัญหาที่ซับซ้อน',                           en: 'Like to solve complex problems.',                        facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false, inNeo120: false },
  { id: 47,  th: 'ชอบอ่านเนื้อหาที่ท้าทายความคิด',                  en: 'Love to read challenging material.',                     facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false, inNeo120: false },
  { id: 77,  th: 'มีคลังคำศัพท์ที่หลากหลายและมากมาย',               en: 'Have a rich vocabulary.',                                facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false, inNeo120: true  },
  { id: 107, th: 'รับมือกับข้อมูลจำนวนมากได้',                       en: 'Can handle a lot of information.',                       facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false, inNeo120: false },
  { id: 137, th: 'สนุกกับการคิดทบทวนเรื่องต่างๆ',                   en: 'Enjoy thinking about things.',                           facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false, inNeo120: true  },
  { id: 167, th: 'ไม่สนใจแนวคิดเชิงนามธรรม',                        en: 'Am not interested in abstract ideas.',                   facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: true,  inNeo120: false },
  { id: 197, th: 'หลีกเลี่ยงการถกเถียงเชิงปรัชญา',                  en: 'Avoid philosophical discussions.',                       facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: true,  inNeo120: true  },
  { id: 227, th: 'ยากที่จะเข้าใจแนวคิดเชิงนามธรรม',                 en: 'Have difficulty understanding abstract ideas.',          facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: true,  inNeo120: false },
  { id: 257, th: 'ไม่สนใจการถกเถียงเชิงทฤษฎี',                      en: 'Am not interested in theoretical discussions.',          facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: true,  inNeo120: false },
  { id: 287, th: 'หลีกเลี่ยงการอ่านเนื้อหาที่ยาก',                  en: 'Avoid difficult reading material.',                      facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: true,  inNeo120: false },

  // ── O6: Liberalism (facetIndex=18) ────────────────────────────────────────
  { id: 18,  th: 'มีแนวโน้มที่จะสนับสนุนนักการเมืองที่หัวก้าวหน้า', en: 'Tend to vote for liberal political candidates.',         facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: false, inNeo120: true  },
  { id: 48,  th: 'เชื่อว่าความถูกหรือผิดนั้นไม่มีอยู่จริงแบบสมบูรณ์', en: 'Believe that there is no absolute right and wrong.',  facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: false, inNeo120: true  },
  { id: 78,  th: 'เชื่อว่าผู้กระทำผิดควรได้รับความช่วยเหลือมากกว่าการลงโทษ', en: 'Believe that criminals should receive help rather than punishment.', facet: 'O6', facetName: 'Liberalism', factor: 'O', reverse: false, inNeo120: false },
  { id: 108, th: 'เชื่อในศาสนาที่แท้จริงเพียงหนึ่งเดียว',           en: 'Believe in one true religion.',                          facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: true,  inNeo120: false },
  { id: 138, th: 'มีแนวโน้มที่จะสนับสนุนนักการเมืองที่หัวอนุรักษ์นิยม', en: 'Tend to vote for conservative political candidates.', facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: true,  inNeo120: true  },
  { id: 168, th: 'เชื่อว่าเงินภาษีถูกนำไปสนับสนุนศิลปินมากเกินไป',  en: 'Believe that too much tax money goes to support artists.', facet: 'O6', facetName: 'Liberalism',         factor: 'O', reverse: true,  inNeo120: false },
  { id: 198, th: 'รู้สึกว่ากฎหมายควรบังคับใช้อย่างเข้มงวด',         en: 'Believe laws should be strictly enforced.',              facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: true,  inNeo120: true  },
  { id: 228, th: 'เชื่อว่าเราปกป้องผู้กระทำผิดมากเกินไป',           en: 'Believe that we coddle criminals too much.',             facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: true,  inNeo120: false },
  { id: 258, th: 'เชื่อว่าควรจัดการกับอาชญากรรมอย่างเด็ดขาด',       en: 'Believe that we should be tough on crime.',              facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: true,  inNeo120: false },
  { id: 288, th: 'ชอบยืนขึ้นเมื่อได้ยินเพลงชาติ',                   en: 'Like to stand during the national anthem.',              facet: 'O6', facetName: 'Liberalism',           factor: 'O', reverse: true,  inNeo120: false },

  // ── A1: Trust (facetIndex=19) ─────────────────────────────────────────────
  { id: 19,  th: 'ไว้ใจผู้อื่น',                                      en: 'Trust others.',                                          facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: false, inNeo120: true  },
  { id: 49,  th: 'เชื่อว่าผู้อื่นมีเจตนาดี',                         en: 'Believe that others have good intentions.',              facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: false, inNeo120: true  },
  { id: 79,  th: 'เชื่อสิ่งที่ผู้อื่นพูด',                           en: 'Trust what people say.',                                 facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: false, inNeo120: false },
  { id: 109, th: 'เชื่อว่าคนส่วนใหญ่มีคุณธรรมพื้นฐาน',              en: 'Believe that people are basically moral.',               facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: false, inNeo120: false },
  { id: 139, th: 'เชื่อในความดีของมนุษย์',                            en: 'Believe in human goodness.',                             facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: false, inNeo120: false },
  { id: 169, th: 'คิดว่าทุกอย่างจะดีขึ้น',                           en: 'Think that all will be well.',                           facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: false, inNeo120: false },
  { id: 199, th: 'ไม่ไว้วางใจผู้คน',                                  en: 'Distrust people.',                                       facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: true,  inNeo120: false },
  { id: 229, th: 'มักสงสัยว่าผู้อื่นมีเจตนาแอบแฝง',                 en: 'Suspect hidden motives in others.',                      facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: true,  inNeo120: true  },
  { id: 259, th: 'คอยระมัดระวังและหวาดระแวงผู้อื่นเสมอ',            en: 'Am wary of others.',                                     facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: true,  inNeo120: true  },
  { id: 289, th: 'เชื่อว่าคนส่วนใหญ่มีความชั่วร้ายในตัว',           en: 'Believe that people are essentially evil.',              facet: 'A1', facetName: 'Trust',               factor: 'A', reverse: true,  inNeo120: false },

  // ── A2: Morality (facetIndex=20) ──────────────────────────────────────────
  { id: 20,  th: 'ไม่มีทางโกงภาษีเด็ดขาด',                          en: 'Would never cheat on my taxes.',                         facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: false, inNeo120: false },
  { id: 50,  th: 'ยึดถือกฎระเบียบ',                                   en: 'Stick to the rules.',                                    facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: false, inNeo120: false },
  { id: 80,  th: 'ใช้การประจบเพื่อความก้าวหน้า',                     en: 'Use flattery to get ahead.',                             facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 110, th: 'หลอกใช้ผู้อื่นเพื่อผลประโยชน์ของตนเอง',           en: 'Use others for my own ends.',                            facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: true  },
  { id: 140, th: 'รู้วิธีหลีกเลี่ยงกฎ',                              en: 'Know how to get around the rules.',                      facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 170, th: 'พร้อมจะเอาเปรียบเพื่อความก้าวหน้า',               en: 'Cheat to get ahead.',                                    facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: true  },
  { id: 200, th: 'กดดันผู้อื่น',                                      en: 'Put people under pressure.',                             facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 230, th: 'แกล้งทำเป็นห่วงใยผู้อื่น',                        en: 'Pretend to be concerned for others.',                    facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 260, th: 'ฉวยโอกาสจากผู้อื่น',                               en: 'Take advantage of others.',                              facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: true  },
  { id: 290, th: 'ขัดขวางแผนการของผู้อื่น',                          en: "Obstruct others' plans.",                                facet: 'A2', facetName: 'Morality',            factor: 'A', reverse: true,  inNeo120: false },

  // ── A3: Altruism (facetIndex=21) ──────────────────────────────────────────
  { id: 21,  th: 'ทำให้ผู้อื่นรู้สึกว่าได้รับการต้อนรับเสมอ',       en: 'Make people feel welcome.',                              facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: false, inNeo120: true  },
  { id: 51,  th: 'คิดเผื่อความต้องการของผู้อื่นล่วงหน้า',           en: 'Anticipate the needs of others.',                        facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: false, inNeo120: true  },
  { id: 81,  th: 'รักที่จะช่วยเหลือผู้อื่น',                         en: 'Love to help others.',                                   facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: false, inNeo120: true  },
  { id: 111, th: 'ใส่ใจและเป็นห่วงผู้อื่น',                          en: 'Am concerned about others.',                             facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: false, inNeo120: false },
  { id: 141, th: 'มีคำพูดดีๆ ให้กับทุกคน',                           en: 'Have a good word for everyone.',                         facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: false, inNeo120: false },
  { id: 171, th: 'มองข้ามหรือดูถูกผู้อื่น',                          en: 'Look down on others.',                                   facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 201, th: 'เพิกเฉยต่อความรู้สึกของผู้อื่น',                  en: 'Am indifferent to the feelings of others.',              facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: true,  inNeo120: true  },
  { id: 231, th: 'ทำให้ผู้อื่นรู้สึกไม่สบายใจ',                     en: 'Make people feel uncomfortable.',                        facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 261, th: 'หันหลังให้กับผู้อื่น',                              en: 'Turn my back on others.',                                facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 291, th: 'ไม่มีเวลาให้กับผู้อื่น',                           en: 'Take no time for others.',                               facet: 'A3', facetName: 'Altruism',            factor: 'A', reverse: true,  inNeo120: false },

  // ── A4: Cooperation (facetIndex=22) ───────────────────────────────────────
  { id: 22,  th: 'เป็นคนทำให้พอใจได้ง่ายดาย',                       en: 'Am easy to satisfy.',                                    facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: false, inNeo120: true  },
  { id: 52,  th: 'ทนไม่ได้กับการเผชิญหน้ากัน',                      en: "Can't stand confrontations.",                            facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: false, inNeo120: true  },
  { id: 82,  th: 'เกลียดที่จะทำตัวเป็นที่น่ารำคาญ',                 en: 'Hate to seem pushy.',                                    facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: false, inNeo120: true  },
  { id: 112, th: 'พูดตรงและบาดใจ',                                    en: 'Have a sharp tongue.',                                   facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: false },
  { id: 142, th: 'ชอบโต้แย้งผู้อื่น',                                 en: 'Contradict others.',                                     facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: false },
  { id: 172, th: 'ชอบการต่อสู้หรือมีปากเสียงกันเป็นอย่างมาก',       en: 'Love a good fight.',                                     facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: true  },
  { id: 202, th: 'ชอบตะโกนใส่ผู้อื่น',                               en: 'Yell at people.',                                        facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: false },
  { id: 232, th: 'ชอบดูถูกหรือพูดจาไม่ดีกับผู้อื่น',                en: 'Insult people.',                                         facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: false },
  { id: 262, th: 'แก้แค้นผู้อื่น',                                    en: 'Get back at others.',                                    facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: false },
  { id: 292, th: 'โกรธแล้วไม่ยอมลืม',                                en: 'Hold a grudge.',                                         facet: 'A4', facetName: 'Cooperation',         factor: 'A', reverse: true,  inNeo120: false },

  // ── A5: Modesty (facetIndex=23) ───────────────────────────────────────────
  { id: 23,  th: 'ไม่ชอบตกเป็นจุดสนใจ',                             en: 'Dislike being the center of attention.',                 facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: false, inNeo120: true  },
  { id: 53,  th: 'ไม่ชอบพูดถึงตัวเอง',                              en: 'Dislike talking about myself.',                          facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: false, inNeo120: false },
  { id: 83,  th: 'มองตัวเองว่าเป็นคนธรรมดาทั่วไป',                 en: 'Consider myself an average person.',                     facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: false, inNeo120: false },
  { id: 113, th: 'ไม่ค่อยโอ้อวดตัวเอง',                             en: 'Seldom toot my own horn.',                               facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: false, inNeo120: false },
  { id: 143, th: 'เชื่อว่าตนเองดีกว่าผู้อื่น',                      en: 'Believe that I am better than others.',                  facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: true,  inNeo120: false },
  { id: 173, th: 'คิดว่าตัวเองมีความสำคัญอย่างมาก',                 en: 'Think highly of myself.',                                facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: true,  inNeo120: true  },
  { id: 203, th: 'ประเมินตัวเองไว้สูงมาก',                           en: 'Have a high opinion of myself.',                         facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: true,  inNeo120: true  },
  { id: 233, th: 'คิดว่าตัวเองรู้คำตอบของหลายๆ เรื่อง',             en: 'Know the answers to many questions.',                    facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: true,  inNeo120: false },
  { id: 263, th: 'ชอบโอ้อวดความสามารถและส่วนดีของตัวเอง',           en: 'Boast about my virtues.',                                facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: true,  inNeo120: true  },
  { id: 293, th: 'ทำให้ตัวเองเป็นศูนย์กลางความสนใจ',               en: 'Make myself the center of attention.',                   facet: 'A5', facetName: 'Modesty',             factor: 'A', reverse: true,  inNeo120: false },

  // ── A6: Sympathy (facetIndex=24) ──────────────────────────────────────────
  { id: 24,  th: 'เห็นใจคนเร่ร่อน',                                   en: 'Sympathize with the homeless.',                          facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: false, inNeo120: true  },
  { id: 54,  th: 'รู้สึกสงสารผู้ที่ด้อยกว่าตนเองเสมอ',              en: 'Feel sympathy for those who are worse off than myself.', facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: false, inNeo120: true  },
  { id: 84,  th: 'ให้คุณค่ากับความร่วมมือมากกว่าการแข่งขัน',        en: 'Value cooperation over competition.',                    facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: false, inNeo120: true  },
  { id: 114, th: 'รู้สึกเจ็บปวดกับความทุกข์ของผู้อื่น',             en: "Suffer from others' sorrows.",                           facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: false, inNeo120: false },
  { id: 144, th: 'ไม่สนใจปัญหาของผู้อื่น',                           en: "Am not interested in other people's problems.",          facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: true,  inNeo120: true  },
  { id: 174, th: 'ไม่ชอบคนที่อ่อนไหวเกินไป',                        en: 'Tend to dislike soft-hearted people.',                   facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 204, th: 'เชื่อในหลักตาต่อตาฟันต่อฟัน',                    en: 'Believe in an eye for an eye.',                          facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 234, th: 'พยายามไม่คิดถึงคนที่ต้องการความช่วยเหลือ',        en: 'Try not to think about the needy.',                      facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 264, th: 'เชื่อว่าคนต้องพึ่งพาตนเองได้',                    en: 'Believe people should fend for themselves.',             facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: true,  inNeo120: false },
  { id: 294, th: 'ทนไม่ได้กับคนอ่อนแอ',                              en: "Can't stand weak people.",                               facet: 'A6', facetName: 'Sympathy',            factor: 'A', reverse: true,  inNeo120: false },

  // ── C1: Self-Efficacy (facetIndex=25) ─────────────────────────────────────
  { id: 25,  th: 'ทำงานต่างๆ จนสำเร็จลุล่วงด้วยดี',                 en: 'Complete tasks successfully.',                           facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: false, inNeo120: true  },
  { id: 55,  th: 'เก่งในสิ่งที่ทำ',                                   en: 'Excel in what I do.',                                    facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: false, inNeo120: false },
  { id: 85,  th: 'จัดการงานต่างๆ ได้อย่างราบรื่น',                   en: 'Handle tasks smoothly.',                                 facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: false, inNeo120: false },
  { id: 115, th: 'มั่นใจในสิ่งที่ตนเองทำ',                           en: 'Am sure of my ground.',                                  facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: false, inNeo120: false },
  { id: 145, th: 'คิดหาทางออกที่ดีให้กับปัญหาได้เสมอ',              en: 'Come up with good solutions.',                           facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: false, inNeo120: true  },
  { id: 175, th: 'รู้ว่าต้องทำอย่างไรถึงจะจัดการสิ่งต่างๆ ได้สำเร็จ', en: 'Know how to get things done.',                        facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: false, inNeo120: true  },
  { id: 205, th: 'ตัดสินสถานการณ์ผิดพลาดบ่อย',                      en: 'Misjudge situations.',                                   facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: true,  inNeo120: false },
  { id: 235, th: 'ไม่ค่อยเข้าใจสิ่งต่างๆ',                          en: "Don't understand things.",                               facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: true,  inNeo120: false },
  { id: 265, th: 'รู้สึกว่าตนเองมีคุณค่าน้อย',                       en: 'Have little to contribute.',                             facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: true,  inNeo120: false },
  { id: 295, th: 'ไม่เห็นผลลัพธ์ที่ตามมาจากสิ่งต่างๆ',             en: "Don't see the consequences of things.",                  facet: 'C1', facetName: 'Self-Efficacy',       factor: 'C', reverse: true,  inNeo120: false },

  // ── C2: Orderliness (facetIndex=26) ───────────────────────────────────────
  { id: 26,  th: 'ชอบความเป็นระเบียบเรียบร้อย',                      en: 'Like order.',                                            facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: false, inNeo120: true  },
  { id: 56,  th: 'ชอบจัดของให้เป็นระเบียบ',                          en: 'Like to tidy up.',                                       facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 86,  th: 'ต้องการให้ทุกอย่างเป็นไปอย่างถูกต้องสมบูรณ์',    en: "Want everything to be 'just right.'",                    facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 116, th: 'รักความเป็นระเบียบและสม่ำเสมอ',                   en: 'Love order and regularity.',                             facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 146, th: 'ทำสิ่งต่างๆ ตามแผนที่วางไว้',                      en: 'Do things according to a plan.',                         facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 176, th: 'มักจะลืมเก็บของให้เข้าที่',                        en: 'Often forget to put things back in their proper place.', facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 206, th: 'ทิ้งความรกรุงรังไว้ในห้องตนเอง',                  en: 'Leave a mess in my room.',                               facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: true,  inNeo120: true  },
  { id: 236, th: 'ทิ้งข้าวของไว้ตามที่ต่างๆ',                        en: 'Leave my belongings around.',                            facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 266, th: 'ไม่รำคาญคนที่ไม่เป็นระเบียบ',                     en: 'Am not bothered by messy people.',                       facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 296, th: 'ไม่รำคาญกับความไม่เป็นระเบียบ',                   en: 'Am not bothered by disorder.',                           facet: 'C2', facetName: 'Orderliness',         factor: 'C', reverse: true,  inNeo120: false },

  // ── C3: Dutifulness (facetIndex=27) ───────────────────────────────────────
  { id: 27,  th: 'พยายามปฏิบัติตามกฎ',                               en: 'Try to follow the rules.',                               facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 57,  th: 'รักษาสัญญาที่ให้ไว้เสมอ',                          en: 'Keep my promises.',                                      facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: false, inNeo120: true  },
  { id: 87,  th: 'จ่ายค่าใช้จ่ายตรงเวลา',                           en: 'Pay my bills on time.',                                  facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 117, th: 'พูดความจริงเสมอ',                                   en: 'Tell the truth.',                                        facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: false, inNeo120: true  },
  { id: 147, th: 'ฟังเสียงของมโนธรรม',                               en: 'Listen to my conscience.',                               facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: false, inNeo120: false },
  { id: 177, th: 'ฝ่าฝืนกฎระเบียบ',                                  en: 'Break rules.',                                           facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 207, th: 'ผิดสัญญา',                                          en: 'Break my promises.',                                     facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 237, th: 'ให้คนอื่นทำหน้าที่แทนตนเอง',                      en: 'Get others to do my duties.',                            facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 267, th: 'ทำสิ่งตรงข้ามกับที่ถูกขอ',                        en: 'Do the opposite of what is asked.',                      facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: true,  inNeo120: false },
  { id: 297, th: 'มักจะบิดเบือนข้อมูลหรือความจริง',                  en: 'Misrepresent the facts.',                                facet: 'C3', facetName: 'Dutifulness',         factor: 'C', reverse: true,  inNeo120: true  },

  // ── C4: Achievement-Striving (facetIndex=28) ──────────────────────────────
  { id: 28,  th: 'มุ่งตรงสู่เป้าหมาย',                               en: 'Go straight for the goal.',                              facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: false },
  { id: 58,  th: 'ทำงานหนัก',                                         en: 'Work hard.',                                             facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: true  },
  { id: 88,  th: 'เปลี่ยนแผนการให้กลายเป็นการลงมือทำจริง',          en: 'Turn plans into actions.',                               facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: true  },
  { id: 118, th: 'ทุ่มเทกับงานอย่างเต็มที่',                         en: 'Plunge into tasks with all my heart.',                   facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: false },
  { id: 148, th: 'ทำมากกว่าที่คาดหวัง',                              en: "Do more than what's expected of me.",                    facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: false },
  { id: 178, th: 'ตั้งมาตรฐานสูงสำหรับตนเองและผู้อื่น',             en: 'Set high standards for myself and others.',              facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: false },
  { id: 208, th: 'ให้ความสำคัญกับคุณภาพ',                            en: 'Demand quality.',                                        facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false, inNeo120: false },
  { id: 238, th: 'ไม่ได้มีแรงจูงใจสูงในการประสบความสำเร็จ',         en: 'Am not highly motivated to succeed.',                    facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: true,  inNeo120: false },
  { id: 268, th: 'ทำงานแค่พอให้ผ่านๆ ไป',                           en: 'Do just enough work to get by.',                         facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: true,  inNeo120: true  },
  { id: 298, th: 'ใช้เวลาและความพยายามน้อยกับงาน',                  en: 'Put little time and effort into my work.',               facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: true,  inNeo120: false },

  // ── C5: Self-Discipline (facetIndex=29) ───────────────────────────────────
  { id: 29,  th: 'ทำงานบ้านต่างๆ ให้เสร็จโดยทันที',                 en: 'Get chores done right away.',                            facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: false, inNeo120: true  },
  { id: 59,  th: 'เตรียมพร้อมอยู่เสมอ',                              en: 'Am always prepared.',                                    facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: false, inNeo120: false },
  { id: 89,  th: 'เริ่มงานในทันทีโดยไม่ผลัดวันประกันพรุ่ง',         en: 'Start tasks right away.',                                facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: false, inNeo120: true  },
  { id: 119, th: 'ลงมือทำงานทันที',                                   en: 'Get to work at once.',                                   facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: false, inNeo120: false },
  { id: 149, th: 'ดำเนินการตามแผนที่วางไว้',                         en: 'Carry out my plans.',                                    facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: false, inNeo120: false },
  { id: 179, th: 'พบว่ายากที่จะตั้งใจทำงานอย่างจริงจัง',            en: 'Find it difficult to get down to work.',                 facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: true,  inNeo120: true  },
  { id: 209, th: 'เสียเวลาไปโดยเปล่าประโยชน์',                      en: 'Waste my time.',                                         facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: true,  inNeo120: false },
  { id: 239, th: 'ต้องการแรงกระตุ้นเพื่อเริ่มต้น',                  en: 'Need a push to get started.',                            facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: true,  inNeo120: false },
  { id: 269, th: 'เริ่มต้นงานได้ยาก',                                en: 'Have difficulty starting tasks.',                        facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: true,  inNeo120: false },
  { id: 299, th: 'ผัดผ่อนการตัดสินใจ',                               en: 'Postpone decisions.',                                    facet: 'C5', facetName: 'Self-Discipline',     factor: 'C', reverse: true,  inNeo120: false },

  // ── C6: Cautiousness (facetIndex=30) ──────────────────────────────────────
  { id: 30,  th: 'หลีกเลี่ยงความผิดพลาด',                            en: 'Avoid mistakes.',                                        facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: false, inNeo120: true  },
  { id: 60,  th: 'เลือกใช้คำพูดอย่างระมัดระวัง',                    en: 'Choose my words with care.',                             facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: false, inNeo120: true  },
  { id: 90,  th: 'ยึดมั่นในเส้นทางที่เลือกแล้ว',                    en: 'Stick to my chosen path.',                               facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: false, inNeo120: false },
  { id: 120, th: 'ทำสิ่งต่างๆ โดยไม่คิดก่อน',                       en: 'Jump into things without thinking.',                     facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: false },
  { id: 150, th: 'ตัดสินใจอย่างหุนหันพลันแล่น',                     en: 'Make rash decisions.',                                   facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: false },
  { id: 180, th: 'ชอบทำตามใจชั่วขณะ',                                en: 'Like to act on a whim.',                                 facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: false },
  { id: 210, th: 'รีบเร่งทำสิ่งต่างๆ',                               en: 'Rush into things.',                                      facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: false },
  { id: 240, th: 'ทำสิ่งบ้าๆ บอๆ',                                   en: 'Do crazy things.',                                       facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: false },
  { id: 270, th: 'ทำสิ่งต่างๆ โดยไม่คิดชั่งใจ',                     en: 'Act without thinking.',                                  facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: true  },
  { id: 300, th: 'มักวางแผนในนาทีสุดท้าย',                           en: 'Often make last-minute plans.',                          facet: 'C6', facetName: 'Cautiousness',        factor: 'C', reverse: true,  inNeo120: false },
]

// Items to show in quiz300 (those NOT in items120 — the +180 continuation)
export const items300new = items300.filter(i => !i.inNeo120)

export const ITEMS_PER_PAGE_300 = 10
export const TOTAL_PAGES_300 = Math.ceil(items300new.length / ITEMS_PER_PAGE_300)

export function getPageItems300(page: number): Item300[] {
  const start = (page - 1) * ITEMS_PER_PAGE_300
  return items300new.slice(start, start + ITEMS_PER_PAGE_300)
}
