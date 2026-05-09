import { useEffect, useState } from 'react'
import { getActiveProducts, type Product } from '@services/productService'

export function MemberProduct() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-6 text-muted-foreground text-sm">Loading products...</p>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Storefront</h1>
        <p className="text-sm text-muted-foreground mt-1">Browse our available products</p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">No products available at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(p => (
            <div key={p.id} className="group border rounded-2xl overflow-hidden bg-card hover:shadow-md transition-all flex flex-col">
              {/* Image */}
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <span className="text-sm text-muted-foreground">No image</span>
                )}
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {p.category}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">High quality product from our exclusive collection.</p>

                <div className="mt-auto flex items-center justify-between">
                  <p className="font-bold text-xl text-foreground">₱{p.price.toLocaleString()}</p>
                  <span className={`text-xs ${p.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
