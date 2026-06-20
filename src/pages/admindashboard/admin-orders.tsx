import { useEffect, useState } from 'react'
import {
  getOrders,
  updateOrderStatus,
  type OrderStatus,
  type OrderWithDetails,
  type CheckoutDetails,
} from '@services/orderService'
import { Input } from '@components/ui/Input'
import { Modal } from '@components/ui/Modal'
import {
  Search,
  ShoppingBag,
  Clock,
  User,
  Package,
  Coins,
  Eye,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Smartphone,
  Truck,
  Image,
  ChevronRight,
} from 'lucide-react'
import { INFINITY_COIN } from '@lib/infinityCoin'

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

const statusStyles: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
}

function memberLabel(order: OrderWithDetails) {
  if (!order.profiles) return 'Unknown member'
  return `${order.profiles.first_name} ${order.profiles.last_name}`
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)

  // Parse JSON notes into checkout details
  const parsedDetails = selectedOrder?.notes
    ? (() => { try { return JSON.parse(selectedOrder.notes) as CheckoutDetails } catch { return null } })()
    : null

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    setUpdatingId(id)
    try {
      const updated = await updateOrderStatus(id, status)
      setOrders(prev => prev.map(o => (o.id === id ? updated : o)))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update order'
      alert(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = memberLabel(o).toLowerCase()
    const email = o.profiles?.email?.toLowerCase() ?? ''
    const idShort = o.id.slice(0, 8).toLowerCase()
    return name.includes(q) || email.includes(q) || idShort.includes(q) || o.id.includes(q)
  })

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage member product purchases and fulfillment
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search member, email, or order ID..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none"
        >
          <option value="all">All status</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl bg-muted/20">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(order => (
            <div
              key={order.id}
              className="border rounded-2xl bg-card p-5 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                    {order.payment_method === 'infinity_coin' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5 w-fit">
                        <Coins className="h-3 w-3" /> {INFINITY_COIN.SHORT}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {memberLabel(order)}
                    </h3>
                    {order.profiles && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.profiles.email} · @{order.profiles.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(order.order_items ?? []).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/50"
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
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
                          <p className="text-sm font-medium truncate">
                            {item.product?.name ?? 'Product'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            SKU {item.product?.sku ?? '—'} · Qty {item.quantity} · ₱
                            {item.unit_price.toLocaleString()} each
                          </p>
                        </div>
                        <p className="text-sm font-semibold shrink-0">
                          ₱{(item.quantity * item.unit_price).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View full details
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-col items-end gap-3 lg:min-w-[180px]">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">
                      {order.payment_method === 'infinity_coin'
                        ? `${Number(order.total_amount).toLocaleString()} ∞`
                        : `₱${Number(order.total_amount).toLocaleString()}`}
                    </p>
                  </div>
                  <select
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                    className="h-9 w-full rounded-lg border bg-background px-2 text-xs outline-none disabled:opacity-50"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Order Details Modal ── */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        className="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* ── Order Info Header ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Order #{selectedOrder.id.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[selectedOrder.status]}`}
                >
                  {selectedOrder.status}
                </span>
                {selectedOrder.payment_method === 'infinity_coin' && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Coins className="h-3 w-3" /> {INFINITY_COIN.SHORT}
                  </span>
                )}
              </div>
            </div>

            {/* ── Customer Details ── */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Customer
              </h3>
              <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {selectedOrder.profiles
                    ? `${selectedOrder.profiles.first_name} ${selectedOrder.profiles.last_name}`
                    : '—'}
                </span>

                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{selectedOrder.profiles?.email ?? '—'}</span>

                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">@{selectedOrder.profiles?.username ?? '—'}</span>

                {parsedDetails?.fullName && (
                  <>
                    <span className="text-muted-foreground">Contact person</span>
                    <span>{parsedDetails.fullName}</span>
                  </>
                )}
                {parsedDetails?.contactNumber && (
                  <>
                    <span className="text-muted-foreground">
                      <Phone className="h-3 w-3 inline mr-1" />
                      Contact #
                    </span>
                    <span className="font-mono">{parsedDetails.contactNumber}</span>
                  </>
                )}
                {parsedDetails?.address && (
                  <>
                    <span className="text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Address
                    </span>
                    <span className="text-sm">{parsedDetails.address}</span>
                  </>
                )}
                {parsedDetails?.deliveryNotes && (
                  <>
                    <span className="text-muted-foreground">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Delivery notes
                    </span>
                    <span className="text-muted-foreground text-xs italic">
                      {parsedDetails.deliveryNotes}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Order Items ── */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5" /> Order Items
              </h3>
              <div className="space-y-2">
                {(selectedOrder.order_items ?? []).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border"
                  >
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.name ?? 'Product'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        SKU {item.product?.sku ?? '—'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        ₱{item.unit_price.toLocaleString()} × {item.quantity}
                      </p>
                      <p className="text-sm font-semibold">
                        ₱{(item.quantity * item.unit_price).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="text-lg font-bold text-primary">
                  {selectedOrder.payment_method === 'infinity_coin'
                    ? `${Number(selectedOrder.total_amount).toLocaleString()} ∞`
                    : `₱${Number(selectedOrder.total_amount).toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* ── Payment Details ── */}
            {parsedDetails?.paymentChannel && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5" /> Payment
                </h3>
                <div className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium capitalize flex items-center gap-1.5">
                    {parsedDetails.paymentChannel === 'gcash' && (
                      <><Smartphone className="h-3.5 w-3.5 text-blue-600" /> GCash</>
                    )}
                    {parsedDetails.paymentChannel === 'card' && (
                      <><CreditCard className="h-3.5 w-3.5" /> Card</>
                    )}
                    {parsedDetails.paymentChannel === 'cod' && (
                      <><Truck className="h-3.5 w-3.5" /> Cash on Delivery</>
                    )}
                  </span>

                  {parsedDetails.paymentChannel !== 'cod' && (
                    <>
                      <span className="text-muted-foreground">Status</span>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 w-fit">
                        Unpaid
                      </span>
                    </>
                  )}
                </div>

                {/* ── Receipt Image ── */}
                {parsedDetails.receiptUrl && (
                  <div className="border-t pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Image className="h-3 w-3" /> Payment Receipt
                    </p>
                    <a
                      href={parsedDetails.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={parsedDetails.receiptUrl}
                        alt="Payment receipt"
                        className="max-h-48 rounded-lg border object-contain bg-white p-1 hover:opacity-90 transition-opacity"
                      />
                    </a>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Click image to open full size
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Update Status ── */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Update Status
              </h3>
              <select
                value={selectedOrder.status}
                disabled={updatingId === selectedOrder.id}
                onChange={e => {
                  const newStatus = e.target.value as OrderStatus
                  setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
                  handleStatusChange(selectedOrder.id, newStatus)
                }}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none disabled:opacity-50"
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
