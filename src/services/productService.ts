import { supabase } from './supabase'

export interface Product {
  id: string
  created_by: string
  name: string
  sku: string
  category: string
  price: number
  stock: number
  status: 'Active' | 'Draft' | 'Archived' | 'Pending' | 'Rejected'
  image_url?: string
  created_at: string
  updated_at: string
  profiles?: {
    first_name: string
    last_name: string
    email: string
  }
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles:created_by (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Product[]
}

export async function getActiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'Active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Product[]
}

export async function addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('products')
    .insert([{ ...product, created_by: user.id }])
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_by' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Product
}

export async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')        // ← correct bucket name
    .upload(path, file, { upsert: true })
  if (error) throw error

  return supabase.storage
    .from('product-images')        // ← correct bucket name
    .getPublicUrl(path).data.publicUrl
}

export async function deleteProductWithImage(product: Product) {
  if (product.image_url) {
    const path = product.image_url.split('/product-images/')[1]
    if (path) {
      await supabase.storage
        .from('product-images')    // ← correct bucket name
        .remove([path])
    }
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', product.id)
  if (error) throw error
}