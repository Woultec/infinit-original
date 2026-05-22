import { supabase } from './supabase'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'standard' | 'infinity_coin'

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  payment_method?: PaymentMethod
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
  product?: {
    id: string
    name: string
    sku: string
    image_url?: string
  }
}

export interface OrderWithDetails extends Order {
  profiles?: {
    first_name: string
    last_name: string
    email: string
    username: string
  }
  order_items?: OrderItem[]
}

const ORDER_SELECT = `
  *,
  profiles:user_id (
    first_name,
    last_name,
    email,
    username
  ),
  order_items (
    id,
    quantity,
    unit_price,
    product:product_id (
      id,
      name,
      sku,
      image_url
    )
  )
`

const MEMBER_ORDER_SELECT = `
  *,
  order_items (
    id,
    quantity,
    unit_price,
    product:product_id (
      id,
      name,
      sku,
      image_url
    )
  )
`

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as OrderWithDetails[]
}

export async function getMemberOrders() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('orders')
    .select(MEMBER_ORDER_SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as OrderWithDetails[]
}

export async function cancelMemberOrder(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(MEMBER_ORDER_SELECT)
    .single()

  if (error) throw error
  return data as OrderWithDetails
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(ORDER_SELECT)
    .single()

  if (error) throw error
  return data as OrderWithDetails
}

export async function placeOrder(
  productId: string,
  quantity: number,
  useCoins = false,
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase.rpc('place_order', {
    p_product_id: productId,
    p_quantity: quantity,
    p_use_coins: useCoins,
  })

  if (error) throw error
  return data as string
}
