'use client';

import { LazyImage } from '@/shared/blocks/common';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { InfiniteSlider } from '@/shared/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/shared/components/ui/progressive-blur';
import { cn } from '@/shared/lib/utils';
import { Section } from '@/shared/types/blocks/landing';

export function Logos({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  return (
    <section
      id={section.id}
      className={cn('overflow-hidden pt-16 pb-4 md:pt-24 md:pb-6', section.className, className)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <ScrollAnimation>
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">{section.title}</h2>
            {section.description && (
              <p className="text-md text-muted-foreground">{section.description}</p>
            )}
          </div>
        </ScrollAnimation>
        
        <div className="relative">
          <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
            {section.items?.map((item, idx) => (
              <div key={idx} className="flex">
                <LazyImage
                  className="mx-auto h-8 w-fit dark:invert"
                  src={item.image?.src ?? ''}
                  alt={item.image?.alt ?? ''}
                />
              </div>
            ))}
          </InfiniteSlider>
          
          {/* Gradient overlays for smooth fade effect */}
          <ProgressiveBlur
            className="pointer-events-none absolute left-0 top-0 h-full w-18"
            direction="left"
            blurIntensity={1}
            blurLayers={3}
          />
          <ProgressiveBlur
            className="pointer-events-none absolute right-0 top-0 h-full w-18"
            direction="right"
            blurIntensity={1}
            blurLayers={3}
          />
        </div>
      </div>
    </section>
  );
}
