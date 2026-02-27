'use client'

import Card from '@/components/ui/Card'
import { THEME_PATTERNS, DEFAULT_THEME } from '@/lib/constants'
import { RotateCcw } from 'lucide-react'

interface ThemeCustomizerProps {
  accent: string
  bg: string
  text: string
  pattern: string
  onAccentChange: (v: string) => void
  onBgChange: (v: string) => void
  onTextChange: (v: string) => void
  onPatternChange: (v: string) => void
}

export default function ThemeCustomizer({
  accent, bg, text, pattern,
  onAccentChange, onBgChange, onTextChange, onPatternChange,
}: ThemeCustomizerProps) {
  function reset() {
    onAccentChange(DEFAULT_THEME.accent)
    onBgChange(DEFAULT_THEME.bg)
    onTextChange(DEFAULT_THEME.text)
    onPatternChange(DEFAULT_THEME.pattern)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Profile Theme</h2>
        <button onClick={reset} className="text-sm text-muted hover:text-foreground flex items-center gap-1">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Preview */}
      <div
        className={`rounded-lg p-4 mb-4 border border-border ${pattern !== 'none' ? `pattern-${pattern}` : ''}`}
        style={{
          '--profile-accent': accent,
          '--profile-bg': bg,
          '--profile-text': text,
          background: bg,
          color: text,
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full" style={{ background: accent }} />
          <div>
            <div className="font-semibold" style={{ color: text }}>Your Name</div>
            <div className="text-xs" style={{ color: `${text}80` }}>Your headline</div>
          </div>
        </div>
        <div className="text-sm" style={{ color: `${text}cc` }}>
          This is how your profile will look with these theme settings.
        </div>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-muted mb-1">Accent color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={accent} onChange={e => onAccentChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <input type="text" value={accent} onChange={e => onAccentChange(e.target.value)} className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Background</label>
          <div className="flex items-center gap-2">
            <input type="color" value={bg} onChange={e => onBgChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <input type="text" value={bg} onChange={e => onBgChange(e.target.value)} className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Text color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={text} onChange={e => onTextChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <input type="text" value={text} onChange={e => onTextChange(e.target.value)} className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs font-mono" />
          </div>
        </div>
      </div>

      {/* Pattern selector */}
      <div>
        <label className="block text-xs text-muted mb-2">Background pattern</label>
        <div className="flex gap-2 flex-wrap">
          {THEME_PATTERNS.map(p => (
            <button
              key={p.value}
              onClick={() => onPatternChange(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                pattern === p.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted hover:text-foreground'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="mt-4">
        <label className="block text-xs text-muted mb-2">Quick presets</label>
        <div className="flex gap-2 flex-wrap">
          {[
            { name: 'Gold', accent: '#D4A843', bg: '#0f0f0f', text: '#ededed' },
            { name: 'Maroon', accent: '#8B0000', bg: '#1a0505', text: '#f5e6e6' },
            { name: 'Ocean', accent: '#0ea5e9', bg: '#0c1222', text: '#e2e8f0' },
            { name: 'Forest', accent: '#22c55e', bg: '#0a1a0a', text: '#dcfce7' },
            { name: 'Sunset', accent: '#f97316', bg: '#1a0f05', text: '#fff7ed' },
            { name: 'Royal', accent: '#8b5cf6', bg: '#0f0a1a', text: '#ede9fe' },
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => {
                onAccentChange(preset.accent)
                onBgChange(preset.bg)
                onTextChange(preset.text)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border hover:border-accent/50 transition-colors"
            >
              <div className="w-3 h-3 rounded-full" style={{ background: preset.accent }} />
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
