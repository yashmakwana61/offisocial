import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessageSquare, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <header className="w-full py-6 px-4 sm:px-8 border-b border-border/40 backdrop-blur-sm fixed top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">SafeSpace</span>
          </div>
          <Button variant="outline" className="rounded-xl border-2 hover:bg-primary/5" onClick={() => window.location.href = "/api/auth/linkedin"}>
            Member Login
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col justify-center pt-32 pb-16 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-7xl font-display font-bold text-foreground leading-[1.1]">
              A silent, safe place for <br />
              <span className="text-primary">honest work talk.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed"
          >
            Connect with your verified coworkers anonymously. Share experiences, find support, and improve your workplace culture without fear.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto px-8 h-14 text-lg rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-[#0077B5] hover:bg-[#006396] text-white"
              onClick={() => window.location.href = "/api/auth/linkedin"}
            >
              Verify with LinkedIn
            </Button>
            <p className="text-sm text-muted-foreground mt-4 sm:mt-0 text-center sm:text-left">
              Only verified employees can join. <br className="hidden sm:block" /> Your identity remains 100% anonymous.
            </p>
          </motion.div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mt-32">
          {[
            {
              icon: ShieldCheck,
              title: "Verified & Private",
              desc: "We verify employment via email, but your profile remains strictly anonymous to peers and management."
            },
            {
              icon: MessageSquare,
              title: "Open Discussion",
              desc: "Discuss salaries, culture, and challenges openly. Find others who share your experiences."
            },
            {
              icon: Heart,
              title: "Emotional Safety",
              desc: "A community focused on support, not toxicity. Strict moderation ensures a safe environment."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="bg-card p-8 rounded-3xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Unsplash image - Abstract calm office/architecture */}
        <div className="max-w-5xl mx-auto mt-32 rounded-3xl overflow-hidden shadow-2xl relative aspect-video">
          {/* modern office architecture calm abstract */}
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10" />
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80"
            alt="Calm office environment"
            className="w-full h-full object-cover"
          />
        </div>
      </main>

      <footer className="py-12 text-center text-sm text-muted-foreground border-t border-border/40 bg-background/50 backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} SafeSpace Inc. Prioritizing employee well-being.</p>
      </footer>
    </div>
  );
}
