import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMyStocks,
  deductMemberStock,
  type MemberStock,
} from '@services/memberStockService'
import { ROUTES } from '@lib/constants'
import { Modal } from '@components/ui/Modal'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'
import { Package, ShoppingBag, Layers, MinusCircle, TrendingDown } from 'lucide-react'

export function MemberStockPage() {
  const [stocks, setStocks] = useState<MemberStock[]>([])
  const [loading, setLoading] = useState(true)

  // ── Sell modal state ──
  const [sellTarget, setSellTarget] = useState<MemberStock | null>(null)
  const [sellQty, setSellQty] = useState(1)
  const [selling, setSelling] = useState(false)
  const [sellError, setSellError] = useState<string | null>(null)

  const loadStocks = () =>
    getMyStocks()
      .then(setStocks)
      .catch(console.error)

  useEffect(() => {
    loadStocks().finally(() => setLoading(false))
  }, [])

  const totalProducts = stocks.length
  const totalItems = stocks.reduce((sum, s) => sum + s.quantity, 0)

  // ── Open sell modal ──
  const openSell = (stock: MemberStock) => {
    setSellTarget(stock)
    setSellQty(1)
    setSellError(null)
  }

  // ── Confirm sale ──
  const handleSell = async () => {
    if (!sellTarget) return
    if (sellQty < 1) {
      setSellError('Enter at least 1')
      return
    }
    if (sellQty > sellTarget.quantity) {
      setSellError(`You only have ${sellTarget.quantity} item${sellTarget.quantity === 1 ? '' : 's'}`)
      return
    }

    setSelling(true)
    setSellError(null)

    try {
      await deductMemberStock(sellTarget.product_id, sellQty)
      await loadStocks()
      setSellTarget(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not record sale'
      setSellError(msg)
    } finally {
      setSelling(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Stocks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal inventory — tap <strong>Sell</strong> to record items you sold physically
          </p>
        </div>
        <Link
          to={ROUTES.MEMBER_PRODUCT}
          className="text-sm font-medium text-primary hover:underline"
        >
          Buy more products →
        </Link>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <Package className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total items</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stock List ── */}
      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading stocks...</p>
      ) : stocks.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm mb-4">
            You don't have any stock yet. Buy products to start selling.
          </p>
          <Link
            to={ROUTES.MEMBER_PRODUCT}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag className="h-4 w-4" />
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {stocks.map(stock => (
            <div
              key={stock.id}
              className="rounded-2xl border bg-card p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              {/* ── Product Image ── */}
              <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {stock.product?.image_url ? (
                  <img
                    src={stock.product.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* ── Info ── */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {stock.product?.name ?? 'Unknown product'}
                </p>
                <p className="text-xs text-muted-foreground">
                  SKU: {stock.product?.sku ?? '—'}
                </p>
                {stock.product?.member_price != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Purchased at ₱{Number(stock.product.member_price).toLocaleString()} each
                  </p>
                )}
              </div>

              {/* ── Quantity + Sell Button ── */}
              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                <span className="inline-flex items-center justify-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
                  {stock.quantity}
                </span>
                <p className="text-[10px] text-muted-foreground -mt-0.5">
                  {stock.quantity === 1 ? 'item' : 'items'}
                </p>
                {stock.quantity > 0 && (
                  <button
                    onClick={() => openSell(stock)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <TrendingDown className="h-3 w-3" />
                    Sell
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sell Modal ── */}
      <Modal
        open={!!sellTarget}
        onClose={() => setSellTarget(null)}
        title="Record Sale"
        className="max-w-sm"
      >
        {sellTarget && (
          <div className="space-y-5">
            {/* Product info */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
              <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {sellTarget.product?.image_url ? (
                  <img
                    src={sellTarget.product.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{sellTarget.product?.name}</p>
                <p className="text-xs text-muted-foreground">
                  In stock: <strong>{sellTarget.quantity}</strong>
                </p>
              </div>
            </div>

            {/* Quantity input */}
            <Input
              label="How many did you sell?"
              type="number"
              min={1}
              max={sellTarget.quantity}
              value={sellQty}
              onChange={e => {
                const v = Math.min(
                  Math.max(1, Number(e.target.value) || 1),
                  sellTarget.quantity,
                )
                setSellQty(v)
                setSellError(null)
              }}
              error={sellError ?? undefined}
            />

            {/* Summary */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <p className="font-medium flex items-center gap-1.5">
                <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                Recording a sale
              </p>
              <p className="mt-1 text-amber-800">
                This will deduct <strong>{sellQty}</strong> from your stock. Remaining:{' '}
                <strong>{sellTarget.quantity - sellQty}</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSellTarget(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={selling}
                onClick={handleSell}
              >
                Confirm Sale
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
