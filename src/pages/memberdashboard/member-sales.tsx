import { useEffect, useState } from 'react'
import { getMySales, type MemberSale } from '@services/memberStockService'
import { Package, TrendingDown, Calendar, Clock } from 'lucide-react'

export function MemberSalesPage() {
  const [sales, setSales] = useState<MemberSale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMySales()
      .then(setSales)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0)

  // Group sales by date for a nice timeline view
  const grouped = sales.reduce<Record<string, MemberSale[]>>((acc, sale) => {
    const date = new Date(sale.created_at).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(sale)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sales History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A log of all items you've sold from your personal stock
        </p>
      </div>

      {/* ── Summary Card ── */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <TrendingDown className="h-5 w-5 text-red-700" />
          </div>
          <div>
            <p className="text-2xl font-bold">{sales.length}</p>
            <p className="text-xs text-muted-foreground">
              {sales.length === 1 ? 'Sale' : 'Sales'} · {totalSold} total item{totalSold === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Sales List ── */}
      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading sales...</p>
      ) : sales.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">
            No sales recorded yet. Go to <strong>Stocks</strong> to record your first sale.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, daySales]) => (
            <div key={date}>
              {/* ── Date heading ── */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-muted-foreground">{date}</h2>
                <span className="text-xs text-muted-foreground/60">
                  ({daySales.length} sale{daySales.length === 1 ? '' : 's'})
                </span>
              </div>

              {/* ── Sales for this day ── */}
              <div className="space-y-2">
                {daySales.map(sale => (
                  <div
                    key={sale.id}
                    className="rounded-xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow"
                  >
                    {/* Product image */}
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {sale.product?.image_url ? (
                        <img
                          src={sale.product.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sale.product?.name ?? 'Unknown product'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        SKU: {sale.product?.sku ?? '—'}
                      </p>
                    </div>

                    {/* Quantity + Time */}
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center justify-center rounded-lg bg-red-50 px-2.5 py-1 text-sm font-bold text-red-700">
                        -{sale.quantity}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(sale.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
