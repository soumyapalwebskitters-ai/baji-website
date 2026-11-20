import Testimonials from "@/components/Testimonials";
import GalleryShowcase from "@/components/GalleryShowcase";
import ScrollWordReveal from "@/components/ScrollWordReveal";
import { RollingLink } from "@/components/RollingText";
import { ScrollPhoto, ScrollProgress } from "@/components/PageMotion";
import Accordion from "@/components/Accordion";
import RevealHeading from "@/components/RevealHeading";
import Storefront from "@/components/Storefront";
import { getCatalog } from "@/lib/catalog";
import { Contact, FireworksBanner, Motion, Navigation, SkyshotEffects } from "@/components/Experience";
import { faqs, site } from "@/data/site";

export const dynamic = 'force-dynamic';
export default async function Home() {
  const catalog = await getCatalog().catch(() => null);
  const schema = { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, description: site.description, ...(site.email ? { email: site.email } : {}) };
  return <>
    <Motion /><ScrollProgress /><SkyshotEffects /><a href="#main" className="skip-link">Skip to content</a>
    <Navigation />
    <main id="main">
      <FireworksBanner />
      <div className="celebration-strip"><span>A sky full of possibilities.</span><span>SPARKLERS <b>✳</b> FLOWER POTS <b>✳</b> ROCKETS <b>✳</b> MEMORIES</span></div>

      <section id="collection" className="section container">
        <div className="section-heading" data-reveal>
          <div><span className="eyebrow">THE COLLECTION</span><RevealHeading>Small sparks.<br /><em>Grand finales.</em></RevealHeading></div>
          <p>Find a little wonder for your next celebration.<br />Explore the shop’s live collection and make it yours.</p>
        </div>
        <Storefront initialCatalog={catalog} />
      </section>

      <section id="about" className="about-section">
        <div className="container about-grid">
          <div className="story-art" data-reveal>
            <ScrollPhoto src="https://drive.google.com/thumbnail?id=1EpckF7ngBxv10KIhJGeUFq4ZyDZ2ym56&sz=w1920" alt="Warm fireworks illuminating a celebration" />
            <div className="story-art-caption"><span className="eyebrow">THE BEST PART IS WHO YOU SHARE IT WITH</span><p>Stay for<br /><em>one more.</em></p></div>
          </div>
          <div className="story-copy" data-reveal><span className="eyebrow">THE BAJI MARKET STORY</span><RevealHeading>More than light.<br /><em>A feeling.</em></RevealHeading><p className="story-lead">The pause before the burst. The faces lit up. The collective “wow.”</p><p>Some of the best moments begin with something simple. Familiar faces. A shared laugh. A spark that makes everyone stop and look.</p><p>That’s the spirit behind Baji Market. From sparklers to flower pots, our collection is an invitation to come together and make an ordinary night feel extraordinary.</p><RollingLink className="text-link" href="#contact" text="Let’s make a moment of it" /><span className="story-signature">with love, baji market</span></div>
        </div>
      </section>

      <ScrollWordReveal />
      <GalleryShowcase />

      <section className="container how-section">
        <div data-reveal><span className="eyebrow">FROM A SPARK TO A CELEBRATION</span><RevealHeading>Good moments.<br /><em>Simply planned.</em></RevealHeading></div>
        <div className="steps" data-reveal>
          <article><span aria-hidden="true">✳</span><h3>Find your favourites</h3><p>Explore the live collection and choose the colours and styles that feel like you.</p></article>
          <article><span aria-hidden="true">＋</span><h3>Bring it all together</h3><p>Pick your variants, fill your bag, and review your selection in one place.</p></article>
          <article><span aria-hidden="true">✦</span><h3>Let’s make it happen</h3><p>Send your bag on WhatsApp. The shop confirms availability and the final details.</p></article>
        </div>
      </section>

      <Testimonials />

      <section id="faq" className="faq-section container"><div data-reveal><span className="eyebrow">A LITTLE CLARITY</span><RevealHeading>Before the<br /><em>big moment.</em></RevealHeading><p>Everything you need to get started.</p></div><Accordion className="faqs" items={faqs.map((faq, i) => ({ id: `faq-${i}`, title: faq.question, content: <p>{faq.answer}</p> }))} /></section>
      <section id="contact" className="container contact-section"><Contact seller={catalog?.seller} /></section>
      <section className="container policies" aria-label="Website policies"><div className="policy-intro"><span className="eyebrow">THE SMALL PRINT</span><p>A little clarity goes a long way.</p></div><Accordion items={[
        { id: "terms", title: "Terms & Conditions", content: <div className="policy-body"><p className="draft-label">Draft website terms · Business details must be confirmed before publication.</p><h3>About this website</h3><p>Baji Market displays its shop catalogue and lets you prepare a cart to send on WhatsApp. The website does not process payments. Sending a cart is an order request; products are not reserved until the shop confirms your order.</p><h3>Product information</h3><p>Products, variants, selling units and prices come from the shop catalogue. Prices are refreshed before WhatsApp checkout. Box prices include the number of pieces specified for that variant. The shop confirms availability, final pricing and any additional charges before purchase.</p><h3>Purchases and fulfilment</h3><p>Any purchase, payment, collection, cancellation or return arrangements must be agreed directly with the business. Those business policies have not yet been supplied for this website.</p><h3>Using the site</h3><p>Please use the website responsibly and do not attempt to disrupt its operation. For questions about these terms, use the business contact details when available.</p></div> },
        { id: "privacy", title: "Privacy Policy", content: <div className="policy-body"><p className="draft-label">Draft privacy notice · Review against the final hosting and business setup before publication.</p><h3>Information on this website</h3><p>Customer accounts use phone verification through Supabase and its configured SMS provider. Your phone number is used to send a sign-in code and identify your account. Necessary HTTP-only cookies keep you signed in. Signing out removes these cookies. If you submit a review, your chosen display name, rating, and review text are published on this website. Reviews and an account identifier are stored in a separate Cloudflare database; your phone number is not included in public reviews. The website does not process payments. Optional Google tracking is enabled only if you accept cookies. Product search and your shopping bag stay in browser memory and are cleared when you reload or leave the page. The site fetches the public product catalogue from the shop’s Cloudflare service.</p><h3>Enquiries</h3><p>WhatsApp checkout prepares a message containing your selected products, quantities and estimated total. It opens WhatsApp, where you choose whether to send it. Messages and any personal details you share are handled by WhatsApp and the shop. Email and telephone links open the corresponding application.</p><h3>Cookies and hosting</h3><p>Your theme and text-size preferences are saved locally in your browser. Your cookie choice is saved locally in your browser. Google tracking scripts and optional tracking cookies are enabled only after you accept; rejecting keeps them disabled. Cloudflare provides the shop catalogue service. Technical request information may be processed by the hosting and image providers. Final hosting details, retention periods and the business contact for privacy requests must be confirmed before publication.</p></div> },
      ]} /></section>
    </main>
    <footer className="footer"><div className="container"><div className="footer-top"><a href="#home" className="brand footer-brand"><span className="brand-symbol" aria-hidden="true">✳</span><span>baji<span className="brand-sub">MARKET</span></span></a><p>A little spark.<br />A lot of celebration.</p><RollingLink className="back-top" href="#home" text="Back to top" /></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Baji Market</span><nav aria-label="Footer navigation"><a href="#about">Our story</a><a href="#terms">Terms & Conditions</a><a href="#privacy">Privacy Policy</a></nav><span>Made for moments that glow <span aria-hidden="true">✦</span></span></div></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </>;
}
