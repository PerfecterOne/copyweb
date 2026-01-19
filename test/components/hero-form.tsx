"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ImageIcon, Globe, Figma, MessageSquare, Upload, LinkIcon, Code } from "lucide-react"

type InputType = "prompt" | "image" | "website" | "figma"
type OutputFormat = "html-css" | "react" | "prototype"

const INPUT_TYPES = [
  { id: "image" as InputType, icon: ImageIcon, label: "Image" },
  { id: "website" as InputType, icon: Globe, label: "Website" },
  { id: "figma" as InputType, icon: Figma, label: "Figma" },
  { id: "prompt" as InputType, icon: MessageSquare, label: "Prompt" },
]

const OUTPUT_FORMATS = [
  { id: "html-css" as OutputFormat, label: "HTML + CSS" },
  { id: "react" as OutputFormat, label: "React Component" },
  { id: "prototype" as OutputFormat, label: "Prototype" },
]

export default function HeroForm() {
  const [inputType, setInputType] = useState<InputType>("prompt")
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("html-css")
  const [textValue, setTextValue] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [showOutputDropdown, setShowOutputDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    // Handle file drop logic here
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 px-4 sm:px-0">
      {/* Input Type Tabs */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-muted/50 backdrop-blur-sm rounded-2xl border border-border/50 min-w-max sm:min-w-0 sm:justify-center">
          {INPUT_TYPES.map((type) => {
            const Icon = type.icon
            const isActive = inputType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setInputType(type.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                  ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Input Area */}
      <div
        className={`
          relative rounded-2xl sm:rounded-3xl border-2 transition-all duration-200
          ${isDragActive ? "border-primary bg-primary/5" : "border-border/50 bg-card/50 backdrop-blur-sm"}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-4 sm:p-6">
          {inputType === "prompt" && (
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full min-h-[160px] sm:min-h-[200px] bg-transparent resize-none text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base leading-relaxed"
            />
          )}

          {inputType === "image" && (
            <div
              onClick={handleFileInputClick}
              className="flex flex-col items-center justify-center min-h-[160px] sm:min-h-[200px] cursor-pointer group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-muted transition-colors">
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              </div>
              <p className="text-sm sm:text-base text-foreground mb-2 text-center px-4">
                <span className="font-medium">drag, paste</span> or{" "}
                <span className="text-primary font-medium">click to upload</span>
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                supported: PNG, JPG, JPEG, WEBP, up to 2.5MB
              </p>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
            </div>
          )}

          {inputType === "website" && (
            <div className="min-h-[160px] sm:min-h-[200px] flex items-start">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 sm:mr-3 mt-1 flex-shrink-0" />
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Input website url here"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base"
              />
            </div>
          )}

          {inputType === "figma" && (
            <div className="min-h-[160px] sm:min-h-[200px] flex items-start">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mr-2 sm:mr-3 mt-1 flex-shrink-0" />
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Input figma url here"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base"
              />
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-border/50">
          {/* Output Format Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOutputDropdown(!showOutputDropdown)}
              className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-sm hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="font-medium">{OUTPUT_FORMATS.find((f) => f.id === outputFormat)?.label}</span>
              </div>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOutputDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-56 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-10">
                {OUTPUT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => {
                      setOutputFormat(format.id)
                      setShowOutputDropdown(false)
                    }}
                    className={`
                      w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${
                        outputFormat === format.id
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent/50"
                      }
                    `}
                  >
                    {outputFormat === format.id && <span className="mr-2">✓</span>}
                    {format.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Credits & Submit */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-sm text-muted-foreground">0 credits left</span>
            <Button
              size="icon"
              className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
