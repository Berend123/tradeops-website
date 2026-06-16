const POSITIVE_STATUS_VALUES = new Set([
  "1",
  "true",
  "yes",
  "active",
  "complete",
  "completed",
  "confirmed",
  "paid",
  "success",
  "successful",
]);

const STATUS_KEYS = [
  "checkout",
  "checkout_status",
  "confirmation",
  "payment",
  "payment_status",
  "status",
  "subscription_status",
];

const REFERENCE_KEYS = [
  "checkout_session_id",
  "customer_id",
  "order_id",
  "receipt_id",
  "session_id",
  "subscription_id",
];

function toSearchParams(input) {
  if (input instanceof URLSearchParams) {
    return input;
  }
  const params = new URLSearchParams();
  if (!input || typeof input !== "object") {
    return params;
  }
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          params.append(key, String(item));
        }
      }
      continue;
    }
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  return params;
}

export function resolveJoinPageState(searchParams = {}) {
  const params = toSearchParams(searchParams);
  const confirmationKey = STATUS_KEYS.find((key) =>
    POSITIVE_STATUS_VALUES.has((params.get(key) || "").trim().toLowerCase()),
  ) || "";
  const confirmationReferenceKey = REFERENCE_KEYS.find((key) => (params.get(key) || "").trim()) || "";
  const confirmationReference = confirmationReferenceKey ? (params.get(confirmationReferenceKey) || "").trim() : "";
  const checkoutConfirmed = Boolean(confirmationKey && confirmationReference);

  return {
    checkoutConfirmed,
    confirmationKey,
    confirmationReferenceKey,
    confirmationReference,
  };
}
