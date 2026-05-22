import type { Product } from '@services/productService'

export const INFINITY_COIN = {
  NAME: 'Infinity Coin',
  SHORT: '∞ Coin',
  DEFAULT_DISCOUNT_PERCENT: 10,
} as const

/** Price in Infinity Coins (uses coin_price or default % off member_price). */
export function effectiveCoinPrice(product: Pick<Product, 'member_price'> & { coin_price?: number }): number {
  const coin = product.coin_price ?? 0
  if (coin > 0) return coin
  const discounted =
    product.member_price * (1 - INFINITY_COIN.DEFAULT_DISCOUNT_PERCENT / 100)
  return Math.round(discounted * 100) / 100
}

export function coinSavingsPercent(product: Pick<Product, 'member_price'> & { coin_price?: number }): number {
  if (product.member_price <= 0) return 0
  const coin = effectiveCoinPrice(product)
  return Math.round((1 - coin / product.member_price) * 100)
}

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString()} ∞`
}
