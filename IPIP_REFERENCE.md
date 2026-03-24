# IPIP Reference — OCEAN Platform

## Instruments

| Instrument | Items | Facets | Thai Status | Source |
|------------|-------|--------|-------------|--------|
| IPIP-50-TH | 50 | Domains only | Official (Yomaboot & Cooper) | https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm |
| IPIP-NEO-120 | 120 | 30 facets × 4 items | AI-translated | Johnson (2014); https://ipip.ori.org/30FacetNEO-PI-RItems.htm |
| IPIP-NEO-300 | 300 | 30 facets × 10 items | AI-translated | Goldberg; https://ipip.ori.org/newNEOFacetsKey.htm |

## Transfer Map

| Transition | Pre-filled | Still needed |
|---|---|---|
| 50-item → 120-item | 0 (separate instruments) | 120 fresh items |
| 120-item → 300-item | 120 items | 180 new items |

The 120-item test uses fresh items only — no overlap with the Thai 50-item instrument.
The 300-item test is presented as a +180 continuation after the 120-item test.

## Scoring Formulas

### 50-item domains (existing, unchanged)
- 10 items per domain, raw range 10–50
- `pct = (raw - 10) / 40 * 100`, clamped 0–100

### 120-item facets (IPIP-NEO-120)
- 4 items per facet, raw range 4–20
- `pct = (raw - 4) / 16 * 100`, clamped 0–100
- Domain pct = average of 6 facet pct values

### 300-item facets (IPIP-NEO-300)
- 10 items per facet, raw range 10–50
- `pct = (raw - 10) / 40 * 100`, clamped 0–100
- Domain pct = average of 6 facet pct values

## 30 Facets Structure

### Neuroticism (N)
| Code | Facet EN | Facet TH |
|------|----------|----------|
| N1 | Anxiety | ความวิตกกังวล |
| N2 | Anger | ความโกรธง่าย |
| N3 | Depression | ภาวะซึมเศร้า |
| N4 | Self-Consciousness | ความเขินอาย |
| N5 | Immoderation | การขาดการยับยั้งชั่งใจ |
| N6 | Vulnerability | ความเปราะบาง |

### Extraversion (E)
| Code | Facet EN | Facet TH |
|------|----------|----------|
| E1 | Friendliness | ความเป็นมิตร |
| E2 | Gregariousness | ความชอบสังคม |
| E3 | Assertiveness | ความกล้าแสดงออก |
| E4 | Activity Level | ระดับความกระตือรือร้น |
| E5 | Excitement-Seeking | การแสวงหาความตื่นเต้น |
| E6 | Cheerfulness | ความร่าเริง |

### Openness (O)
| Code | Facet EN | Facet TH |
|------|----------|----------|
| O1 | Imagination | จินตนาการ |
| O2 | Artistic Interests | ความสนใจด้านศิลปะ |
| O3 | Emotionality | ความอ่อนไหวทางอารมณ์ |
| O4 | Adventurousness | ความชอบผจญภัย |
| O5 | Intellect | ความสนใจด้านสติปัญญา |
| O6 | Liberalism | ความเปิดกว้างทางความคิด |

### Agreeableness (A)
| Code | Facet EN | Facet TH |
|------|----------|----------|
| A1 | Trust | ความไว้วางใจ |
| A2 | Morality | ความซื่อสัตย์ |
| A3 | Altruism | ความเห็นอกเห็นใจ |
| A4 | Cooperation | ความร่วมมือ |
| A5 | Modesty | ความถ่อมตน |
| A6 | Sympathy | ความเห็นใจผู้อื่น |

### Conscientiousness (C)
| Code | Facet EN | Facet TH |
|------|----------|----------|
| C1 | Self-Efficacy | ความเชื่อมั่นในตนเอง |
| C2 | Orderliness | ความเป็นระเบียบ |
| C3 | Dutifulness | ความรับผิดชอบต่อหน้าที่ |
| C4 | Achievement-Striving | ความมุ่งมั่นสู่ความสำเร็จ |
| C5 | Self-Discipline | ความมีวินัยในตนเอง |
| C6 | Cautiousness | ความรอบคอบ |

