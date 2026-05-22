import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@hooks/useAuth'
import { SUPER_ADMIN_EMAIL } from '@lib/constants'
import {
  getPendingTopUps,
  getAllPaymentChannelsForAdmin,
  updatePaymentChannel,
  uploadPaymentQr,
  reviewTopUp,
  type WalletTransaction,
  type WalletPaymentChannel,
  type PaymentChannelId,
} from '@services/walletService'
import { formatCoins, INFINITY_COIN } from '@lib/infinityCoin'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import {
  Coins,
  CheckCircle2,
  XCircle,
  Shield,
  QrCode,
  ClipboardList,
  ExternalLink,
} from 'lucide-react'

const CHANNEL_LABELS: Record<PaymentChannelId, string> = {
  gcash: 'GCash',
  bank_transfer: 'Bank transfer',
  paypal: 'PayPal',
  other: 'Other',
}

export function AdminWallet() {
  const { user } = useAuth()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const [activeTab, setActiveTab] = useState<'verify' | 'setup'>('verify')
  const [pending, setPending] = useState<WalletTransaction[]>([])
  const [channels, setChannels] = useState<WalletPaymentChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [setupChannel, setSetupChannel] = useState<PaymentChannelId>('gcash')
  const [savingChannel, setSavingChannel] = useState(false)
  const [channelForm, setChannelForm] = useState({
    account_name: '',
    account_number: '',
    instructions: '',
    is_active: true,
    qr_image_url: '',
  })
  const qrFileRef = useRef<HTMLInputElement>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)

  async function load() {
    try {
      const [p, c] = await Promise.all([getPendingTopUps(), getAllPaymentChannelsForAdmin()])
      setPending(p)
      setChannels(c)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const ch = channels.find(c => c.id === setupChannel)
    if (ch) {
      setChannelForm({
        account_name: ch.account_name || '',
        account_number: ch.account_number || '',
        instructions: ch.instructions || '',
        is_active: ch.is_active,
        qr_image_url: ch.qr_image_url || '',
      })
      setQrPreview(ch.qr_image_url || null)
      setQrFile(null)
    }
  }, [setupChannel, channels])

  async function handleReview(id: string, approve: boolean) {
    setReviewingId(id)
    try {
      await reviewTopUp(id, approve)
      setPending(prev => prev.filter(t => t.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setReviewingId(null)
    }
  }

  async function handleSaveChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!isSuperAdmin) return
    setSavingChannel(true)
    try {
      let qr_image_url = channelForm.qr_image_url || undefined
      if (qrFile) qr_image_url = await uploadPaymentQr(qrFile)

      const updated = await updatePaymentChannel(setupChannel, {
        account_name: channelForm.account_name,
        account_number: channelForm.account_number,
        instructions: channelForm.instructions,
        is_active: channelForm.is_active,
        qr_image_url: qr_image_url ?? null,
      })
      setChannels(prev => prev.map(c => (c.id === setupChannel ? updated : c)))
      setQrFile(null)
      alert('Payment channel saved.')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSavingChannel(false)
    }
  }

  function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setQrFile(file)
    setQrPreview(URL.createObjectURL(file))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{INFINITY_COIN.NAME} wallet</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Verify member payments and manage QR payment setup (Super Admin only)
        </p>
      </div>

      <div className="flex border-b">
        {[
          { id: 'verify' as const, label: 'Verify payments', icon: ClipboardList },
          { id: 'setup' as const, label: 'Payment setup', icon: QrCode },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'verify' && pending.length > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {!isSuperAdmin && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
          <Shield className="h-4 w-4 shrink-0" />
          Only the Super Admin can verify reference numbers and edit payment QR codes.
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading...</p>
      ) : activeTab === 'verify' ? (
        pending.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
            <Coins className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">No pending top-up requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pending.map(tx => (
              <div
                key={tx.id}
                className="border rounded-2xl bg-card p-5 flex flex-col lg:flex-row gap-6"
              >
                <div className="flex-1 space-y-3">
                  <p className="font-bold text-xl text-primary">{formatCoins(tx.amount)}</p>
                  {tx.profiles && (
                    <p className="text-sm">
                      {tx.profiles.first_name} {tx.profiles.last_name}
                      <span className="text-muted-foreground"> · {tx.profiles.email}</span>
                    </p>
                  )}
                  <div className="rounded-xl bg-muted/50 border p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Reference number (verify on receipt)
                    </p>
                    <p className="font-mono text-lg font-bold tracking-wide">{tx.reference_number}</p>
                    {tx.payment_channel && (
                      <p className="text-xs text-muted-foreground">
                        Paid via: {CHANNEL_LABELS[tx.payment_channel as PaymentChannelId] ?? tx.payment_channel}
                      </p>
                    )}
                  </div>
                  {tx.notes && (
                    <p className="text-xs text-muted-foreground border-l-2 pl-2">{tx.notes}</p>
                  )}
                  {tx.receipt_image_url && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">
                        Payment receipt
                      </p>
                      <a
                        href={tx.receipt_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" /> View receipt image
                      </a>
                      <img
                        src={tx.receipt_image_url}
                        alt="Receipt"
                        className="mt-2 max-h-48 rounded-lg border object-contain"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>

                {isSuperAdmin && (
                  <div className="flex flex-col gap-2 lg:min-w-[140px]">
                    <Button
                      className="gap-1.5"
                      disabled={reviewingId === tx.id}
                      loading={reviewingId === tx.id}
                      onClick={() => handleReview(tx.id, true)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirm & credit
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-1.5 text-red-600 hover:border-red-200"
                      disabled={reviewingId === tx.id}
                      onClick={() => handleReview(tx.id, false)}
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : !isSuperAdmin ? (
        <div className="py-16 text-center border-2 border-dashed rounded-2xl bg-muted/20">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">Payment QR setup is restricted to Super Admin.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[200px_1fr] gap-6">
          <div className="flex lg:flex-col gap-2 flex-wrap">
            {(Object.keys(CHANNEL_LABELS) as PaymentChannelId[]).map(id => (
              <button
                key={id}
                type="button"
                onClick={() => setSetupChannel(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  setupChannel === id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                {CHANNEL_LABELS[id]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveChannel} className="border rounded-2xl bg-card p-6 space-y-4">
            <h2 className="font-semibold">{CHANNEL_LABELS[setupChannel]} setup</h2>
            <p className="text-xs text-muted-foreground">
              Members will scan this QR and pay before submitting their reference number.
            </p>

            <Input
              label="Account name"
              value={channelForm.account_name}
              onChange={e => setChannelForm(f => ({ ...f, account_name: e.target.value }))}
              placeholder="e.g. Infinity 8K Corp"
            />
            <Input
              label="Account / mobile number"
              value={channelForm.account_number}
              onChange={e => setChannelForm(f => ({ ...f, account_number: e.target.value }))}
              placeholder="09XX XXX XXXX"
            />

            <div>
              <label className="text-sm font-medium block mb-1">QR code image</label>
              <div
                onClick={() => qrFileRef.current?.click()}
                className="border border-dashed rounded-xl p-4 cursor-pointer hover:bg-muted/30 text-center"
              >
                <input
                  ref={qrFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleQrChange}
                />
                {qrPreview ? (
                  <img src={qrPreview} alt="QR" className="mx-auto max-h-48 rounded-lg" />
                ) : (
                  <p className="text-sm text-muted-foreground">Click to upload GCash / payment QR</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Instructions for members</label>
              <textarea
                value={channelForm.instructions}
                onChange={e => setChannelForm(f => ({ ...f, instructions: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={channelForm.is_active}
                onChange={e => setChannelForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              Active (visible to members)
            </label>

            <Button type="submit" loading={savingChannel}>
              Save {CHANNEL_LABELS[setupChannel]}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
