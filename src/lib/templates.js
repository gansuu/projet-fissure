// Modèles d'habitudes prêts à l'emploi (pré-remplissent le formulaire)
export const TEMPLATES = [
  { name: 'Muscu', emoji: '💪', kind: 'check', unit: '', target_value: 4, target_period: 'week' },
  { name: 'Pas', emoji: '👟', kind: 'count', unit: 'pas', target_value: 10000, target_period: 'day' },
  { name: 'Eau', emoji: '💧', kind: 'count', unit: 'verres', target_value: 8, target_period: 'day' },
  { name: 'Sommeil', emoji: '😴', kind: 'duration', unit: 'min', target_value: 450, target_period: 'day' },
  { name: 'Lecture', emoji: '📖', kind: 'duration', unit: 'min', target_value: 20, target_period: 'day' },
  { name: 'Course', emoji: '🏃', kind: 'duration', unit: 'min', target_value: 90, target_period: 'week' },
  { name: 'Méditation', emoji: '🧘', kind: 'check', unit: '', target_value: 1, target_period: 'day' },
]

export const EMOJI_CHOICES = ['💪', '👟', '💧', '😴', '📖', '🏃', '🧘', '🚴', '🏊', '🥗', '🎯', '🔥', '⚡', '🧠', '🎸', '✍️']
export const AVATAR_CHOICES = ['💪', '🔥', '⚡', '🦁', '🐺', '🦊', '🐻', '🦅', '🚀', '🎯', '🧠', '😎']