---

## IPIP-NEO-120 Item List

Source: https://ipip.ori.org/30FacetNEO-PI-RItems.htm
120 items total: 30 facets × 4 items each
Keying: `+` = normal scoring, `-` = reverse scored (score = 6 − response)

### N1 — Anxiety
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 1 | + | Worry about things. | มักกังวลเรื่องต่างๆ |
| 31 | - | Am not easily bothered by things. | ไม่ค่อยเก็บเรื่องต่างๆ มาว้าวุ่นใจ |
| 61 | + | Fear for the worst. | มักจะคิดเผื่อในแง่ร้ายที่สุดไว้เสมอ |
| 91 | + | Am afraid of many things. | มีความหวาดกลัวต่อหลายสิ่งหลายอย่าง |

### N2 — Anger
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 2 | + | Get angry easily. | โกรธง่าย |
| 32 | - | Rarely get irritated. | ไม่ค่อยหงุดหงิดอะไรง่ายๆ |
| 62 | + | Get upset easily. | อารมณ์เสียได้ง่าย |
| 92 | + | Am filled with doubts about things. | มักเต็มไปด้วยความสงสัยในหลายๆ เรื่อง |

### N3 — Depression
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 3 | + | Often feel blue. | มักจะรู้สึกเศร้าซึม |
| 33 | - | Feel comfortable with myself. | รู้สึกสบายใจกับตัวเอง |
| 63 | + | Dislike myself. | ไม่ชอบตัวเอง |
| 93 | + | Have frequent mood swings. | อารมณ์แปรปรวนบ่อย |

### N4 — Self-Consciousness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 4 | + | Am easily embarrassed. | รู้สึกเขินอายง่าย |
| 34 | - | Am not embarrassed easily. | ไม่รู้สึกอับอายอะไรง่ายๆ |
| 64 | + | Find it difficult to approach others. | รู้สึกว่าการเข้าหาผู้อื่นเป็นเรื่องยาก |
| 94 | + | Am afraid that I will do the wrong thing. | กลัวว่าจะทำสิ่งที่ผิดพลาด |

### N5 — Immoderation
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 5 | + | Find it difficult to resist my cravings. | พบว่ายากที่จะทนต่อความอยากของตนเอง |
| 35 | - | Easily resist temptations. | สามารถต้านทานสิ่งเย้ายวนต่างๆ ได้ง่าย |
| 65 | + | Love to eat. | รักการกิน |
| 95 | + | Have trouble resisting my urges. | มีปัญหาในการต้านทานแรงกระตุ้นของตนเอง |

### N6 — Vulnerability
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 6 | + | Panic easily. | ตื่นตระหนกง่าย |
| 36 | - | Remain calm under pressure. | ยังคงสงบสติอารมณ์ได้ภายใต้ความกดดัน |
| 66 | + | Become overwhelmed by events. | ยอมแพ้ต่อสถานการณ์ต่างๆ อย่างรวดเร็ว |
| 96 | + | Feel that I'm unable to deal with things. | รู้สึกว่าตนเองไม่สามารถจัดการกับเรื่องต่างๆ ได้ |

### E1 — Friendliness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 7 | + | Make friends easily. | ผูกมิตรกับคนอื่นได้ง่าย |
| 37 | - | Keep others at a distance. | รักษาระยะห่างกับผู้อื่นเสมอ |
| 67 | + | Warm up quickly to others. | ทำความคุ้นเคยกับคนอื่นได้อย่างรวดเร็ว |
| 97 | + | Feel comfortable around people. | รู้สึกสบายใจเมื่ออยู่ท่ามกลางผู้คน |

### E2 — Gregariousness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 8 | + | Love large parties. | ชอบงานเลี้ยงใหญ่ๆ |
| 38 | - | Avoid crowds. | หลีกเลี่ยงสถานที่ที่มีคนพลุกพล่าน |
| 68 | + | Talk to a lot of different people at parties. | ได้พูดคุยกับผู้คนมากมายเวลาไปงานสังสรรค์ |
| 98 | - | Prefer to be alone. | ชอบอยู่คนเดียวมากกว่า |

