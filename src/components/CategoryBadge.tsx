import { CATEGORY_LABELS, CATEGORY_COLORS, type Category } from '../types'
import { AlertTriangle, MessageSquarePlus, HelpCircle, MessageCircle } from 'lucide-react'

const ICONS = {
  complaint: AlertTriangle,
  request: MessageSquarePlus,
  question: HelpCircle,
  chat: MessageCircle,
}

interface Props {
  category: Category
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'sm' }: Props) {
  const Icon = ICONS[category]
  const color = CATEGORY_COLORS[category]
  const label = CATEGORY_LABELS[category]
  const padding = size === 'sm' ? '4px 8px' : '6px 12px'
  const fontSize = size === 'sm' ? '11px' : '13px'
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding,
      background: `${color}1a`,
      color,
      borderRadius: '6px',
      fontSize,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={iconSize} />
      {label}
    </span>
  )
}
