import { SectionHeading } from "@/components/layout/section-heading";
import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQS } from "@/features/landing/data/content";

export function FaqSection() {
  return (
    <section id="faq" className="section-padding scroll-mt-20 py-20 sm:py-28">
      <div className="container-narrow">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers before you start practicing"
          description="Everything you need to know about MockMate at a glance."
        />

        <Reveal className="mx-auto mt-12 max-w-2xl rounded-2xl border border-border/70 bg-card/60 px-5 sm:px-7">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