### E3 — Assertiveness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 9 | + | Take charge. | ชอบเป็นผู้นำและผู้จัดการ |
| 39 | - | Wait for others to lead the way. | รอให้คนอื่นเป็นคนนำทางเสมอ |
| 69 | + | Speak up for myself. | กล้าพูดสนับสนุนจุดยืนของตนเอง |
| 99 | - | Am not very assertive. | ไม่ใช่คนที่กล้าแสดงออกเท่าไหร่ |

### E4 — Activity Level
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 10 | + | Am always busy. | ยุ่งอยู่ตลอดเวลา |
| 40 | - | Like to take it easy. | ชอบทำตัวสบายๆ |
| 70 | + | Am always on the go. | เดินทางหรือทำกิจกรรมอยู่เสมอ |
| 100 | + | Do a lot in my spare time. | มักหาอะไรทำมากมายในเวลาว่าง |

### E5 — Excitement-Seeking
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 11 | + | Love excitement. | ชอบความตื่นเต้นเร้าใจ |
| 41 | - | Dislike loud music. | ไม่ชอบเพลงเสียงดัง |
| 71 | + | Seek adventure. | แสวงหาการผจญภัย |
| 101 | + | Enjoy being part of a loud crowd. | สนุกที่ได้เป็นส่วนหนึ่งของฝูงชนที่ส่งเสียงดัง |

### E6 — Cheerfulness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 12 | + | Radiate joy. | เป็นคนร่าเริงและเปล่งประกายความสุข |
| 42 | - | Am not easily amused. | ยากที่อะไรจะทำให้ฉันรู้สึกขบขัน |
| 72 | + | Have a lot of fun. | สนุกสนานเฮฮาอยู่เสมอ |
| 102 | + | Express childlike joy. | แสดงความสุขออกมาแบบเด็กๆ อย่างเต็มที่ |

### O1 — Imagination
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 13 | + | Have a vivid imagination. | มีจินตนาการโลดแล่นและมีชีวิตชีวา |
| 43 | - | Seldom daydream. | ไม่ค่อยจะฝันกลางวัน |
| 73 | + | Love to daydream. | ชอบที่จะฝันกลางวัน |
| 103 | + | Enjoy wild flights of fantasy. | สนุกไปกับความคิดเพ้อฝันที่หลุดโลก |

### O2 — Artistic Interests
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 14 | + | Believe in the importance of art. | เชื่อในความสำคัญของศิลปะ |
| 44 | - | Do not like art. | ไม่ชอบศิลปะ |
| 74 | + | See beauty in things that others might not notice. | เห็นความสวยงามในสิ่งที่คนอื่นมักมองข้าม |
| 104 | + | Love to read challenging material. | ชอบอ่านเนื้อหาที่ท้าทายความคิด |

### O3 — Emotionality
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 15 | + | Experience my emotions intensely. | สัมผัสอารมณ์ความรู้สึกของตนเองได้อย่างลึกซึ้ง |
| 45 | - | Don't understand people who get emotional. | ไม่เข้าใจคนที่ใช้อารมณ์เยอะ |
| 75 | + | Am passionate about causes. | หลงใหลและมีอารมณ์ร่วมไปกับอุดมการณ์ต่างๆ |
| 105 | + | Feel others' emotions. | รับรู้และรู้สึกถึงอารมณ์ของผู้อื่นได้ |

### O4 — Adventurousness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 16 | + | Prefer variety to routine. | ชอบความหลากหลายมากกว่ากิจวัตรจำเจ |
| 46 | - | Prefer to stick with things that I know. | ชอบยึดติดกับสิ่งที่ตัวเองคุ้นเคยอยู่แล้ว |
| 76 | + | Like to visit new places. | ชอบไปเที่ยวชมสถานที่ใหม่ๆ |
| 106 | + | Am interested in many things. | มีความสนใจในเรื่องต่างๆ มากมาย |

