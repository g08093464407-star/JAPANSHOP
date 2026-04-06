"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useCart } from "@/hooks/use-cart"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, cartTotal } = useCart()

  const [isLoading, setIsLoading] = useState(false)

  const [customer, setCustomer] = useState({
    fullName: "",
    email: "",
    postalCode: "",
    prefecture: "",
    city: "",
    addressLine1: "",
    addressLine2: "",
  })

  const handleChange = (key: string, value: string) => {
    setCustomer((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleCheckout = async () => {
    if (items.length === 0) return

    setIsLoading(true)

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customer,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Checkout failed")
        setIsLoading(false)
        return
      }

      if (!data.url) {
        alert("No Stripe URL returned")
        setIsLoading(false)
        return
      }

      window.location.href = data.url
    } catch (error) {
      console.error(error)
      alert("Unexpected error")
      setIsLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-xl">Cart is empty</h1>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="space-y-4">
        <input
          placeholder="Full Name"
          value={customer.fullName}
          onChange={(e) => handleChange("fullName", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Email"
          value={customer.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Postal Code"
          value={customer.postalCode}
          onChange={(e) => handleChange("postalCode", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Prefecture"
          value={customer.prefecture}
          onChange={(e) => handleChange("prefecture", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="City"
          value={customer.city}
          onChange={(e) => handleChange("city", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Address Line 1"
          value={customer.addressLine1}
          onChange={(e) => handleChange("addressLine1", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Address Line 2"
          value={customer.addressLine2}
          onChange={(e) => handleChange("addressLine2", e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="border-t pt-4">
        <p className="text-lg font-semibold">
          Total: ¥{cartTotal.toLocaleString()}
        </p>
      </div>

      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full bg-black text-white py-3 rounded"
      >
        {isLoading ? "Processing..." : "Proceed to Payment"}
      </button>
    </main>
  )
}