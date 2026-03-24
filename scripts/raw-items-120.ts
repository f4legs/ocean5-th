// IPIP-NEO-120 raw English item data
// Source: https://ipip.ori.org/30FacetNEO-PI-RItems.htm
// Johnson (2014) — 30 facets × 4 items = 120 items
// reverse: true = item is reverse-keyed (score = 6 - response)

export type FacetCode =
  | 'N1' | 'N2' | 'N3' | 'N4' | 'N5' | 'N6'
  | 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6'
  | 'O1' | 'O2' | 'O3' | 'O4' | 'O5' | 'O6'
  | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6'
  | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6'

export type Factor = 'N' | 'E' | 'O' | 'A' | 'C'

export interface RawItem120 {
  id: number
  en: string
  facet: FacetCode
  facetName: string
  factor: Factor
  reverse: boolean
}

export const rawItems120: RawItem120[] = [
  // ── N1: Anxiety ──────────────────────────────────────────
  { id: 1,  en: 'Worry about things.',                        facet: 'N1', facetName: 'Anxiety',              factor: 'N', reverse: false },
  { id: 31, en: 'Am not easily bothered by things.',          facet: 'N1', facetName: 'Anxiety',              factor: 'N', reverse: true  },
  { id: 61, en: 'Fear for the worst.',                        facet: 'N1', facetName: 'Anxiety',              factor: 'N', reverse: false },
  { id: 91, en: 'Am afraid of many things.',                  facet: 'N1', facetName: 'Anxiety',              factor: 'N', reverse: false },

  // ── N2: Anger ─────────────────────────────────────────────
  { id: 2,  en: 'Get angry easily.',                          facet: 'N2', facetName: 'Anger',                factor: 'N', reverse: false },
  { id: 32, en: 'Rarely get irritated.',                      facet: 'N2', facetName: 'Anger',                factor: 'N', reverse: true  },
  { id: 62, en: 'Get upset easily.',                          facet: 'N2', facetName: 'Anger',                factor: 'N', reverse: false },
  { id: 92, en: 'Am filled with doubts about things.',        facet: 'N2', facetName: 'Anger',                factor: 'N', reverse: false },

  // ── N3: Depression ────────────────────────────────────────
  { id: 3,  en: 'Often feel blue.',                           facet: 'N3', facetName: 'Depression',           factor: 'N', reverse: false },
  { id: 33, en: 'Feel comfortable with myself.',              facet: 'N3', facetName: 'Depression',           factor: 'N', reverse: true  },
  { id: 63, en: 'Dislike myself.',                            facet: 'N3', facetName: 'Depression',           factor: 'N', reverse: false },
  { id: 93, en: 'Have frequent mood swings.',                 facet: 'N3', facetName: 'Depression',           factor: 'N', reverse: false },

  // ── N4: Self-Consciousness ────────────────────────────────
  { id: 4,  en: 'Am easily embarrassed.',                     facet: 'N4', facetName: 'Self-Consciousness',   factor: 'N', reverse: false },
  { id: 34, en: 'Am not embarrassed easily.',                 facet: 'N4', facetName: 'Self-Consciousness',   factor: 'N', reverse: true  },
  { id: 64, en: 'Find it difficult to approach others.',      facet: 'N4', facetName: 'Self-Consciousness',   factor: 'N', reverse: false },
  { id: 94, en: 'Am afraid that I will do the wrong thing.',  facet: 'N4', facetName: 'Self-Consciousness',   factor: 'N', reverse: false },

  // ── N5: Immoderation ──────────────────────────────────────
  { id: 5,  en: 'Find it difficult to resist my cravings.',   facet: 'N5', facetName: 'Immoderation',         factor: 'N', reverse: false },
  { id: 35, en: 'Easily resist temptations.',                 facet: 'N5', facetName: 'Immoderation',         factor: 'N', reverse: true  },
  { id: 65, en: 'Love to eat.',                               facet: 'N5', facetName: 'Immoderation',         factor: 'N', reverse: false },
  { id: 95, en: 'Have trouble resisting my urges.',           facet: 'N5', facetName: 'Immoderation',         factor: 'N', reverse: false },

  // ── N6: Vulnerability ─────────────────────────────────────
  { id: 6,  en: 'Panic easily.',                              facet: 'N6', facetName: 'Vulnerability',        factor: 'N', reverse: false },
  { id: 36, en: 'Remain calm under pressure.',                facet: 'N6', facetName: 'Vulnerability',        factor: 'N', reverse: true  },
  { id: 66, en: 'Become overwhelmed by events.',              facet: 'N6', facetName: 'Vulnerability',        factor: 'N', reverse: false },
  { id: 96, en: "Feel that I'm unable to deal with things.",  facet: 'N6', facetName: 'Vulnerability',        factor: 'N', reverse: false },

  // ── E1: Friendliness ──────────────────────────────────────
  { id: 7,  en: 'Make friends easily.',                       facet: 'E1', facetName: 'Friendliness',         factor: 'E', reverse: false },
  { id: 37, en: 'Keep others at a distance.',                 facet: 'E1', facetName: 'Friendliness',         factor: 'E', reverse: true  },
  { id: 67, en: 'Warm up quickly to others.',                 facet: 'E1', facetName: 'Friendliness',         factor: 'E', reverse: false },
  { id: 97, en: 'Feel comfortable around people.',            facet: 'E1', facetName: 'Friendliness',         factor: 'E', reverse: false },

  // ── E2: Gregariousness ────────────────────────────────────
  { id: 8,  en: 'Love large parties.',                        facet: 'E2', facetName: 'Gregariousness',       factor: 'E', reverse: false },
  { id: 38, en: 'Avoid crowds.',                              facet: 'E2', facetName: 'Gregariousness',       factor: 'E', reverse: true  },
  { id: 68, en: 'Talk to a lot of different people at parties.', facet: 'E2', facetName: 'Gregariousness',   factor: 'E', reverse: false },
  { id: 98, en: 'Prefer to be alone.',                        facet: 'E2', facetName: 'Gregariousness',       factor: 'E', reverse: true  },

  // ── E3: Assertiveness ─────────────────────────────────────
  { id: 9,  en: 'Take charge.',                               facet: 'E3', facetName: 'Assertiveness',        factor: 'E', reverse: false },
  { id: 39, en: 'Wait for others to lead the way.',           facet: 'E3', facetName: 'Assertiveness',        factor: 'E', reverse: true  },
  { id: 69, en: 'Speak up for myself.',                       facet: 'E3', facetName: 'Assertiveness',        factor: 'E', reverse: false },
  { id: 99, en: 'Am not very assertive.',                     facet: 'E3', facetName: 'Assertiveness',        factor: 'E', reverse: true  },

  // ── E4: Activity Level ────────────────────────────────────
  { id: 10,  en: 'Am always busy.',                           facet: 'E4', facetName: 'Activity Level',       factor: 'E', reverse: false },
  { id: 40,  en: 'Like to take it easy.',                     facet: 'E4', facetName: 'Activity Level',       factor: 'E', reverse: true  },
  { id: 70,  en: 'Am always on the go.',                      facet: 'E4', facetName: 'Activity Level',       factor: 'E', reverse: false },
  { id: 100, en: 'Do a lot in my spare time.',                facet: 'E4', facetName: 'Activity Level',       factor: 'E', reverse: false },

  // ── E5: Excitement-Seeking ────────────────────────────────
  { id: 11,  en: 'Love excitement.',                          facet: 'E5', facetName: 'Excitement-Seeking',   factor: 'E', reverse: false },
  { id: 41,  en: 'Dislike loud music.',                       facet: 'E5', facetName: 'Excitement-Seeking',   factor: 'E', reverse: true  },
  { id: 71,  en: 'Seek adventure.',                           facet: 'E5', facetName: 'Excitement-Seeking',   factor: 'E', reverse: false },
  { id: 101, en: 'Enjoy being part of a loud crowd.',         facet: 'E5', facetName: 'Excitement-Seeking',   factor: 'E', reverse: false },

  // ── E6: Cheerfulness ──────────────────────────────────────
  { id: 12,  en: 'Radiate joy.',                              facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false },
  { id: 42,  en: 'Am not easily amused.',                     facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: true  },
  { id: 72,  en: 'Have a lot of fun.',                        facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false },
  { id: 102, en: 'Express childlike joy.',                    facet: 'E6', facetName: 'Cheerfulness',         factor: 'E', reverse: false },

  // ── O1: Imagination ───────────────────────────────────────
  { id: 13,  en: 'Have a vivid imagination.',                 facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false },
  { id: 43,  en: 'Seldom daydream.',                          facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: true  },
  { id: 73,  en: 'Love to daydream.',                         facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false },
  { id: 103, en: 'Enjoy wild flights of fantasy.',            facet: 'O1', facetName: 'Imagination',          factor: 'O', reverse: false },

  // ── O2: Artistic Interests ────────────────────────────────
  { id: 14,  en: 'Believe in the importance of art.',         facet: 'O2', facetName: 'Artistic Interests',   factor: 'O', reverse: false },
  { id: 44,  en: 'Do not like art.',                          facet: 'O2', facetName: 'Artistic Interests',   factor: 'O', reverse: true  },
  { id: 74,  en: 'See beauty in things that others might not notice.', facet: 'O2', facetName: 'Artistic Interests', factor: 'O', reverse: false },
  { id: 104, en: 'Love to read challenging material.',        facet: 'O2', facetName: 'Artistic Interests',   factor: 'O', reverse: false },

  // ── O3: Emotionality ──────────────────────────────────────
  { id: 15,  en: 'Experience my emotions intensely.',         facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false },
  { id: 45,  en: "Don't understand people who get emotional.", facet: 'O3', facetName: 'Emotionality',        factor: 'O', reverse: true  },
  { id: 75,  en: 'Am passionate about causes.',               facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false },
  { id: 105, en: "Feel others' emotions.",                    facet: 'O3', facetName: 'Emotionality',         factor: 'O', reverse: false },

  // ── O4: Adventurousness ───────────────────────────────────
  { id: 16,  en: 'Prefer variety to routine.',                facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false },
  { id: 46,  en: 'Prefer to stick with things that I know.',  facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: true  },
  { id: 76,  en: 'Like to visit new places.',                 facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false },
  { id: 106, en: 'Am interested in many things.',             facet: 'O4', facetName: 'Adventurousness',      factor: 'O', reverse: false },

  // ── O5: Intellect ─────────────────────────────────────────
  { id: 17,  en: 'Love to think up new ways of doing things.', facet: 'O5', facetName: 'Intellect',          factor: 'O', reverse: false },
  { id: 47,  en: 'Avoid philosophical discussions.',          facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: true  },
  { id: 77,  en: 'Enjoy thinking about things.',              facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false },
  { id: 107, en: 'Have a rich vocabulary.',                   facet: 'O5', facetName: 'Intellect',            factor: 'O', reverse: false },

  // ── O6: Liberalism ────────────────────────────────────────
  // Note: political items will be adapted during translation
  { id: 18,  en: 'Tend to vote for liberal political candidates.',     facet: 'O6', facetName: 'Liberalism', factor: 'O', reverse: false },
  { id: 48,  en: 'Tend to vote for conservative political candidates.', facet: 'O6', facetName: 'Liberalism', factor: 'O', reverse: true  },
  { id: 78,  en: 'Believe that there is no absolute right or wrong.',  facet: 'O6', facetName: 'Liberalism', factor: 'O', reverse: false },
  { id: 108, en: 'Feel that laws should be strictly enforced.',        facet: 'O6', facetName: 'Liberalism', factor: 'O', reverse: true  },

  // ── A1: Trust ─────────────────────────────────────────────
  { id: 19,  en: 'Trust others.',                             facet: 'A1', facetName: 'Trust',                factor: 'A', reverse: false },
  { id: 49,  en: 'Suspect hidden motives in others.',         facet: 'A1', facetName: 'Trust',                factor: 'A', reverse: true  },
  { id: 79,  en: 'Believe that others have good intentions.', facet: 'A1', facetName: 'Trust',                factor: 'A', reverse: false },
  { id: 109, en: 'Am wary of others.',                        facet: 'A1', facetName: 'Trust',                factor: 'A', reverse: true  },

  // ── A2: Morality ──────────────────────────────────────────
  { id: 20,  en: 'Use others for my own ends.',               facet: 'A2', facetName: 'Morality',             factor: 'A', reverse: true  },
  { id: 50,  en: 'Cheat to get ahead.',                       facet: 'A2', facetName: 'Morality',             factor: 'A', reverse: true  },
  { id: 80,  en: 'Pretend to be more than I am.',             facet: 'A2', facetName: 'Morality',             factor: 'A', reverse: true  },
  { id: 110, en: 'Take advantage of others.',                 facet: 'A2', facetName: 'Morality',             factor: 'A', reverse: true  },

  // ── A3: Altruism ──────────────────────────────────────────
  { id: 21,  en: 'Make people feel welcome.',                 facet: 'A3', facetName: 'Altruism',             factor: 'A', reverse: false },
  { id: 51,  en: 'Am indifferent to the feelings of others.', facet: 'A3', facetName: 'Altruism',             factor: 'A', reverse: true  },
  { id: 81,  en: 'Anticipate the needs of others.',           facet: 'A3', facetName: 'Altruism',             factor: 'A', reverse: false },
  { id: 111, en: 'Love to help others.',                      facet: 'A3', facetName: 'Altruism',             factor: 'A', reverse: false },

  // ── A4: Cooperation ───────────────────────────────────────
  { id: 22,  en: "Can't stand confrontation.",                facet: 'A4', facetName: 'Cooperation',          factor: 'A', reverse: false },
  { id: 52,  en: 'Love a good fight.',                        facet: 'A4', facetName: 'Cooperation',          factor: 'A', reverse: true  },
  { id: 82,  en: 'Hate to seem pushy.',                       facet: 'A4', facetName: 'Cooperation',          factor: 'A', reverse: false },
  { id: 112, en: 'Am easy to satisfy.',                       facet: 'A4', facetName: 'Cooperation',          factor: 'A', reverse: false },

  // ── A5: Modesty ───────────────────────────────────────────
  { id: 23,  en: 'Dislike being the center of attention.',    facet: 'A5', facetName: 'Modesty',              factor: 'A', reverse: false },
  { id: 53,  en: 'Think highly of myself.',                   facet: 'A5', facetName: 'Modesty',              factor: 'A', reverse: true  },
  { id: 83,  en: 'Boast about my virtues.',                   facet: 'A5', facetName: 'Modesty',              factor: 'A', reverse: true  },
  { id: 113, en: 'Have a high opinion of myself.',            facet: 'A5', facetName: 'Modesty',              factor: 'A', reverse: true  },

  // ── A6: Sympathy ──────────────────────────────────────────
  { id: 24,  en: 'Sympathize with the homeless.',             facet: 'A6', facetName: 'Sympathy',             factor: 'A', reverse: false },
  { id: 54,  en: "Am not interested in other people's problems.", facet: 'A6', facetName: 'Sympathy',        factor: 'A', reverse: true  },
  { id: 84,  en: 'Feel sympathy for those who are worse off than myself.', facet: 'A6', facetName: 'Sympathy', factor: 'A', reverse: false },
  { id: 114, en: 'Value cooperation over competition.',       facet: 'A6', facetName: 'Sympathy',             factor: 'A', reverse: false },

  // ── C1: Self-Efficacy ─────────────────────────────────────
  { id: 25,  en: 'Complete tasks successfully.',              facet: 'C1', facetName: 'Self-Efficacy',        factor: 'C', reverse: false },
  { id: 55,  en: 'Often forget to put things back in their proper place.', facet: 'C1', facetName: 'Self-Efficacy', factor: 'C', reverse: true },
  { id: 85,  en: 'Come up with good solutions.',              facet: 'C1', facetName: 'Self-Efficacy',        factor: 'C', reverse: false },
  { id: 115, en: 'Know how to get things done.',              facet: 'C1', facetName: 'Self-Efficacy',        factor: 'C', reverse: false },

  // ── C2: Orderliness ───────────────────────────────────────
  { id: 26,  en: 'Like order.',                               facet: 'C2', facetName: 'Orderliness',          factor: 'C', reverse: false },
  { id: 56,  en: 'Leave a mess in my room.',                  facet: 'C2', facetName: 'Orderliness',          factor: 'C', reverse: true  },
  { id: 86,  en: 'Keep things tidy.',                         facet: 'C2', facetName: 'Orderliness',          factor: 'C', reverse: false },
  { id: 116, en: 'Often forget things.',                      facet: 'C2', facetName: 'Orderliness',          factor: 'C', reverse: true  },

  // ── C3: Dutifulness ───────────────────────────────────────
  { id: 27,  en: 'Keep my promises.',                         facet: 'C3', facetName: 'Dutifulness',          factor: 'C', reverse: false },
  { id: 57,  en: 'Misrepresent the facts.',                   facet: 'C3', facetName: 'Dutifulness',          factor: 'C', reverse: true  },
  { id: 87,  en: 'Tell the truth.',                           facet: 'C3', facetName: 'Dutifulness',          factor: 'C', reverse: false },
  { id: 117, en: 'Stick to the rules.',                       facet: 'C3', facetName: 'Dutifulness',          factor: 'C', reverse: false },

  // ── C4: Achievement-Striving ──────────────────────────────
  { id: 28,  en: 'Work hard.',                                facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false },
  { id: 58,  en: 'Do just enough work to get by.',            facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: true  },
  { id: 88,  en: 'Turn plans into actions.',                  facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false },
  { id: 118, en: 'Try to do my best at everything.',          facet: 'C4', facetName: 'Achievement-Striving', factor: 'C', reverse: false },

  // ── C5: Self-Discipline ───────────────────────────────────
  { id: 29,  en: 'Get chores done right away.',               facet: 'C5', facetName: 'Self-Discipline',      factor: 'C', reverse: false },
  { id: 59,  en: 'Find it difficult to get down to work.',    facet: 'C5', facetName: 'Self-Discipline',      factor: 'C', reverse: true  },
  { id: 89,  en: 'Start tasks right away.',                   facet: 'C5', facetName: 'Self-Discipline',      factor: 'C', reverse: false },
  { id: 119, en: 'Plunge into tasks with all my heart.',      facet: 'C5', facetName: 'Self-Discipline',      factor: 'C', reverse: false },

  // ── C6: Cautiousness ──────────────────────────────────────
  { id: 30,  en: 'Avoid mistakes.',                           facet: 'C6', facetName: 'Cautiousness',         factor: 'C', reverse: false },
  { id: 60,  en: 'Act without thinking.',                     facet: 'C6', facetName: 'Cautiousness',         factor: 'C', reverse: true  },
  { id: 90,  en: 'Choose my words with care.',                facet: 'C6', facetName: 'Cautiousness',         factor: 'C', reverse: false },
  { id: 120, en: 'Like to think things over before making decisions.', facet: 'C6', facetName: 'Cautiousness', factor: 'C', reverse: false },
]