### O5 — Intellect
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 17 | + | Love to think up new ways of doing things. | ชอบคิดหาวิธีใหม่ๆ ในการทำสิ่งต่างๆ |
| 47 | - | Avoid philosophical discussions. | หลีกเลี่ยงการถกเถียงเชิงปรัชญา |
| 77 | + | Enjoy thinking about things. | สนุกกับการคิดทบทวนเรื่องต่างๆ |
| 107 | + | Have a rich vocabulary. | มีคลังคำศัพท์ที่หลากหลายและมากมาย |

### O6 — Liberalism
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 18 | + | Tend to vote for liberal political candidates. | มีแนวโน้มที่จะสนับสนุนนักการเมืองที่หัวก้าวหน้า |
| 48 | - | Tend to vote for conservative political candidates. | มีแนวโน้มที่จะสนับสนุนนักการเมืองที่หัวอนุรักษ์นิยม |
| 78 | + | Believe that there is no absolute right or wrong. | เชื่อว่าความถูกหรือผิดนั้นไม่มีอยู่จริงแบบร้อยเปอร์เซ็นต์ |
| 108 | + | Feel that laws should be strictly enforced. | รู้สึกว่ากฎหมายควรบังคับใช้อย่างเข้มงวด |

> **Note on O6:** The political voting items (18, 48) are from the original IPIP instrument.
> These will be replaced or adapted during Thai translation to be culturally appropriate.

### A1 — Trust
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 19 | + | Trust others. | ไว้ใจผู้อื่น |
| 49 | - | Suspect hidden motives in others. | มักสงสัยว่าผู้อื่นมีเจตนาแอบแฝง |
| 79 | + | Believe that others have good intentions. | เชื่อว่าผู้อื่นมีเจตนาดี |
| 109 | - | Am wary of others. | คอยระมัดระวังและหวาดระแวงผู้อื่นเสมอ |

### A2 — Morality
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 20 | + | Use others for my own ends. | หลอกใช้ผู้อื่นเพื่อผลประโยชน์ของตนเอง |
| 50 | - | Cheat to get ahead. | พร้อมจะเอาเปรียบเพื่อความก้าวหน้า |
| 80 | + | Pretend to be more than I am. | แสร้งทำเป็นดีเพื่อให้คนอื่นนับถือ |
| 110 | + | Take advantage of others. | ฉวยโอกาสจากผู้อื่น |

> **Note on A2:** Items 20, 80, 110 are reverse-keyed in scoring even though they appear positive.

### A3 — Altruism
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 21 | + | Make people feel welcome. | ทำให้ผู้อื่นรู้สึกว่าได้รับการต้อนรับเสมอม |
| 51 | - | Am indifferent to the feelings of others. | เพิกเฉยต่อความรู้สึกของผู้อื่น |
| 81 | + | Anticipate the needs of others. | คิดเผื่อความต้องการของผู้อื่นล่วงหน้า |
| 111 | + | Love to help others. | รักที่จะช่วยเหลือผู้อื่น |

### A4 — Cooperation
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 22 | + | Can't stand confrontation. | ทนไม่ได้กับการเผชิญหน้ากัน |
| 52 | - | Love a good fight. | ชอบการต่อสู้หรือมีปากเสียงกันเป็นอย่างมาก |
| 82 | + | Hate to seem pushy. | เกลียดที่จะทำตัวเป็นที่น่ารำคาญ |
| 112 | + | Am easy to satisfy. | เป็นคนทำให้พอใจได้ง่ายดาย |

### A5 — Modesty
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 23 | + | Dislike being the center of attention. | ไม่ชอบตกเป็นจุดสนใจ |
| 53 | - | Think highly of myself. | คิดว่าตัวเองมีความสำคัญอย่างมาก |
| 83 | + | Boast about my virtues. | ชอบโอ้อวดความสามารถและส่วนดีของตัวเอง |
| 113 | + | Have a high opinion of myself. | ประเมินตัวเองไว้สูงมาก |

### A6 — Sympathy
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 24 | + | Sympathize with the homeless. | เห็นใจคนเร่ร่อน |
| 54 | - | Am not interested in other people's problems. | ไม่สนใจปัญหาของผู้อื่น |
| 84 | + | Feel sympathy for those who are worse off than myself. | รู้สึกสงสารผู้ที่ด้อยกว่าตนเองเสมอ |
| 114 | + | Value cooperation over competition. | ให้คุณค่ากับความร่วมมือมากกว่าการแข่งขัน |

