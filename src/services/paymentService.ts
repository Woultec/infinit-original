import { supabase } from './supabase'

export async function processPayment(amount: number): Promise<{ success: true }> {
  // Simulate payment gateway call
  // In a real implementation, this would call an external payment gateway API
  // For now, we simulate a payment with 90% success rate, 10% failure rate
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 10% failure rate
      if (Math.random() < 0.1) {
        reject(new Error('Payment processing failed'))
      } else {
        resolve({ success: true })
      }
    }, 1000) // Simulate network delay
  })
}