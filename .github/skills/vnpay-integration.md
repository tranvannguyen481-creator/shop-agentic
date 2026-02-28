# Playbook: VNPay Integration

> Read this file in full before implementing anything VNPay-related.

## How It Works (SHOP-AGENTIC flow)

```
Client → POST /api/payment/vnpay/create-url
       ← { paymentUrl }
Client → redirect to VNPay gateway
VNPay  → GET /api/payment/vnpay/callback  (user return)
VNPay  → POST /api/payment/vnpay/ipn      (server-to-server, authoritative)
```

The **IPN** endpoint is the only one you trust for order status updates.
The **callback** endpoint is only for redirecting the user — never update order status here.

## Environment Variables (add to `.env`)

```env
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html   # sandbox
# VNPAY_URL=https://pay.vnpay.vn/vpcpay.html                   # production
VNPAY_RETURN_URL=http://localhost:3000/payment/result           # frontend return
VNPAY_IPN_URL=http://YOUR_PUBLIC_URL/api/payment/vnpay/ipn
```

Never hardcode these values. Always read from `process.env`.

## Feature Folder

```
src/features/payment/
├── index.ts
├── routes/payment.routes.ts
├── controllers/payment.controller.ts
├── services/vnpay.service.ts
├── dtos/create-payment.dto.ts
├── types/payment.types.ts
└── constants/vnpay.constants.ts
```

## Firestore Collection: `payments`

| Field       | Type                                 | Notes                             |
| ----------- | ------------------------------------ | --------------------------------- |
| `id`        | string                               | Firestore doc ID (= `vnp_TxnRef`) |
| `orderId`   | string                               | Reference to `orders` collection  |
| `userId`    | string                               | Firebase uid                      |
| `amount`    | number                               | In VND (integer)                  |
| `status`    | `'pending' \| 'success' \| 'failed'` | Updated only by IPN handler       |
| `vnpayCode` | string                               | `vnp_ResponseCode` from IPN       |
| `createdAt` | Timestamp                            | `serverTimestamp()`               |
| `updatedAt` | Timestamp                            | `serverTimestamp()`               |

## Checksum Algorithm

```ts
import crypto from "crypto";
import querystring from "qs";

function createHmacSHA512(secret: string, data: string): string {
  return crypto.createHmac("sha512", secret).update(data).digest("hex");
}

// Sort params alphabetically, exclude vnp_SecureHash & vnp_SecureHashType
function buildSecureHash(
  params: Record<string, string>,
  secret: string,
): string {
  const sorted = Object.keys(params)
    .filter((k) => k !== "vnp_SecureHash" && k !== "vnp_SecureHashType")
    .sort()
    .reduce(
      (acc, k) => ({ ...acc, [k]: params[k] }),
      {} as Record<string, string>,
    );
  const signData = querystring.stringify(sorted, { encode: false });
  return createHmacSHA512(secret, signData);
}
```

## IPN Handler Rules

1. Verify checksum first — if invalid, return `{ RspCode: '97', Message: 'Checksum failed' }` immediately.
2. Look up the payment document by `vnp_TxnRef` in Firestore.
3. If payment already `success` → return `{ RspCode: '02', Message: 'Order already confirmed' }` (idempotent).
4. If `vnp_ResponseCode === '00'` → update `status` to `success`, update the related order.
5. Otherwise → update `status` to `failed`.
6. Always return `{ RspCode: '00', Message: 'Confirm Success' }` after successful processing (tells VNPay to stop retrying).

## Mandatory Rules

- Use `qs` (not `URLSearchParams`) for parameter serialization — VNPay is sensitive to encoding.
- Amount passed to VNPay = `actualAmount * 100` (VNPay uses integer, no decimal).
- `vnp_TxnRef` must be unique per transaction — use `orderId + '_' + Date.now()`.
- Never trust the callback URL for payment confirmation — IPN only.
- Delete no payment records — only update status.