### C1 — Self-Efficacy
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 25 | + | Complete tasks successfully. | ทำงานต่างๆ จนสำเร็จลุล่วงด้วยดี |
| 55 | - | Often forget to put things back in their proper place. | มักจะลืมเก็บของให้เข้าที่ |
| 85 | + | Come up with good solutions. | คิดหาทางออกที่ดีให้กับปัญหาได้เสมอ |
| 115 | + | Know how to get things done. | รู้ว่าต้องทำอย่างไรถึงจะจัดการสิ่งต่างๆ ได้สำเร็จ |

### C2 — Orderliness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 26 | + | Like order. | ชอบความเป็นระเบียบเรียบร้อย |
| 56 | - | Leave a mess in my room. | ทิ้งความรกรุงรังไว้ในห้องตนเอง |
| 86 | + | Keep things tidy. | เก็บของให้เป็นระเบียบอยู่เสมอ |
| 116 | - | Often forget things. | ขี้ลืม |

### C3 — Dutifulness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 27 | + | Keep my promises. | รักษาสัญญาที่ให้ไว้เสมอ |
| 57 | - | Misrepresent the facts. | มักจะบิดเบือนข้อมูลหรือความจริง |
| 87 | + | Tell the truth. | พูดความจริงเสมอ |
| 117 | + | Stick to the rules. | ปฏิบัติตามกฎอย่างเคร่งครัด |

### C4 — Achievement-Striving
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 28 | + | Work hard. | ทำงานหนัก |
| 58 | - | Do just enough work to get by. | ทำงานแค่พอให้ผ่านๆ ไป |
| 88 | + | Turn plans into actions. | เปลี่ยนแผนการให้กลายเป็นการลงมือทำจริง |
| 118 | + | Try to do my best at everything. | พยายามตระเตรียมและทำทุกอย่างให้ดีที่สุดเสมอ |

### C5 — Self-Discipline
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 29 | + | Get chores done right away. | ทำงานบ้านต่างๆ ให้เสร็จโดยทันที |
| 59 | - | Find it difficult to get down to work. | พบว่ายากที่จะตั้งใจทำงานอย่างจริงจัง |
| 89 | + | Start tasks right away. | เริ่มงานในทันทีโดยไม่ผลัดวันประกันพรุ่ง |
| 119 | + | Plunge into tasks with all my heart. | ทุ่มเทให้กับงานอย่างสุดหัวใจ |

### C6 — Cautiousness
| ID | Keying | English Text | Thai Text |
|----|--------|--------------|-----------|
| 30 | + | Avoid mistakes. | หลีกเลี่ยงความผิดพลาด |
| 60 | - | Act without thinking. | ทำสิ่งต่างๆ โดยไม่คิดชั่งใจ |
| 90 | + | Choose my words with care. | เลือกใช้คำพูดอย่างระมัดระวัง |
| 120 | + | Like to think things over before making decisions. | ชอบคิดทบทวนสิ่งต่างๆ ก่อนตัดสินใจ |

---

## Facet → Domain Mapping

| Facet Codes | Domain |
|-------------|--------|
| N1, N2, N3, N4, N5, N6 | N (Neuroticism) |
| E1, E2, E3, E4, E5, E6 | E (Extraversion) |
| O1, O2, O3, O4, O5, O6 | O (Openness) |
| A1, A2, A3, A4, A5, A6 | A (Agreeableness) |
| C1, C2, C3, C4, C5, C6 | C (Conscientiousness) |

---

## Sources

- Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory. *Journal of Research in Personality*, 51, 78-89.
- Goldberg, L. R. et al. (2006). The international personality item pool and the future of public-domain personality measures. *Journal of Research in Personality*, 40, 84-96.
- IPIP website: https://ipip.ori.org
- Thai 50-item translation: Yomaboot, P. & Cooper, A. J. https://ipip.ori.org/Thai50-itemNEO-PI-R-Domains.htm
