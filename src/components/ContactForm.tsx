import { useState, FormEvent } from "react";
import { motion } from "motion/react";
import { Send, CheckCircle2, AlertCircle, Linkedin, Mail, MapPin, Youtube, ExternalLink } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setErrorMsg("Please complete all fields.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "An exception occurred. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Failed to reach server. Check network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Info Sidebar panel */}
        <div className="md:col-span-12 lg:col-span-5 space-y-6">
          <h3 className="text-2xl font-bold text-white font-sans tracking-tight">Connect with NKT</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
            Have questions about commercial office space rentals at Nedumpurath Towers, high resolution spatial mapping projects, or connecting to the IONGRID electric charger? Drop us a line and we will get back to you soon.
          </p>

          <div className="space-y-4 pt-4 font-sans text-sm text-slate-300">
            <div className="flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">NKT Headquarters</h4>
                <p className="text-xs text-slate-400 mt-0.5">Nedumpurath Towers, opposite Josco Jewellery, Thodupuzha City Centre, Kerala - 685584</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-cyan-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Direct Email Inquiry</h4>
                <p className="text-xs text-slate-400 mt-0.5">gptthomu@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 space-y-3">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Connected Channels</h4>
            <div className="flex gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-all cursor-pointer"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form input box */}
        <div className="md:col-span-12 lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl space-y-4 font-sans text-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-1">Your Name</label>
                <input
                  id="contact-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Abhilash Nair"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-1">Email Address</label>
                <input
                  id="contact-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="abhilash@kseb.in"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-1">Inquiry / Message</label>
              <textarea
                id="contact-message-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your proposal or query here"
                rows={5}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            {isSuccess && (
              <div className="flex gap-2.5 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="font-semibold text-white">Thank you!</h5>
                  <p className="mt-1">Your message has been received successfully. We will review your query and reply to you shortly.</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              id="contact-form-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow shadow-cyan-500/10 tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
