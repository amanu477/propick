import { storage } from "./storage";
import { getAIClient } from "./openai";

export interface DiscoveryProgress {
  type: "start" | "category" | "product" | "skip" | "error" | "done";
  message: string;
  categoryName?: string;
  productName?: string;
  queued?: number;
  total?: number;
}

export type ProgressCallback = (progress: DiscoveryProgress) => void;

async function discoverProductsForCategory(
  categoryId: number,
  categoryName: string,
  categoryDescription: string,
  existingNames: string[],
  onProgress: ProgressCallback
): Promise<number> {
  const { client: openai, model } = getAIClient();

  const skipList = existingNames.length > 0
    ? `Skip these already-listed products: ${existingNames.join(", ")}.`
    : "";

  const listPrompt = `You are a product research expert. List the top 5 REAL, well-known ${categoryName} products/services available today.

${skipList}

Return ONLY a valid JSON array of objects. Each object must have:
- "name": exact product/service name (string)
- "website": official website domain (string, e.g. "nordvpn.com")
- "price": typical starting price per month or per year (string, e.g. "$3.99/mo" or "$29.99/yr")
- "rating": estimated user rating out of 5 (string, e.g. "4.8")

Focus on: ${categoryDescription}

Return exactly 5 products. No markdown, no explanation, just the JSON array.`;

  const listResponse = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: listPrompt }],
    response_format: { type: "json_object" },
    max_tokens: 800,
  });

  let products: Array<{ name: string; website: string; price: string; rating: string }> = [];
  try {
    const raw = JSON.parse(listResponse.choices[0]?.message?.content || "{}");
    products = raw.products || raw.items || raw.list || Object.values(raw)[0] || [];
  } catch {
    return 0;
  }

  let queued = 0;

  for (const product of products) {
    if (!product.name) continue;

    const normalizedName = product.name.toLowerCase().trim();
    const alreadyExists = existingNames.some(
      n => n.toLowerCase().trim() === normalizedName
    );

    if (alreadyExists) {
      onProgress({ type: "skip", message: `Skipping ${product.name} (already exists)`, productName: product.name });
      continue;
    }

    onProgress({ type: "product", message: `Generating review for ${product.name}...`, productName: product.name, categoryName });

    try {
      const reviewPrompt = `You are an expert affiliate product reviewer. Generate a complete, realistic, and detailed product review for "${product.name}" in the "${categoryName}" category (${categoryDescription}).

Known details: Website: ${product.website}, Price: ${product.price}, Rating: ${product.rating}/5

Return ONLY a valid JSON object with exactly this structure (no markdown, no code fences):
{
  "name": "${product.name}",
  "slug": "product-name-lowercase-hyphenated",
  "logo": "https://logo.clearbit.com/${product.website}",
  "rating": "${product.rating}",
  "price": "${product.price}",
  "originalPrice": "higher original price",
  "discount": "discount percentage like 67%",
  "affiliateSlug": "productname-no-spaces",
  "affiliateUrl": "https://${product.website}",
  "affiliateProgram": "Product Name Partners",
  "commission": "40%",
  "cookieDays": 30,
  "badge": "one of: 🏆 Editor's Choice, 💰 Best Value, ⚡ Fastest, 🔒 Most Secure, 🌟 Top Rated",
  "shortDescription": "One compelling sentence about the product.",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
  "cons": ["Con 1", "Con 2"],
  "bestFor": "Who this product is best for.",
  "scores": { "speed": 90, "security": 92, "value": 88, "ease": 94 },
  "detailedReview": "Write 2-3 paragraphs of a detailed, honest, expert review covering main strengths, key use cases, and how it compares to competitors."
}

Be realistic and accurate. All scores must be between 75-99.`;

      const reviewResponse = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: reviewPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const generated = JSON.parse(reviewResponse.choices[0]?.message?.content || "{}");
      if (!generated.name || !generated.slug) continue;

      const existingBySlug = await storage.getProductBySlug(generated.slug);
      if (existingBySlug) {
        generated.slug = `${generated.slug}-${Date.now()}`;
      }

      await storage.createPendingProduct({
        categoryId,
        name: generated.name,
        slug: generated.slug,
        logo: `https://logo.clearbit.com/${product.website}`,
        rating: generated.rating || product.rating || "4.5",
        price: generated.price || product.price || "N/A",
        originalPrice: generated.originalPrice || "N/A",
        discount: generated.discount || "0%",
        affiliateSlug: generated.affiliateSlug || generated.slug,
        affiliateUrl: generated.affiliateUrl || `https://${product.website}`,
        affiliateProgram: generated.affiliateProgram || `${generated.name} Partners`,
        commission: generated.commission || "40%",
        cookieDays: generated.cookieDays || 30,
        badge: generated.badge || null,
        shortDescription: generated.shortDescription || "",
        features: Array.isArray(generated.features) ? generated.features : [],
        pros: Array.isArray(generated.pros) ? generated.pros : [],
        cons: Array.isArray(generated.cons) ? generated.cons : [],
        bestFor: generated.bestFor || "",
        scores: generated.scores || { speed: 85, security: 85, value: 85, ease: 85 },
        detailedReview: generated.detailedReview || "",
        status: "pending",
        source: "auto-discovery",
      });

      queued++;
      existingNames.push(product.name);

    } catch (err: any) {
      onProgress({ type: "error", message: `Failed to generate ${product.name}: ${err.message}`, productName: product.name });
    }
  }

  return queued;
}

export async function runAutoDiscovery(onProgress: ProgressCallback): Promise<number> {
  const categories = await storage.getCategories();
  let totalQueued = 0;

  onProgress({ type: "start", message: `Starting auto-discovery for ${categories.length} categories...`, total: categories.length });

  for (const category of categories) {
    onProgress({ type: "category", message: `Discovering products for ${category.name}...`, categoryName: category.name });

    try {
      const existing = await storage.getProductsByCategory(category.id);
      const existingPending = await storage.getPendingProducts();
      const existingNames = [
        ...existing.map(p => p.name),
        ...existingPending
          .filter(p => p.categoryId === category.id)
          .map(p => p.name),
      ];

      const queued = await discoverProductsForCategory(
        category.id,
        category.name,
        category.description,
        existingNames,
        onProgress
      );

      totalQueued += queued;
      onProgress({
        type: "category",
        message: `✓ ${category.name}: queued ${queued} new products`,
        categoryName: category.name,
        queued: totalQueued,
      });

    } catch (err: any) {
      onProgress({ type: "error", message: `Error processing ${category.name}: ${err.message}`, categoryName: category.name });
    }
  }

  onProgress({ type: "done", message: `Auto-discovery complete. ${totalQueued} products queued for review.`, queued: totalQueued, total: categories.length });
  return totalQueued;
}
