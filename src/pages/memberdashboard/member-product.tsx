import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getActiveProducts, type Product } from '@services/productService'
import { placeOrder } from '@services/orderService'
import type { CheckoutDetails } from '@services/orderService'
import {
  getMyWallet,
  getPaymentChannels,
  uploadPaymentReceipt,
} from '@services/walletService'
import { getProfile } from '@services/profileService'
import {
  effectiveCoinPrice,
  coinSavingsPercent,
  formatCoins,
  INFINITY_COIN,
} from '@lib/infinityCoin'
import type { WalletPaymentChannel } from '@services/walletService'
import { ROUTES } from '@lib/constants'
import { Button } from '@components/ui/Button'
import { Modal } from '@components/ui/Modal'
import { Input } from '@components/ui/Input'
import { supabase } from '@services/supabase'
import { Coins, ShoppingBag, CreditCard, Smartphone, Truck, Clock, QrCode, Copy, CheckCircle2, Image } from 'lucide-react'

type PayMode = 'standard' | 'coins'

export function MemberProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [coinBalance, setCoinBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [payMode, setPayMode] = useState<PayMode>('standard')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Checkout modal state ──
  type CheckoutStep = 'form' | 'confirm'
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('form')
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    deliveryNotes: '',
    paymentChannel: 'gcash' as CheckoutDetails['paymentChannel'],
  })
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [gcashChannel, setGcashChannel] = useState<WalletPaymentChannel | null>(null)
  const [gcashChannelLoading, setGcashChannelLoading] = useState(false)  
  const [copied, setCopied] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const receiptRef = useRef<HTMLInputElement>(null)

  const loadProducts = () =>
    Promise.all([getActiveProducts(), getMyWallet().catch(() => ({ coin_balance: 0 }))]).then(
      ([data, wallet]) => {
        setProducts(data)
        setCoinBalance(wallet.coin_balance)
        setQuantities(prev => {
          const next = { ...prev }
          for (const p of data) {
            if (next[p.id] == null) next[p.id] = 1
            else next[p.id] = Math.min(Math.max(1, next[p.id]), p.stock || 1)
          }
          return next
        })
      },
    )

  useEffect(() => {
    loadProducts().finally(() => setLoading(false))
  }, [])

  // Pre-fill user profile data and fetch GCash channel info when checkout modal opens
  useEffect(() => {
    if (!checkoutProduct) return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getProfile(user.id).then(profile => {
        if (!profile) return
        setCheckoutForm(prev => ({
          ...prev,
          fullName: prev.fullName || `${profile.first_name} ${profile.last_name}`.trim(),
          contactNumber: prev.contactNumber || profile.contacts || '',
        }))
      }).catch(() => {})
    })

    // Fetch active payment channels to get GCash QR / account details
    setGcashChannelLoading(true)
    getPaymentChannels(true)
      .then(channels => {
        const gcash = channels.find(c => c.id === 'gcash') ?? null
        setGcashChannel(gcash)
      })
      .catch(() => setGcashChannel(null))
      .finally(() => setGcashChannelLoading(false))
  }, [checkoutProduct])

  const setQuantity = (productId: string, value: number, maxStock: number) => {
    const qty = Math.min(Math.max(1, value), maxStock)
    setQuantities(prev => ({ ...prev, [productId]: qty }))
  }

  const handleBuy = async (product: Product) => {
    const qty = quantities[product.id] ?? 1
    const useCoins = payMode === 'coins'
    const unit = useCoins ? effectiveCoinPrice(product) : product.member_price
    const total = unit * qty

    if (useCoins && coinBalance < total) {
      setMessage({
        type: 'error',
        text: `Not enough ${INFINITY_COIN.NAME}. Need ${formatCoins(total)}, you have ${formatCoins(coinBalance)}.`,
      })
      return
    }

    if (useCoins) {
      // Coin mode: immediate purchase
      setBuyingId(product.id)
      setMessage(null)
      try {
        await placeOrder(product.id, qty, true)
        setMessage({
          type: 'success',
          text: `Order placed with ${formatCoins(total)} for ${qty}× ${product.name}.`,
        })
        await loadProducts()
      } catch (err: unknown) {
        const text =
          (err && typeof err === 'object' && 'message' in err && String(err.message)) ||
          'Could not place order. Please try again.'
        setMessage({ type: 'error', text })
      } finally {
        setBuyingId(null)
      }
    } else {
      // Standard mode: open checkout modal
      setCheckoutProduct(product)
      setCheckoutStep('form')
      setGcashChannel(null)
      setCopied(false)
      setReceiptFile(null)
      setReceiptPreview(null)
      if (receiptRef.current) receiptRef.current.value = ''
      setCheckoutForm({
        fullName: '',
        contactNumber: '',
        address: '',
        deliveryNotes: '',
        paymentChannel: 'gcash',
      })
    }
  }

  const handleCopyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback — silently ignore */ }
  }

  const handleContinueToConfirm = () => {
    console.log('[DEBUG] handleContinueToConfirm called', { checkoutForm })
    setCheckoutError(null)
    // Validate form before showing confirmation
    if (!checkoutForm.fullName.trim()) {
      setCheckoutError('Please enter your full name.')
      console.log('[DEBUG] validation failed: fullName')
      return
    }
    if (!checkoutForm.contactNumber.trim()) {
      setCheckoutError('Please enter your contact number.')
      console.log('[DEBUG] validation failed: contactNumber')
      return
    }
    if (!checkoutForm.address.trim()) {
      setCheckoutError('Please enter your delivery address.')
      console.log('[DEBUG] validation failed: address')
      return
    }
    console.log('[DEBUG] validation passed, setting checkoutStep to confirm')
    setCheckoutStep('confirm')
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    setReceiptPreview(URL.createObjectURL(file))
  }

  const handleConfirmOrder = async () => {
    const product = checkoutProduct
    if (!product) return

    const qty = quantities[product.id] ?? 1

    setBuyingId(product.id)
    setMessage(null)
    setCheckoutProduct(null)
    setCheckoutStep('form')

    try {
      // Upload receipt if provided
      let receiptUrl: string | undefined
      if (receiptFile) {
        receiptUrl = await uploadPaymentReceipt(receiptFile)
      }

      setReceiptFile(null)
      setReceiptPreview(null)
      if (receiptRef.current) receiptRef.current.value = ''

      await placeOrder(product.id, qty, false, {
        ...checkoutForm,
        receiptUrl,
      })

      setMessage({
        type: 'success',
        text: `Order placed for ${qty}× ${product.name}. Pending confirmation — payment is unpaid.`,
      })
      await loadProducts()
    } catch (err: unknown) {
      const text =
        (err && typeof err === 'object' && 'message' in err && String(err.message)) ||
        'Could not place order. Please try again.'
      setMessage({ type: 'error', text })
    } finally {
      setBuyingId(null)
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground text-sm">Loading products...</p>

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Storefront</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pay with pesos or {INFINITY_COIN.NAME} for a discount
          </p>
        </div>
        <Link
          to={ROUTES.MEMBER_WALLET}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm hover:bg-muted/50"
        >
          <Coins className="h-4 w-4 text-primary" />
          <span>
            Balance: <strong className="text-primary">{formatCoins(coinBalance)}</strong>
          </span>
        </Link>
      </div>

      <div className="mb-6 flex rounded-xl border p-1 bg-muted/30 w-fit">
        <button
          type="button"
          onClick={() => setPayMode('standard')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            payMode === 'standard' ? 'bg-card shadow-sm' : 'text-muted-foreground'
          }`}
        >
          Pay with ₱
        </button>
        <button
          type="button"
          onClick={() => setPayMode('coins')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            payMode === 'coins' ? 'bg-card shadow-sm' : 'text-muted-foreground'
          }`}
        >
          <Coins className="h-3.5 w-3.5 text-primary" />
          {INFINITY_COIN.SHORT}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">No products available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => {
            const qty = quantities[p.id] ?? 1
            const coinPrice = effectiveCoinPrice(p)
            const savings = coinSavingsPercent(p)
            const unitPrice = payMode === 'coins' ? coinPrice : p.member_price
            const lineTotal = unitPrice * qty
            const outOfStock = p.stock <= 0
            const isBuying = buyingId === p.id

            return (
              <div
                key={p.id}
                className="group border rounded-2xl overflow-hidden bg-card hover:shadow-md transition-all flex flex-col"
              >
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">No image</span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {p.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    High quality product from our exclusive collection.
                  </p>

                  <div className="mt-auto flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground mr-2">Regular</span>
                          <span className="text-sm line-through text-muted-foreground">₱{p.price.toLocaleString()}</span>
                        </div>
                        <span className={`text-xs ${p.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold uppercase text-primary tracking-wide">Member</span>
                        <span className="font-bold text-xl text-primary">₱{p.member_price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xs font-bold uppercase text-amber-700 tracking-wide flex items-center gap-1">
                          <Coins className="h-3 w-3" /> Coin
                        </span>
                        <span className="font-bold text-lg text-amber-700">{formatCoins(coinPrice)}</span>
                        {savings > 0 && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                            −{savings}%
                          </span>
                        )}
                      </div>
                    </div>

                    {!outOfStock && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Qty</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQuantity(p.id, qty - 1, p.stock)}
                            disabled={qty <= 1 || isBuying}
                            className="h-8 w-8 rounded-lg border text-sm hover:bg-muted disabled:opacity-40"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={p.stock}
                            value={qty}
                            disabled={isBuying}
                            onChange={e => setQuantity(p.id, Number(e.target.value) || 1, p.stock)}
                            className="h-8 w-12 rounded-lg border text-center text-sm bg-background"
                          />
                          <button
                            type="button"
                            onClick={() => setQuantity(p.id, qty + 1, p.stock)}
                            disabled={qty >= p.stock || isBuying}
                            className="h-8 w-8 rounded-lg border text-sm hover:bg-muted disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {payMode === 'coins' ? formatCoins(lineTotal) : `₱${lineTotal.toLocaleString()}`}
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={outOfStock || isBuying}
                      loading={isBuying}
                      onClick={() => handleBuy(p)}
                    >
                      {outOfStock
                        ? 'Out of stock'
                        : payMode === 'coins'
                          ? 'Buy with coins'
                          : 'Buy now'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Checkout Modal ── */}
      <Modal
        open={!!checkoutProduct}
        onClose={() => { setCheckoutProduct(null); setCheckoutStep('form') }}
        title={checkoutStep === 'form' ? 'Checkout' : 'Confirm Order'}
        className="max-w-lg"
      >
        {checkoutProduct && (() => {
          const qty = quantities[checkoutProduct.id] ?? 1
          const total = checkoutProduct.member_price * qty
          return (
            <div className="flex flex-col max-h-[70vh]">
              {/* ── Step indicator ── */}
              <div className="flex items-center gap-2 mb-5">
                <div className={`flex items-center gap-1.5 ${checkoutStep === 'form' ? 'text-primary' : 'text-green-600'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    checkoutStep === 'form' ? 'bg-primary text-primary-foreground' : 'bg-green-100 text-green-700'
                  }`}>
                    {checkoutStep === 'confirm' ? '✓' : '1'}
                  </span>
                  <span className="text-xs font-medium">Details</span>
                </div>
                <div className="h-px flex-1 bg-border" />
                <div className={`flex items-center gap-1.5 ${checkoutStep === 'confirm' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    checkoutStep === 'confirm' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    2
                  </span>
                  <span className="text-xs font-medium">Confirm</span>
                </div>
              </div>

              {/* ── Scrollable content area ── */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* ── Inline validation error ── */}
                {checkoutError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                    {checkoutError}
                  </div>
                )}

                {checkoutStep === 'form' ? (
                  <>
                    {/* ── Order Summary ── */}
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" /> Order Summary
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {checkoutProduct.image_url ? (
                            <img
                              src={checkoutProduct.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{checkoutProduct.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₱{checkoutProduct.member_price.toLocaleString()} × {qty}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg text-primary">₱{total.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Customer Details ── */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Customer Details
                      </h3>
                      <Input
                        label="Full name"
                        placeholder="Juan Dela Cruz"
                        value={checkoutForm.fullName}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                      <Input
                        label="Contact number"
                        placeholder="0917 123 4567"
                        value={checkoutForm.contactNumber}
                        onChange={e => setCheckoutForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Delivery address</label>
                        <textarea
                          placeholder="House/Unit No., Street, Barangay, City, Province"
                          value={checkoutForm.address}
                          onChange={e => setCheckoutForm(prev => ({ ...prev, address: e.target.value }))}
                          rows={3}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">
                          Delivery notes <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                          placeholder="e.g. Leave at gate, ring bell, etc."
                          value={checkoutForm.deliveryNotes}
                          onChange={e => setCheckoutForm(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                          rows={2}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* ── Payment Method ── */}
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Payment Method
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'gcash' as const, label: 'GCash', icon: Smartphone, desc: 'Instant payment' },
                          { value: 'card' as const, label: 'Card', icon: CreditCard, desc: 'Credit / Debit' },
                          { value: 'cod' as const, label: 'COD', icon: Truck, desc: 'Cash on delivery' },
                        ].map(opt => {
                          const selected = checkoutForm.paymentChannel === opt.value
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setCheckoutForm(prev => ({ ...prev, paymentChannel: opt.value }))}
                              className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-center transition-all ${
                                selected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
                              }`}
                            >
                              <opt.icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-xs font-medium ${selected ? 'text-primary' : ''}`}>{opt.label}</span>
                              <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* ── GCash QR & account details ── */}
                      {checkoutForm.paymentChannel === 'gcash' && (
                        <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <QrCode className="h-4 w-4 text-primary" />
                            Pay via GCash
                          </div>

                          {gcashChannelLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                          ) : gcashChannel?.qr_image_url ? (
                            <img
                              src={gcashChannel.qr_image_url}
                              alt="GCash QR"
                              className="mx-auto max-w-[200px] rounded-xl border bg-white p-2"
                            />
                          ) : (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                              QR code not yet available. Use the account details below or contact support.
                            </p>
                          )}

                          {(gcashChannel?.account_name || gcashChannel?.account_number) && (
                            <div className="text-sm space-y-1.5">
                              {gcashChannel.account_name && (
                                <p>
                                  <span className="text-muted-foreground">Name: </span>
                                  {gcashChannel.account_name}
                                </p>
                              )}
                              {gcashChannel.account_number && (
                                <div className="flex items-center gap-2">
                                  <p>
                                    <span className="text-muted-foreground">Account: </span>
                                    <span className="font-mono font-medium">{gcashChannel.account_number}</span>
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyNumber(gcashChannel.account_number!)}
                                    className="shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium hover:bg-muted transition-colors flex items-center gap-1"
                                  >
                                    {copied ? (
                                      <><CheckCircle2 className="h-3 w-3 text-green-600" /> Copied</>
                                    ) : (
                                      <><Copy className="h-3 w-3" /> Copy</>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {gcashChannel?.instructions && (
                            <p className="text-xs text-muted-foreground border-t pt-3">
                              {gcashChannel.instructions}
                            </p>
                          )}

                          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 flex items-start gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              Pay via GCash first, then upload a screenshot of your payment receipt below.
                            </span>
                          </div>

                          {/* ── Receipt upload ── */}
                          <div className="border-t pt-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Payment receipt <span className="font-normal">(optional, helps admin verify)</span>
                            </p>
                            <div
                              onClick={() => receiptRef.current?.click()}
                              className="border border-dashed rounded-lg p-3 cursor-pointer hover:bg-muted/30 text-center transition-colors"
                            >
                              <input
                                ref={receiptRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleReceiptChange}
                              />
                              {receiptPreview ? (
                                <div className="relative">
                                  <img
                                    src={receiptPreview}
                                    alt="Receipt preview"
                                    className="mx-auto max-h-32 rounded-lg object-contain"
                                  />
                                  <p className="text-[10px] text-muted-foreground mt-1.5">
                                    Click to change receipt image
                                  </p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1 py-2">
                                  <Image className="h-6 w-6 text-muted-foreground/40" />
                                  <span className="text-xs text-muted-foreground">
                                    Upload GCash receipt screenshot
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Status Badges ── */}
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 border p-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium">Order:</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Pending Confirmation
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-medium">Payment:</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          Unpaid
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* ── Order Summary ── */}
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5" /> Order Summary
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {checkoutProduct.image_url ? (
                            <img
                              src={checkoutProduct.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{checkoutProduct.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₱{checkoutProduct.member_price.toLocaleString()} × {qty}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg text-primary">₱{total.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>

                    {/* ── Review Details Card ── */}
                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        Delivery & Payment Details
                      </h3>
                      <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2.5 text-sm">
                        <span className="text-muted-foreground">Full name</span>
                        <span className="font-medium">{checkoutForm.fullName}</span>

                        <span className="text-muted-foreground">Contact</span>
                        <span className="font-medium">{checkoutForm.contactNumber}</span>

                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium">{checkoutForm.address}</span>

                        {checkoutForm.deliveryNotes.trim() && (
                          <>
                            <span className="text-muted-foreground">Notes</span>
                            <span className="font-medium text-muted-foreground">{checkoutForm.deliveryNotes}</span>
                          </>
                        )}

                        <span className="text-muted-foreground">Payment</span>
                        <span className="font-medium capitalize">
                          {checkoutForm.paymentChannel === 'gcash' && 'GCash'}
                          {checkoutForm.paymentChannel === 'card' && 'Credit / Debit Card'}
                          {checkoutForm.paymentChannel === 'cod' && 'Cash on Delivery'}
                        </span>

                        {checkoutForm.paymentChannel === 'gcash' && gcashChannel?.account_name && (
                          <>
                            <span className="text-muted-foreground">Pay to</span>
                            <span className="font-medium">{gcashChannel.account_name}</span>
                          </>
                        )}
                        {checkoutForm.paymentChannel === 'gcash' && gcashChannel?.account_number && (
                          <>
                            <span className="text-muted-foreground">Account #</span>
                            <span className="font-mono font-medium">{gcashChannel.account_number}</span>
                          </>
                        )}
                      </div>

                      {/* ── GCash QR in confirm step ── */}
                      {checkoutForm.paymentChannel === 'gcash' && gcashChannel?.qr_image_url && (
                        <div className="border-t pt-3 flex flex-col items-center gap-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Scan QR to pay
                          </p>
                          <img
                            src={gcashChannel.qr_image_url}
                            alt="GCash QR"
                            className="max-w-[160px] rounded-xl border bg-white p-1.5"
                          />
                        </div>
                      )}
                    </div>

                    {/* ── Status Badges ── */}
                    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 border p-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-medium">Order:</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Pending Confirmation
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-medium">Payment:</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          Unpaid
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ── Sticky footer actions ── */}
              <div className="sticky bottom-0 pt-4 mt-4 border-t bg-background flex items-center gap-3">
                {checkoutStep === 'form' ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCheckoutProduct(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleContinueToConfirm}
                    >
                      Continue to Review
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCheckoutStep('form')}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      loading={buyingId === checkoutProduct.id}
                      onClick={handleConfirmOrder}
                    >
                      Confirm Order
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
