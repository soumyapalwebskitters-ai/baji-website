export const site = {
  name: "Baji Market",
  description: "Make room for a little wonder. Explore Baji Market’s festival collection of sparklers, flower pots and rockets.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "", // Add verified business contact details before publishing.
  phone: "",
  address: "",
};

export const faqs = [
  { question: "How do I buy a product?", answer: "Choose your preferred variant, add it to your bag and select Order on WhatsApp. We refresh the catalogue prices before preparing your message. Review the total, continue to WhatsApp and press Send to share your order request with the shop." },
  { question: "Do I pay on this website?", answer: "No payment is collected here. The shop confirms availability, final pricing and payment or collection arrangements directly on WhatsApp. Sending a cart does not automatically reserve stock." },
  { question: "Are prices per piece or per box?", answer: "Each variant shows its selling unit. For box items, the displayed price covers all the pieces in that box. Choose a variant to see its price and pack size before adding it to your bag." },
];
