export const site = {
  name: "Baji Market",
  description: "Make room for a little wonder. Explore Baji Market’s festival collection of sparklers, flower pots and rockets.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "", // Add verified business contact details before publishing.
  phone: "",
  address: "",
};

export const faqs = [
  { question: "How do I buy a product?", answer: "Choose your preferred variants, add them to your bag, enter your contact details and select Place query. After the security check, your query is saved and the shop will contact you." },
  { question: "Do I pay on this website?", answer: "No payment is collected here. The shop will contact you to confirm availability, final pricing and payment or collection arrangements. Submitting a query does not reserve stock." },
  { question: "Are prices per piece or per box?", answer: "Each variant shows its selling unit. For box items, the displayed price covers all the pieces in that box. Choose a variant to see its price and pack size before adding it to your bag." },
];
