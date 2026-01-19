"use client"

import React from "react"
import { useState } from "react"
import { Section } from "@/shared/types/blocks/landing"
import { cn } from "@/shared/lib/utils"

export function Showcase({
  section,
  className,
}: {
  section: Section
  className?: string
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <section id={section.id} className={cn("py-20 md:py-28", section.className, className)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4">
            {section.title || "Powerful Features"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
            {section.description || "Discover what you can create with our AI-powered design tools"}
          </p>
        </div>

        {/* Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {section.items?.map((item, index) => (
            <div
              key={item.id || index}
              className="group relative"
              onMouseEnter={() => setHoveredId(item.id || index)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <div
                className={`relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-all duration-500 ${
                  hoveredId === (item.id || index)
                    ? "shadow-xl scale-[1.02] border-primary/30"
                    : "shadow-md hover:shadow-lg"
                }`}
              >
                {/* Image Container */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image?.src || "/placeholder.svg"}
                    alt={item.image?.alt || item.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      hoveredId === (item.id || index) ? "scale-110" : "scale-100"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>

                  {/* Interactive Bar */}
                  <div className="mt-5 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 rounded-full bg-primary/30 transition-all duration-700 ${
                          hoveredId === (item.id || index) ? "w-16" : "w-8"
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded-full bg-secondary/50 transition-all duration-700 delay-100 ${
                          hoveredId === (item.id || index) ? "w-10" : "w-4"
                        }`}
                      />
                      <div
                        className={`h-1.5 rounded-full bg-accent/50 transition-all duration-700 delay-200 ${
                          hoveredId === (item.id || index) ? "w-6" : "w-2"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
                    hoveredId === (item.id || index) ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background: "radial-gradient(circle at 50% 0%, var(--primary) 0%, transparent 50%)",
                    opacity: hoveredId === (item.id || index) ? 0.1 : 0,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
