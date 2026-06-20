import { supabase } from './supabase'

export interface MemberStock {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: {
    id: string
    name: string
    sku: string
    image_url?: string
    member_price: number
  }
}

/** Fetch all stock entries for the current authenticated member */
export async function getMyStocks() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('member_stocks')
    .select(`
      *,
      product:product_id (
        id,
        name,
        sku,
        image_url,
        member_price
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as MemberStock[]
}

/**
 * Credit a member's stock after a successful purchase.
 * Upserts: adds to existing quantity or creates a new row.
 */
export async function creditMemberStock(productId: string, quantity: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.rpc('upsert_member_stock', {
    p_user_id: user.id,
    p_product_id: productId,
    p_quantity: quantity,
  })

  if (error) throw error
}

/**
 * Deduct stock when a member sells items physically.
 * Validates sufficient stock on the database side and logs the sale.
 */
export async function deductMemberStock(productId: string, quantity: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.rpc('deduct_member_stock', {
    p_user_id: user.id,
    p_product_id: productId,
    p_quantity: quantity,
  })

  if (error) throw error
}

// ── Sales History ───────────────────────────────────────────────

export interface MemberSale {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  product?: {
    id: string
    name: string
    sku: string
    image_url?: string
    member_price: number
  }
}

/** Fetch all sales for the current authenticated member, newest first */
export async function getMySales() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('member_sales')
    .select(`
      *,
      product:product_id (
        id,
        name,
        sku,
        image_url,
        member_price
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as MemberSale[]
}
