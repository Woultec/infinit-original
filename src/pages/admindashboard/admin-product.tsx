import { useEffect, useState, useRef } from 'react'
import { supabase } from '@services/supabase'
import { useAuth } from '@hooks/useAuth'
import { SUPER_ADMIN_EMAIL } from '@lib/constants'
import {
  getProducts, addProduct, updateProduct, deleteProductWithImage,
  uploadProductImage, type Product
} from '@services/productService'

const CATEGORIES = ["Electronics","Clothing","Food & Beverage","Home & Living","Beauty","Sports","Other"]
const STATUSES = ["Pending", "Active", "Rejected", "Draft", "Archived"] as const

const statusStyles: Record<string, string> = {
  Active:   "bg-green-100 text-green-800",
  Pending:  "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-800",
  Draft:    "bg-gray-100 text-gray-800",
  Archived: "bg-gray-100 text-gray-500",
}
const stockColor = (n: number) =>
  n === 0 ? "text-red-500" : n < 20 ? "text-amber-600" : "text-foreground"

const emptyForm = { name:"", sku:"", category:"", price:"", stock:"", status:"Pending" as Product["status"] }

export function AdminProduct() {
  const { user } = useAuth()
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL

  const [products, setProducts]     = useState<Product[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [preview, setPreview]       = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState("")
  const [search, setSearch]         = useState("")
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [filterCat, setFilterCat]   = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active'>('all')
  const fileRef = useRef<HTMLInputElement>(null)

  // initial fetch
  useEffect(() => {
    getProducts().then(setProducts).finally(() => setLoading(false))
  }, [])

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' },
        () => getProducts().then(setProducts)
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setForm(emptyForm)
    setImageFile(null)
    setPreview(null)
    setError("")
    setShowForm(false)
    setEditingId(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleEditClick(product: Product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      status: product.status,
    })
    setPreview(product.image_url || null)
    setImageFile(null)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleAdd() {
    if (!form.name || !form.sku || !form.price || !form.stock || !form.category) {
      setError("Please fill in all required fields."); return
    }
    setSaving(true)
    try {
      let image_url: string | undefined
      if (imageFile) image_url = await uploadProductImage(imageFile)

      if (editingId) {
        const updated = await updateProduct(editingId, {
          ...form,
          status: isSuperAdmin ? form.status : 'Pending', // Non-super admins might get reverted to pending on edit depending on requirements, but here we enforce it
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          ...(image_url ? { image_url } : {}) // Only update image_url if a new image was uploaded
        })
        setProducts(prev => prev.map(p => p.id === editingId ? updated : p))
      } else {
        const newProduct = await addProduct({
          ...form,
          status: isSuperAdmin ? form.status : 'Pending', // Force 'Pending' for non-super admins
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          image_url,
        })
        setProducts(prev => [newProduct, ...prev])
      }
      resetForm()
    } catch (err: any) {
      if (err.code === '23505' || err.message?.includes('products_sku_key')) {
        setError("A product with this SKU already exists. Please use a unique SKU.")
      } else {
        setError(err.message ?? "Something went wrong.")
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate(id: string, status: Product["status"]) {
    try {
      const updated = await updateProduct(id, { status })
      setProducts(prev => prev.map(p => p.id === id ? updated : p))
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function handleDelete(product: Product) {
    try {
      await deleteProductWithImage(product)
      setProducts(prev => prev.filter(p => p.id !== product.id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCat || p.category === filterCat) &&
    (!filterStatus || p.status === filterStatus) &&
    (activeTab === 'all' || (activeTab === 'pending' && p.status === 'Pending') || (activeTab === 'active' && p.status === 'Active'))
  )

  if (loading) return <p className="p-6 text-muted-foreground text-sm">Loading products...</p>

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your store inventory</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted">
          + Add product
        </button>
      </div>

      {/* Add/Edit Product Form */}
      {showForm && (
        <div className="border rounded-xl p-5 mb-6 bg-card">
          <p className="font-medium mb-4">{editingId ? 'Edit product' : 'New product'}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { key:"name",  label:"Product name", placeholder:"e.g. Wireless Headphones", type:"text"   },
              { key:"sku",   label:"SKU",           placeholder:"e.g. WH-1001",             type:"text"   },
              { key:"price", label:"Price (₱)",    placeholder:"0.00",                      type:"number" },
              { key:"stock", label:"Stock",         placeholder:"0",                        type:"number" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border rounded-md px-3 py-1.5 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border rounded-md px-3 py-1.5 text-sm">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select 
                value={form.status} 
                onChange={e => setForm(p => ({ ...p, status: e.target.value as Product["status"] }))}
                disabled={!isSuperAdmin}
                className="w-full border rounded-md px-3 py-1.5 text-sm disabled:opacity-50 disabled:bg-muted"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {!isSuperAdmin && <p className="text-[10px] text-muted-foreground mt-1">New products default to 'Pending' for review.</p>}
            </div>

            {/* Image upload */}
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Product image</label>
              <div onClick={() => fileRef.current?.click()}
                className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-border transition-colors bg-muted/30">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                {preview ? (
                  <div className="flex items-center gap-3">
                    <img src={preview} className="h-16 w-16 object-cover rounded-md border" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{imageFile?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive mb-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">Cancel</button>
            <button onClick={handleAdd} disabled={saving}
              className="px-4 py-1.5 text-sm bg-foreground text-background rounded-md disabled:opacity-50">
              {saving ? "Saving..." : (editingId ? "Update product" : "Save product")}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'all', label: 'All Products' },
          { id: 'pending', label: 'Pending Review' },
          { id: 'active', label: 'Approved & Active' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.id === 'pending' && products.filter(p => p.status === 'Pending').length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {products.filter(p => p.status === 'Pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <input type="text" placeholder="Search products..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm max-w-xs" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border rounded-md px-3 py-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Product Cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="border rounded-xl overflow-hidden bg-card hover:border-border transition-colors flex flex-col">
              {/* Image */}
              <div className="w-full h-36 bg-muted flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>

              {/* Body */}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusStyles[p.status]}`}>
                    {p.status}
                  </span>
                </div>

                <span className="text-xs bg-muted px-2 py-0.5 rounded self-start">{p.category}</span>

                {p.profiles && (
                  <div className="mt-2 p-2 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Submitted By</p>
                    <p className="text-xs font-medium truncate">
                      {p.profiles.first_name} {p.profiles.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.profiles.email}</p>
                  </div>
                )}

                <div className="border-t pt-2 flex justify-between items-end mt-auto">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold text-sm">₱{p.price.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className={`font-semibold text-sm ${stockColor(p.stock)}`}>
                      {p.stock === 0 ? "Out" : p.stock}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {isSuperAdmin && p.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(p.id, 'Active')}
                        className="flex-1 text-xs bg-green-600 text-white rounded-md py-1.5 hover:bg-green-700 transition-colors font-medium">
                        Approve
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(p.id, 'Rejected')}
                        className="flex-1 text-xs bg-red-600 text-white rounded-md py-1.5 hover:bg-red-700 transition-colors font-medium">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(p)} className="flex-1 text-xs border rounded-md py-1.5 hover:bg-muted">Edit</button>
                      <button onClick={() => handleDelete(p)}
                        className="text-xs border rounded-md px-3 py-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}