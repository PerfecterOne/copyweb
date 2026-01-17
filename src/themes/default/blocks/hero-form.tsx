"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { ArrowRight, ImageIcon, Globe, Figma, MessageSquare, Upload, LinkIcon, Code, Eye, EyeOff } from "lucide-react"
import { Section } from "@/shared/types/blocks/landing"
import { cn } from "@/shared/lib/utils"
import { buildPrompt, type InputType as PromptInputType, type OutputFormat as PromptOutputFormat } from "@/config/ai/prompt-builder"
import { toast } from "sonner"
import { useAppContext } from "@/shared/contexts/app"

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

export function HeroForm({
  section,
  className,
}: {
  section: Section;
  className?: string;
}) {
  const router = useRouter()
  const { user, setIsShowSignModal } = useAppContext()
  const [inputType, setInputType] = useState<InputType>("prompt")
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("html-css")
  const [textValue, setTextValue] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [showOutputDropdown, setShowOutputDropdown] = useState(false)
  const [showPromptDebug, setShowPromptDebug] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageName, setSelectedImageName] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 实时生成 prompt 用于调试
  useEffect(() => {
    const result = buildPrompt({
      inputType: inputType as PromptInputType,
      outputFormat: outputFormat as PromptOutputFormat,
      userContent: textValue || selectedImageName || "[用户输入内容]",
    })
    setGeneratedPrompt(result.fullPrompt)
  }, [inputType, outputFormat, textValue, selectedImageName])

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
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleImageFile(files[0])
    }
  }

  const handleFileInputClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleImageFile(files[0])
    }
  }

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('图片大小不能超过 2.5MB')
      return
    }
    
    setSelectedImageName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setSelectedImageName("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // URL 验证辅助函数
  const isValidUrl = (str: string): boolean => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  // 表单提交验证
  const handleSubmit = () => {
    // 1. 登录校验
    if (!user) {
      setIsShowSignModal(true)
      toast.info("Please sign in to continue", {
        description: "Your session has expired or you're not logged in."
      })
      return
    }

    // 2. 根据不同输入类型进行验证
    switch (inputType) {
      case "image":
        if (!selectedImage) {
          toast.error("Please upload an image first", {
            description: "Click or drag to upload a screenshot or design image."
          })
          return
        }
        break
      
      case "website":
        if (!textValue.trim()) {
          toast.error("Please enter a website URL", {
            description: "Enter the URL of the website you want to convert."
          })
          return
        }
        if (!isValidUrl(textValue.trim())) {
          toast.error("Invalid URL format", {
            description: "Please enter a valid URL starting with http:// or https://"
          })
          return
        }
        break
      
      case "figma":
        if (!textValue.trim()) {
          toast.error("Please enter a Figma URL", {
            description: "Enter your Figma design file URL."
          })
          return
        }
        if (!textValue.includes("figma.com")) {
          toast.error("Invalid Figma URL", {
            description: "Please enter a valid Figma URL (e.g., figma.com/file/...)"
          })
          return
        }
        break
      
      case "prompt":
        if (!textValue.trim()) {
          toast.error("Please describe what you want to create", {
            description: "Enter a description of the UI you want to generate."
          })
          return
        }
        if (textValue.trim().length < 10) {
          toast.error("Description too short", {
            description: "Please provide more details about your design (at least 10 characters)."
          })
          return
        }
        break
    }

    // 验证通过，跳转到 /chat
    setIsSubmitting(true)
    
    // 构建查询参数
    const params = new URLSearchParams({
      inputType,
      outputFormat,
    })
    
    // 根据类型添加内容
    if (inputType === "image" && selectedImage) {
      // 图片需要存储到 sessionStorage（URL 参数长度限制）
      sessionStorage.setItem("copyweb_image", selectedImage)
      sessionStorage.setItem("copyweb_image_name", selectedImageName)
    } else {
      params.set("content", textValue)
    }
    
    router.push(`/chat?${params.toString()}`)
  }

  return (
    <section
      id={section.id}
      className={cn(
        "min-h-screen bg-background relative",
        section.className,
        className
      )}
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
          {/* Title Area */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance mb-4">
              {section.title || "Create with AI"}
            </h1>
            {section.description && (
              <p 
                className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto"
                dangerouslySetInnerHTML={{ __html: section.description }}
              />
            )}
          </div>

          {/* Hero Form */}
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
                  <div className="min-h-[160px] sm:min-h-[200px]">
                    {selectedImage ? (
                      // 图片预览模式
                      <div className="flex flex-col items-center">
                        <div className="relative group">
                          <img 
                            src={selectedImage} 
                            alt="预览" 
                            className="max-h-[180px] rounded-lg border border-border shadow-sm"
                          />
                          <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            ×
                          </button>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{selectedImageName}</p>
                      </div>
                    ) : (
                      // 上传模式
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
                      </div>
                    )}
                    <input 
                      ref={fileInputRef} 
                      type="file" 
                      accept="image/png,image/jpeg,image/webp" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
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
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="rounded-full w-10 h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className={cn("w-5 h-5", isSubmitting && "animate-pulse")} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Prompt Debug Toggle */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowPromptDebug(!showPromptDebug)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPromptDebug ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPromptDebug ? "隐藏 Prompt 调试" : "显示 Prompt 调试"}
              </button>
            </div>

            {/* Prompt Debug Display */}
            {showPromptDebug && (
              <div className="mt-4 p-4 bg-card/80 border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-foreground">
                    🔍 生成的 Prompt 预览
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {inputType.toUpperCase()} → {outputFormat.toUpperCase()}
                  </span>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-[400px] overflow-y-auto bg-muted/30 p-4 rounded-lg font-mono">
                  {generatedPrompt}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
