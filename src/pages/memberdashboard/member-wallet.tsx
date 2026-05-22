import { useEffect, useState, useRef } from 'react'
import {
  getMyWallet,
  getMyTransactions,
  getPaymentChannels,
  requestTopUp,
  uploadPaymentReceipt,
  type MemberWallet,
  type WalletTransaction,
  type WalletPaymentChannel,
  type PaymentChannelId,
} from '@services/walletService'
import { INFINITY_COIN, formatCoins } from '@lib/infinityCoin'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Coins, History, ArrowUpCircle, QrCode } from 'lucide-react'

const txLabel: Record<string, string> = {
  top_up_request: 'Top-up request',
  top_up: 'Top-up',
  purchase: 'Purchase',
  refund: 'Refund',
  adjustment: 'Adjustment',
}

export function MemberWallet() {
  const [wallet, setWallet] = useState<MemberWallet | null>(null)
  const [channels, setChannels] = useState<WalletPaymentChannel[]>([])
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [requestingTopUp, setRequestingTopUp] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [selectedChannel, setSelectedChannel] = useState<PaymentChannelId>('gcash')
  const [topUpAmount, setTopUpAmount] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [topUpNotes, setTopUpNotes] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const receiptRef = useRef<HTMLInputElement>(null)

  const activeChannel = channels.find(c => c.id === selectedChannel)

  async function load() {
    try {
      const [w, txs, ch] = await Promise.all([
        getMyWallet(),
        getMyTransactions(),
        getPaymentChannels(true),
      ])
      setWallet(w)
      setTransactions(txs)
      setChannels(ch)
      if (ch.length > 0 && !ch.find(c => c.id === selectedChannel)) {
        setSelectedChannel(ch[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  async function handleTopUpRequest(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(topUpAmount)
    const ref = referenceNumber.trim()

    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid coin amount.' })
      return
    }
    if (!ref) {
      setMessage({ type: 'error', text: 'Enter the reference number from your payment receipt.' })
      return
    }
    if (!channels.some(c => c.id === selectedChannel)) {
      setMessage({ type: 'error', text: 'Select a payment method.' })
      return
    }

    setRequestingTopUp(true)
    setMessage(null)

    try {
      let receiptUrl: string | undefined
      if (receiptFile) receiptUrl = await uploadPaymentReceipt(receiptFile)

      await requestTopUp({
        amount,
        referenceNumber: ref,
        paymentChannel: selectedChannel,
        receiptUrl,
        notes: topUpNotes || undefined,
      })

      setTopUpAmount('')
      setReferenceNumber('')
      setTopUpNotes('')
      setReceiptFile(null)
      setReceiptPreview(null)
      if (receiptRef.current) receiptRef.current.value = ''

      setMessage({
        type: 'success',
        text: 'Top-up submitted. Super Admin will verify your reference number and credit your wallet.',
      })
      await load()
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not submit request',
      })
    } finally {
      setRequestingTopUp(false)
    }
  }

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading wallet...</p>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pay via QR, submit your receipt reference, and receive {INFINITY_COIN.NAME}
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border bg-gradient-to-br from-primary/10 to-primary/5 p-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {INFINITY_COIN.NAME}
          </p>
          <p className="text-3xl font-bold text-primary mt-1">
            {formatCoins(wallet?.coin_balance ?? 0)}
          </p>
        </div>
        <Coins className="h-14 w-14 text-primary/40" />
      </div>

      <section className="rounded-2xl border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Top up with payment</h2>
        </div>

        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Payment methods are not configured yet. Please check back later.
          </p>
        ) : (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Payment method</label>
              <select
                value={selectedChannel}
                onChange={e => setSelectedChannel(e.target.value as PaymentChannelId)}
                className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
              >
                {channels.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {activeChannel && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <QrCode className="h-4 w-4 text-primary" />
                  Scan to pay — {activeChannel.label}
                </div>

                {activeChannel.qr_image_url ? (
                  <img
                    src={activeChannel.qr_image_url}
                    alt={`${activeChannel.label} QR`}
                    className="mx-auto max-w-[220px] rounded-xl border bg-white p-2"
                  />
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    QR code not uploaded yet. Use the account details below or ask admin.
                  </p>
                )}

                {(activeChannel.account_name || activeChannel.account_number) && (
                  <div className="text-sm space-y-1">
                    {activeChannel.account_name && (
                      <p>
                        <span className="text-muted-foreground">Name: </span>
                        {activeChannel.account_name}
                      </p>
                    )}
                    {activeChannel.account_number && (
                      <p>
                        <span className="text-muted-foreground">Account: </span>
                        <span className="font-mono font-medium">{activeChannel.account_number}</span>
                      </p>
                    )}
                  </div>
                )}

                {activeChannel.instructions && (
                  <p className="text-xs text-muted-foreground">{activeChannel.instructions}</p>
                )}
              </div>
            )}

            <form onSubmit={handleTopUpRequest} className="space-y-3 border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground">
                After paying, submit your receipt details for Super Admin verification.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  label="Coins to request"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  placeholder="e.g. 500"
                />
                <Input
                  label="Reference number *"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="From GCash / bank receipt"
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1">Receipt screenshot (optional)</label>
                <div
                  onClick={() => receiptRef.current?.click()}
                  className="border border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/30 text-center text-sm text-muted-foreground"
                >
                  <input
                    ref={receiptRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleReceiptChange}
                  />
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Receipt" className="mx-auto max-h-32 rounded" />
                  ) : (
                    'Upload payment receipt image'
                  )}
                </div>
              </div>

              <Input
                label="Notes (optional)"
                value={topUpNotes}
                onChange={e => setTopUpNotes(e.target.value)}
                placeholder="Extra details for admin"
              />

              <Button type="submit" loading={requestingTopUp} className="w-full sm:w-auto">
                Submit for verification
              </Button>
            </form>
          </>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Transaction history</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y">
            {transactions.map(tx => (
              <li key={tx.id} className="py-3 flex justify-between items-start gap-4 text-sm">
                <div>
                  <p className="font-medium">{txLabel[tx.type] ?? tx.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                  {tx.reference_number && (
                    <p className="text-xs font-mono mt-1">Ref: {tx.reference_number}</p>
                  )}
                  {tx.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5">{tx.notes}</p>
                  )}
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      tx.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : tx.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
                <p
                  className={`font-semibold shrink-0 ${
                    tx.amount >= 0 ? 'text-green-600' : 'text-foreground'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : ''}
                  {formatCoins(Math.abs(tx.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
