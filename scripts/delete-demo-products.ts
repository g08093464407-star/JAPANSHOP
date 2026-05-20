import { sql } from "drizzle-orm"

import { db } from "../lib/db"
import { adminAuditLogs, catalogProducts } from "../lib/db/schema"

async function deleteDemoProducts() {
  const deletedProducts = await db
    .delete(catalogProducts)
    .where(sql`${catalogProducts.legacyId} like 'demo-%'`)
    .returning({
      id: catalogProducts.id,
      legacyId: catalogProducts.legacyId,
      slug: catalogProducts.slug,
      name: catalogProducts.name,
    })

  if (deletedProducts.length > 0) {
    await db.insert(adminAuditLogs).values(
      deletedProducts.map((product) => ({
        entityType: "product",
        entityId: product.id,
        action: "delete_demo_product",
        beforeJson: product,
        afterJson: null,
        createdAt: new Date(),
      }))
    )
  }

  console.log(`Deleted demo products: ${deletedProducts.length}`)
}

deleteDemoProducts()
  .then(() => {
    console.log("Demo product cleanup completed.")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Demo product cleanup failed:", error)
    process.exit(1)
  })
