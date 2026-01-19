import HeroForm from "@/components/hero-form"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10 pointer-events-none" />

      <div className="relative">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance mb-4">Create with AI</h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Transform your ideas into reality with our intelligent design assistant
            </p>
          </div>

          {/* Hero Form */}
          <HeroForm />
        </div>
      </div>
    </main>
  )
}
