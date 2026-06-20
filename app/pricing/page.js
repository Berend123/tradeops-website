import { redirect } from "next/navigation";


export const metadata = {
  title: "TradeOps | Pricing",
  description: "TradeOps pricing is now part of the main landing page.",
};


export default function PricingPage() {
  redirect("/#pricing");
}
