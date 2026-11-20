import { getWebContent } from "@/lib/web-content";
import { WebContentProvider } from "@/components/WebContentProvider";
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
import { site } from "@/data/site";

export const dynamic = 'force-dynamic';
export default async function Home() {
  const [catalog, content] = await Promise.all([getCatalog().catch(() => null), getWebContent()]);
  const copy = (key: string) => content.copy[key] ?? "";
  const schema = { "@context": "https://schema.org", "@type": "Organization", name: site.name, url: site.url, description: site.description, ...(site.email ? { email: site.email } : {}) };
  return <WebContentProvider content={content}>
    <Motion /><ScrollProgress /><SkyshotEffects /><a href="#main" className="skip-link">{copy("Home.1")}</a>
    <Navigation />
    <main id="main">
      <FireworksBanner />
      <div className="celebration-strip"><span>{copy("Home.2")}</span><span>{copy("Home.3")}<b>✳</b> {copy("Home.4")}<b>✳</b> {copy("Home.5")}<b>✳</b> {copy("Home.6")}</span></div>

      <section id="collection" className="section container">
        <div className="section-heading" data-reveal>
          <div><span className="eyebrow">{copy("Home.7")}</span><RevealHeading>{copy("Home.8")}<br /><em>{copy("Home.9")}</em></RevealHeading></div>
          <p>{copy("Home.10")}<br />{copy("Home.11")}</p>
        </div>
        <Storefront initialCatalog={catalog} />
      </section>

      <section id="about" className="about-section">
        <div className="container about-grid">
          <div className="story-art" data-reveal>
            {content.images["story.image"] && <ScrollPhoto src={content.images["story.image"]} alt="Warm fireworks illuminating a celebration" />}
            <div className="story-art-caption"><span className="eyebrow">{copy("Home.12")}</span><p>{copy("Home.13")}<br /><em>{copy("Home.14")}</em></p></div>
          </div>
          <div className="story-copy" data-reveal><span className="eyebrow">{copy("Home.15")}</span><RevealHeading>{copy("Home.16")}<br /><em>{copy("Home.17")}</em></RevealHeading><p className="story-lead">{copy("Home.18")}</p><p>{copy("Home.19")}</p><p>{copy("Home.20")}</p><RollingLink className="text-link" href="#contact" text={copy("story.button")} /><span className="story-signature">{copy("Home.21")}</span></div>
        </div>
      </section>

      <ScrollWordReveal />
      <GalleryShowcase />

      <section className="container how-section">
        <div data-reveal><span className="eyebrow">{copy("Home.22")}</span><RevealHeading>{copy("Home.23")}<br /><em>{copy("Home.24")}</em></RevealHeading></div>
        <div className="steps" data-reveal>
          <article><span aria-hidden="true">✳</span><h3>{copy("Home.25")}</h3><p>{copy("Home.26")}</p></article>
          <article><span aria-hidden="true">＋</span><h3>{copy("Home.27")}</h3><p>{copy("Home.28")}</p></article>
          <article><span aria-hidden="true">✦</span><h3>{copy("Home.29")}</h3><p>{copy("Home.30")}</p></article>
        </div>
      </section>

      <Testimonials />

      <section id="faq" className="faq-section container"><div data-reveal><span className="eyebrow">{copy("Home.31")}</span><RevealHeading>{copy("Home.32")}<br /><em>{copy("Home.33")}</em></RevealHeading><p>{copy("Home.34")}</p></div><Accordion className="faqs" items={content.faqs.map((faq, i) => ({ id: `faq-${i}`, title: faq.question, content: <p>{faq.answer}</p> }))} /></section>
      {content.sections.map(section => <section key={section.id} className="section container managed-section">{section.image && <img src={section.image} alt="" loading="lazy" />}<RevealHeading>{section.title}</RevealHeading><p style={{whiteSpace:'pre-line'}}>{section.body}</p></section>)}
      <section id="contact" className="container contact-section"><Contact seller={catalog?.seller} /></section>
      <section className="container policies" aria-label="Website policies"><div className="policy-intro"><span className="eyebrow">{copy("Home.35")}</span><p>{copy("Home.36")}</p></div><Accordion items={[
        { id: "terms", title: "Terms & Conditions", content: <div className="policy-body"><p className="draft-label">{copy("Home.37")}</p><h3>{copy("Home.38")}</h3><p>{copy("Home.39")}</p><h3>{copy("Home.40")}</h3><p>{copy("Home.41")}</p><h3>{copy("Home.42")}</h3><p>{copy("Home.43")}</p><h3>{copy("Home.44")}</h3><p>{copy("Home.45")}</p></div> },
        { id: "privacy", title: "Privacy Policy", content: <div className="policy-body"><p className="draft-label">{copy("Home.46")}</p><h3>{copy("Home.47")}</h3><p>{copy("Home.48")}</p><h3>{copy("Home.49")}</h3><p>{copy("Home.50")}</p><h3>{copy("Home.51")}</h3><p>{copy("Home.52")}</p></div> },
      ]} /></section>
    </main>
    <footer className="footer"><div className="container"><div className="footer-top"><a href="#home" className="brand footer-brand"><span className="brand-symbol" aria-hidden="true">✳</span><span>{copy("Home.53")}<span className="brand-sub">{copy("Home.54")}</span></span></a><p>{copy("Home.55")}<br />{copy("Home.56")}</p><RollingLink className="back-top" href="#home" text="Back to top" /></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {copy("Home.57")}</span><nav aria-label="Footer navigation"><a href="#about">{copy("Home.58")}</a><a href="#terms">{copy("Home.59")}</a><a href="#privacy">{copy("Home.60")}</a></nav><span>{copy("Home.61")}<span aria-hidden="true">✦</span></span></div></div></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </WebContentProvider>;
}
