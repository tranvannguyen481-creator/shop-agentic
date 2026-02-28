/**
 * Script: seed-event
 * Creates one sample event with banner images (data-URLs) and product items
 * that each have an image.  Resolves the user and group automatically from
 * existing Firestore data so you don't have to hardcode anything.
 *
 * Run with:
 *   npm run script:seed-event
 *
 * Optional env override:
 *   SEED_HOST_UID=<uid>   – use this UID instead of auto-detecting one
 *   SEED_GROUP_ID=<id>    – use this group instead of auto-detecting one
 */

import admin from "firebase-admin";
import "../app/config/firebaseAdmin";

const db = admin.firestore();

// ─── Tiny coloured SVG helpers ───────────────────────────────────────────────

const svgDataUrl = (fill: string, label: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <rect width="400" height="300" fill="${fill}"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="sans-serif" font-size="36" fill="white">${label}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

const BANNER_URLS = [
  svgDataUrl("#2c7a4b", "Banner 1 – Fresh Produce"),
  svgDataUrl("#1a5276", "Banner 2 – Weekend Sale"),
  svgDataUrl("#784212", "Banner 3 – Local Farms"),
];

const PRODUCTS = [
  {
    name: "Organic Tomatoes (500g)",
    description: "Freshly picked organic tomatoes from local farms.",
    price: "$4.50",
    groupPrice: "$3.80",
    groupDiscountPercent: 15,
    qtyThreshold: 10,
    stock: 100,
    fill: "#c0392b",
    options: [{ value: "500g" }, { value: "1kg" }],
    optionGroups: [],
  },
  {
    name: "Baby Spinach (200g)",
    description: "Tender baby spinach leaves, washed and ready.",
    price: "$3.20",
    groupPrice: "$2.70",
    groupDiscountPercent: 16,
    qtyThreshold: 8,
    stock: 80,
    fill: "#27ae60",
    options: [{ value: "200g" }, { value: "400g" }],
    optionGroups: [],
  },
  {
    name: "Seasonal Fruit Box",
    description: "Assorted seasonal fruits curated by our farm partners.",
    price: "$18.00",
    groupPrice: "$15.00",
    groupDiscountPercent: 16,
    qtyThreshold: 5,
    stock: 40,
    fill: "#e67e22",
    options: [],
    optionGroups: [
      {
        name: "Box size",
        required: true,
        choices: [
          { id: "small", name: "Small (2 kg)", price: 0 },
          { id: "large", name: "Large (4 kg)", price: 6 },
        ],
      },
    ],
  },
];

// ─── Firestore helpers ───────────────────────────────────────────────────────

interface GroupDoc {
  id: string;
  name: string;
  hostUid?: string;
  userId?: string;
  hostDisplayName?: string;
}

async function resolveGroup(
  overrideGroupId?: string,
  overrideHostUid?: string,
): Promise<GroupDoc> {
  if (overrideGroupId) {
    const snap = await db.collection("groups").doc(overrideGroupId).get();
    if (!snap.exists) throw new Error(`Group '${overrideGroupId}' not found.`);
    const d = snap.data() as Record<string, unknown>;
    return {
      id: snap.id,
      name: typeof d["name"] === "string" ? d["name"] : "Unknown group",
      hostUid:
        (overrideHostUid as string) ??
        (d["ownerUid"] as string) ??
        (d["hostUid"] as string) ??
        (d["userId"] as string) ??
        "",
      hostDisplayName:
        (d["ownerDisplayName"] as string) ??
        (d["hostDisplayName"] as string) ??
        "",
    };
  }

  // Auto-detect: query groups by hostUid if provided, otherwise first group
  let query: admin.firestore.Query = db.collection("groups").limit(1);
  if (overrideHostUid) {
    query = db
      .collection("groups")
      .where("ownerUid", "==", overrideHostUid)
      .limit(1);
    const snap = await query.get();
    if (!snap.empty) {
      const d = snap.docs[0].data() as Record<string, unknown>;
      return {
        id: snap.docs[0].id,
        name: typeof d["name"] === "string" ? d["name"] : "Unknown group",
        hostUid: overrideHostUid,
        hostDisplayName:
          (d["ownerDisplayName"] as string) ??
          (d["hostDisplayName"] as string) ??
          "",
      };
    }
    // fallback: any group
  }

  const fallback = await db.collection("groups").limit(1).get();
  if (fallback.empty) {
    throw new Error(
      "No group found in Firestore.  Create a group first or set SEED_GROUP_ID.",
    );
  }
  const d = fallback.docs[0].data() as Record<string, unknown>;
  return {
    id: fallback.docs[0].id,
    name: typeof d["name"] === "string" ? d["name"] : "Unknown group",
    hostUid:
      (overrideHostUid as string) ??
      (d["ownerUid"] as string) ??
      (d["hostUid"] as string) ??
      (d["userId"] as string) ??
      "",
    hostDisplayName:
      (d["ownerDisplayName"] as string) ??
      (d["hostDisplayName"] as string) ??
      "",
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== seed-event ===");

  const overrideHostUid = process.env.SEED_HOST_UID;
  const overrideGroupId = process.env.SEED_GROUP_ID;

  const group = await resolveGroup(overrideGroupId, overrideHostUid);
  const hostUid = group.hostUid ?? "";

  if (!hostUid) {
    throw new Error(
      "Could not determine host UID.  Set SEED_HOST_UID env var.",
    );
  }

  console.log(`Using group: ${group.name} (${group.id})`);
  console.log(`Using host:  ${hostUid}`);

  const now = Date.now();
  const closingDate = new Date(now + 10 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // +10 days
  const collectionDate = new Date(now + 13 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10); // +13 days

  const items = PRODUCTS.map((p, i) => ({
    id: `item-${i + 1}`,
    name: p.name,
    description: p.description,
    price: p.price,
    basePrice: parseFloat(p.price.replace("$", "")),
    normalPrice: parseFloat(p.price.replace("$", "")),
    groupPrice: parseFloat(p.groupPrice.replace("$", "")),
    groupDiscountPercent: p.groupDiscountPercent,
    qtyThreshold: p.qtyThreshold,
    stock: p.stock,
    imagePreviewUrl: svgDataUrl(p.fill, p.name.split(" ")[0]),
    options: p.options,
    optionGroups: p.optionGroups,
  }));

  const payload: Record<string, unknown> = {
    title: "Weekend Fresh Produce Market",
    description:
      "Seasonal fruits and vegetables sourced directly from local farms. Order before closing date to guarantee your box.",
    mode: "group-buy",
    pickupLocation: "123 Market Street, District 1",
    closingDate,
    collectionDate,
    collectionTime: "09:00 - 12:00",
    paymentAfterClosing: false,
    payTogether: true,
    adminFee: "2.0",
    addImportantNotes: true,
    importantNotes: [
      "Payment via bank transfer only.",
      "Pick up at the designated location on collection day.",
    ],
    addExternalUrl: false,
    externalUrlFieldName: "",
    externalUrl: "",
    addDeliveryOptions: false,
    deliveryScheduleDate: "",
    deliveryTimeFrom: "",
    deliveryTimeTo: "",
    deliveryFees: [],
    requestDeliveryDetails: false,
    groupId: group.id,
    groupName: group.name,
    bannerPreviewUrls: BANNER_URLS,
    items,
    currentCount: 0,
    buyCount: 0,
    totalPurchase: "$0.00",
    status: "active",
    userId: hostUid,
    hostUid,
    hostEmail: "",
    hostDisplayName: group.hostDisplayName ?? "",
    createdAt: now,
    updatedAt: now,
    yearMonth: new Date(closingDate).toISOString().slice(0, 7),
    vatRate: 0.1,
    discountRules: {
      groupBuy: { enabled: true, minMembers: 5, extraDiscountPercent: 10 },
    },
    productGroupQty: {},
    closingInText: "closing in 10 days",
    deliveryInText: `Delivery on ${collectionDate}`,
  };

  // Write to Firestore
  const eventRef = db.collection("events").doc();
  const hostedRef = db
    .collection("userHostedEvents")
    .doc(`${hostUid}_${eventRef.id}`);

  const hostedPayload = {
    eventId: eventRef.id,
    hostUid,
    userId: hostUid,
    groupId: group.id,
    status: "active",
    buyCount: 0,
    totalPurchase: "$0.00",
    yearMonth: payload["yearMonth"],
    title: payload["title"],
    closingDate: payload["closingDate"],
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(eventRef, payload);
  batch.set(hostedRef, hostedPayload);
  await batch.commit();

  console.log(`\nEvent created!`);
  console.log(`  ID:      ${eventRef.id}`);
  console.log(`  Title:   ${payload["title"]}`);
  console.log(`  Banners: ${BANNER_URLS.length}`);
  console.log(`  Items:   ${items.length}`);
  console.log(`\nDone.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
