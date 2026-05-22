import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveProducts, type Product } from '@services/productService'
import { placeOrder } from '@services/orderService'
import { getMyWallet } from '@services/walletService'
import {
  effectiveCoinPrice,
  coinSavingsPercent,
  formatCoins,
  INFINITY_COIN,
} from '@lib/infinityCoin'
import { ROUTES } from '@lib/constants'
import { Button } from '@components/ui/Button'
import { Coins } from 'lucide-react'

type PayMode = 'standard' | 'coins'

export function MemberProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [coinBalance, setCoinBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [payMode, setPayMode] = useState<PayMode>('standard')
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

    setBuyingId(product.id)
    setMessage(null)

    try {
      await placeOrder(product.id, qty, useCoins)
      setMessage({
        type: 'success',
        text: useCoins
          ? `Order placed with ${formatCoins(total)} for ${qty}× ${product.name}.`
          : `Order placed for ${qty}× ${product.name}. We'll confirm your order soon.`,
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
    </div>
  )
}
