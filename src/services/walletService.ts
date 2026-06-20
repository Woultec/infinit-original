import { supabase } from './supabase'

export type PaymentChannelId = 'gcash' | 'bank_transfer' | 'paypal' | 'other'

export interface WalletPaymentChannel {
  id: PaymentChannelId
  label: string
  account_name: string | null
  account_number: string | null
  qr_image_url: string | null
  instructions: string | null
  is_active: boolean
  updated_at: string
}

export interface MemberWallet {
  user_id: string
  coin_balance: number
  created_at: string
  updated_at: string
}

export type WalletTransactionType =
  | 'top_up_request'
  | 'top_up'
  | 'purchase'
  | 'refund'
  | 'adjustment'

export type WalletTransactionStatus = 'pending' | 'completed' | 'rejected'

export interface WalletTransaction {
  id: string
  user_id: string
  amount: number
  type: WalletTransactionType
  status: WalletTransactionStatus
  order_id?: string
  notes?: string
  reference_number?: string
  receipt_image_url?: string
  payment_channel?: PaymentChannelId
  created_at: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
  payment_channel_info?: WalletPaymentChannel
}

export async function getPaymentChannels(activeOnly = true) {
  let query = supabase.from('wallet_payment_channels').select('*').order('id')
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data as WalletPaymentChannel[]
}

export async function getAllPaymentChannelsForAdmin() {
  const { data, error } = await supabase
    .from('wallet_payment_channels')
    .select('*')
    .order('id')
  if (error) throw error
  return data as WalletPaymentChannel[]
}

export async function updatePaymentChannel(
  id: PaymentChannelId,
  updates: Partial<
    Pick<
      WalletPaymentChannel,
      'account_name' | 'account_number' | 'qr_image_url' | 'instructions' | 'is_active'
    >
  >,
) {
  const { data, error } = await supabase.rpc('save_payment_channel', {
    p_id: id,
    p_account_name: updates.account_name ?? null,
    p_account_number: updates.account_number ?? null,
    p_qr_image_url: updates.qr_image_url ?? null,
    p_instructions: updates.instructions ?? null,
    p_is_active: updates.is_active ?? true,
  })

  if (error) throw error
  return data as WalletPaymentChannel
}

export async function uploadPaymentQr(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `qr/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('payment-receipts').upload(path, file, { upsert: true })
  if (error) throw error

  return supabase.storage.from('payment-receipts').getPublicUrl(path).data.publicUrl
}

export async function uploadPaymentReceipt(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('payment-receipts').upload(path, file)
  if (error) throw error

  return supabase.storage.from('payment-receipts').getPublicUrl(path).data.publicUrl
}

export async function getMyWallet(): Promise<MemberWallet> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('member_wallets')
    .select('user_id, coin_balance, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  if (data) return data as MemberWallet

  const { data: created, error: insertError } = await supabase
    .from('member_wallets')
    .insert({ user_id: user.id })
    .select('user_id, coin_balance, created_at, updated_at')
    .single()

  if (insertError) throw insertError
  return created as MemberWallet
}

export async function getMyTransactions() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data as WalletTransaction[]
}

export async function requestTopUp(params: {
  amount: number
  referenceNumber: string
  paymentChannel: PaymentChannelId
  receiptUrl?: string
  notes?: string
}) {
  const { data, error } = await supabase.rpc('request_coin_topup', {
    p_amount: params.amount,
    p_reference_number: params.referenceNumber.trim(),
    p_payment_channel: params.paymentChannel,
    p_receipt_url: params.receiptUrl ?? null,
    p_notes: params.notes ?? null,
  })

  if (error) throw error
  return data as string
}

export async function getPendingTopUps() {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        email
      )
    `)
    .eq('type', 'top_up_request')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as WalletTransaction[]
}

export async function reviewTopUp(transactionId: string, approve: boolean) {
  const { error } = await supabase.rpc('review_coin_topup', {
    p_transaction_id: transactionId,
    p_approve: approve,
  })

  if (error) throw error
}

export async function getAllWalletTransactions(limit = 100) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as WalletTransaction[]
}
