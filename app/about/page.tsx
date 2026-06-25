'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Linkedin, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { MagicText } from '@/components/ui/magic-text';

const storyText =
  'most venue searches start the same way. hotels. banquet halls. a few familiar options that keep repeating. it works, but it rarely feels right. not because better spaces do not exist, but because they do not show up. the search ends before the interesting options even begin. coworking spaces, school auditoriums, studios, rooftops all of it stays outside the usual flow. so the choice becomes simple, not good. pick what is visible, or spend hours trying to find something better. that is the gap shiftsdeal is focused on. opening up access to spaces that are already out there, but not easy to discover or book. making the process feel less like searching and more like finding. this is about changing what shows up in the first place. so the next time someone looks for a venue, it is not just the obvious options. it is the right ones.';

export default function About() {
  return (
    <main className="pt-20 bg-white text-black">
      <section className="pt-6 md:pt-8 pb-3 md:pb-4 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-black">
            Building India&apos;s Venue
            <br />
            Marketplace
          </h1>
        </div>
      </section>

      <section className="pt-0 pb-1 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-black text-center mb-0.5 md:mb-1"
          >
            here&apos;s our story
          </motion.h2>

          <div className="mt-0 mb-2 md:mb-3">
          <ContainerScroll titleComponent={<></>}>
            <div className="h-full overflow-y-auto px-5 py-6 md:px-10 md:py-10 text-left">
              <MagicText text={storyText} className="text-[15px] md:text-lg leading-relaxed" />
            </div>
          </ContainerScroll>
          </div>
        </div>
      </section>

      <section className="pt-0 pb-8 md:pb-10 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-black text-center mb-4 md:mb-5">meet the founder</h2>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-black/45"
          >
            <div className="grid md:grid-cols-[180px_1fr] gap-6 md:gap-8 items-start">
              <div className="relative w-[170px] h-[220px] rounded-2xl overflow-hidden bg-black/5 mx-auto md:mx-0">
                <Image
                  src="/founder images/sneha.jpeg"
                  alt="Sneha Panthary"
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-black mb-1">Sneha Panthary</h3>
                <p className="text-black/70 font-semibold mb-5">CEO &amp; Founder</p>
                <div className="space-y-3 text-[15px] md:text-base leading-relaxed text-black/80">
                  <p>sneha panthary is a builder, someone drawn to creating things from the ground up.</p>
                  <p>her background has been a mix of exploring ideas, working across early stage projects, and building a strong sense of what feels right and what does not. from leading initiatives to working on live projects, the focus has always been on execution, not just ideas.</p>
                  <p>the idea for shiftsdeal came from experiencing how broken venue discovery feels. the same options showing up, better spaces existing but staying out of reach, and a process that takes more effort than it should.</p>
                  <p>with shiftsdeal, she looks after product direction, brand, partnerships, and growth. from how the platform is being built to how it is positioned and experienced, the focus is on keeping things simple, intuitive, and actually useful.</p>
                  <p>the vision is clear.</p>
                  <p>to change how people discover and book spaces.</p>
                  <p>to move beyond the obvious options and make better venues more accessible.</p>
                  <p>and to build something that feels as intuitive as it should have been all along.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-5 mt-6">
                  <a
                    href="https://www.linkedin.com/in/sneha-panthary-9a52a9287/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-black/70 hover:text-black transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                  <a
                    href="mailto:sp.shiftsdeal@gmail.com"
                    className="flex items-center gap-2 text-black/70 hover:text-black transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="text-sm">Email</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-14 bg-background-light text-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">our mission</h2>
          <p className="text-base md:text-xl leading-relaxed text-foreground-muted mb-9">
            reshape how people discover spaces.
            <br />
            so the right ones are never out of reach.
          </p>
          <Link href="/venues">
            <Button size="lg" className="">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
