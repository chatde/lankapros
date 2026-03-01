'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import { fetchExchangeRates } from '@/lib/economy/api'
import type { ExchangeRate } from '@/lib/economy/types'
import { TRACKED_CURRENCIES } from '@/lib/economy/constants'

export default function CurrencyConverter() {
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [amount, setAmount] = useState('1000')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [direction, setDirection] = useState<'to-lkr' | 'from-lkr'>('from-lkr')

  useEffect(() => {
    async function load() {
      const data = await fetchExchangeRates()
      setRates(data)
    }
    load()
  }, [])

  const rate = rates.find((r) => r.code === selectedCurrency)
  const numAmount = parseFloat(amount) || 0

  const result = rate
    ? direction === 'from-lkr'
      ? numAmount / rate.rate
      : numAmount * rate.rate
    : 0

  return (
    <Card>
      <p className="text-sm font-medium text-foreground mb-3">Currency Converter</p>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
            placeholder="Amount"
          />
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
          >
            {TRACKED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code.toUpperCase()}>
                {c.flag} {c.code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setDirection((d) => (d === 'from-lkr' ? 'to-lkr' : 'from-lkr'))}
          className="w-full text-center text-xs text-muted hover:text-accent transition-colors py-1"
        >
          {direction === 'from-lkr' ? `LKR → ${selectedCurrency}` : `${selectedCurrency} → LKR`}
          {' '}(tap to swap)
        </button>
        <div className="bg-background border border-border rounded-lg px-3 py-3 text-center">
          <p className="text-xs text-muted">
            {direction === 'from-lkr' ? selectedCurrency : 'LKR'}
          </p>
          <p className="text-xl font-bold text-accent">
            {direction === 'from-lkr' ? '' : 'Rs '}
            {result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Card>
  )
}
