import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getMemberOrders,
  cancelMemberOrder,
  type OrderStatus,
  type OrderWithDetails,
} from '@services/orderService'
import { ROUTES } from '@lib/constants'
import { Button } from '@components/ui/Button'
import { ShoppingBag, Clock, Package, Coins } from 'lucide-react'
import { INFINITY_COIN } from '@lib/infinityCoin'

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
}

const statusHint: Record<OrderStatus, string> = {
  pending: 'Waiting for confirmation',
  confirmed: 'Order confirmed',
  processing: 'Being prepared',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function MemberOrder() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    getMemberOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(id: string) {
    if (!window.confirm('Cancel this order?')) return
    setCancellingId(id)
    try {
      const updated = await cancelMemberOrder(id)
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not cancel order'
      alert(msg)
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your purchases and order status
          </p>
        </div>
        <Link
          to={ROUTES.MEMBER_PRODUCT}
          className="text-sm font-medium text-primary hover:underline"
        >
          Browse products →
        </Link>
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm mb-4">You have not placed any orders yet.</p>
          <Link
            to={ROUTES.MEMBER_PRODUCT}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to storefront
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <article
              key={order.id}
              className="rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                    {order.payment_method === 'infinity_coin' && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <Coins className="h-3 w-3" /> {INFINITY_COIN.SHORT}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{statusHint[order.status]}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {order.payment_method === 'infinity_coin'
                      ? `${Number(order.total_amount).toLocaleString()} ∞`
                      : `₱${Number(order.total_amount).toLocaleString()}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {(order.order_items ?? []).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50"
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name ?? 'Product'}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} · ₱{item.unit_price.toLocaleString()} each
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">
                      ₱{(item.quantity * item.unit_price).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {order.status === 'pending' && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:border-red-200"
                    disabled={cancellingId === order.id}
                    loading={cancellingId === order.id}
                    onClick={() => handleCancel(order.id)}
                  >
                    Cancel order
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
