/** Client-facing shapes for the student feed, mirroring the API contract. */

export type TrialStatusDto = {
  answered_before_signup: number
  answered_after_signup: number
  total_free_answered: number
  signup_required: boolean
  paywall_required: boolean
  subscription_active: boolean
  can_answer: boolean
}

export type FeedAlternativeDto = {
  id: string
  label: string
  text: string
  position: number
}

export type FeedQuestionDto = {
  id: string
  statement: string
  difficulty: 'facil' | 'media' | 'dificil'
  career: { id: string; name: string; slug: string }
  subject: { name: string } | null
  board: { name: string } | null
  source: {
    type: 'autoral' | 'prova_oficial'
    orgao: string | null
    cargo: string | null
    year: number | null
    reference: string | null
  } | null
  annulled: boolean
  answerKeyChanged: boolean
  alternatives: FeedAlternativeDto[]
  image_path?: string | null
}

export type FeedNextResponse = {
  question: FeedQuestionDto | null
  trial_status: TrialStatusDto
}

export type AnswerResponse = {
  is_correct: boolean
  correct_alternative_id: string
  general_comment: string | null
  selected_alternative_comment: string | null
  trial_status: TrialStatusDto
}
