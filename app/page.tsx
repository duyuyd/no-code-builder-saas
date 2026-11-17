import Link from "next/link";
import type {Metadata} from "next";
import {ArrowUpRight,Check,ChevronRight,Code2,Cpu,Gamepad2,Globe2,Layers3,Orbit,Rocket,ShieldCheck,Smartphone,Sparkles,Users,Workflow} from "lucide-react";
import {getSiteSettings} from "@/lib/platform-settings";
import {getGrowthSettings} from "@/lib/growth-settings";
import {createClient} from "@/lib/supabase/server";
import InteractiveDemo from "@/components/landing/InteractiveDemo";
import PromptGenerator from "@/components/landing/PromptGenerator";
export const dynamic="force-dynamic";
export const metadata:Metadata={alternates:{canonical:"/"}};
const icons=[Layers3,Orbit,Workflow,Sparkles,Cpu,Users] as const;
export default async function Home(){
 const [{siteTitle},content,db]=await Promise.all([getSiteSettings(),getGrowthSettings(),createClient()]);
 const {data:templates,error}=await db.from("starter_templates").select("id,name,kind,description").eq("is_active",true).order("name").limit(6);
 if(error)throw new Error("Templates unavailable: "+error.message);
 return <main className="min-h-dvh overflow-x-hidden bg-[#070d1b] text-slate-50">
  <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070d1b]/90 backdrop-blur-xl">
   <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
    <Link href="/" aria-label={siteTitle+" home"} className="flex items-center gap-3 font-black tracking-tight"><span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20"><Layers3 size={21}/></span><span className="text-base sm:text-lg">{siteTitle}<span className="text-orange-400">.</span></span></Link>
    <nav aria-label="Main navigation" className="flex min-w-0 flex-wrap items-center gap-3 text-xs font-semibold sm:gap-6 sm:text-sm"><Link href="#features" className="hidden text-slate-300 hover:text-white sm:inline">Features</Link><Link href="#pricing" className="hidden text-slate-300 hover:text-white sm:inline">Pricing</Link><Link href="/marketplace" className="text-slate-300 hover:text-white">Marketplace</Link><Link href="/blog" className="hidden text-slate-300 hover:text-white md:inline">Blog</Link><Link href="/login" className="text-slate-300 hover:text-white">Log in</Link><Link href="/login?mode=register" className="rounded-xl bg-orange-500 px-4 py-2.5 font-bold text-white transition hover:bg-orange-400">{content.primaryCta}</Link></nav>
   </div>
  </header>
  <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-24 pt-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:pb-32 lg:pt-32">
   <div className="pointer-events-none absolute -left-64 top-0 size-[600px] rounded-full bg-orange-500/[.075] blur-[120px]" aria-hidden="true"/>
   <div className="relative z-10">
    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-[10px] font-extrabold tracking-[.17em] text-orange-200 sm:text-xs"><Sparkles size={14}/>{content.eyebrow}</div>
    <h1 className="max-w-2xl text-5xl font-black leading-[1.06] tracking-tight sm:text-6xl lg:text-[4.5rem]">{content.headline}</h1>
    <p className="mt-7 max-w-xl text-base leading-8 text-slate-300">{content.subtitle}</p>
    <PromptGenerator placeholder={content.aiPlaceholder}/>
    <div className="mt-7 flex flex-wrap items-center gap-3"><Link href="/login?mode=register" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-bold transition hover:bg-orange-400">{content.primaryCta}<ArrowUpRight size={17}/></Link><Link href="/builder" className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-5 py-3.5 text-sm font-semibold transition hover:border-orange-400">{content.secondaryCta}<ChevronRight size={16}/></Link></div>
    <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400"><span className="flex items-center gap-2"><Check size={15} className="text-emerald-400"/>Visual first</span><span className="flex items-center gap-2"><Check size={15} className="text-emerald-400"/>Mobile friendly</span><span className="flex items-center gap-2"><Check size={15} className="text-emerald-400"/>Your projects, your data</span></div>
   </div>
   <div className="relative z-10"><div className="pointer-events-none absolute -inset-10 rounded-[50%] bg-orange-500/[.07] blur-[100px]"/><InteractiveDemo/></div>
  </section>
  <section className="border-y border-white/5 bg-white/[.02] px-4 py-7"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-5 text-xs font-bold uppercase tracking-[.18em] text-slate-400 sm:px-8"><span className="flex items-center gap-2"><Globe2 size={16}/> Web</span><span className="flex items-center gap-2"><Smartphone size={16}/> Mobile</span><span className="flex items-center gap-2"><Gamepad2 size={16}/> Game</span><span className="flex items-center gap-2"><Orbit size={16}/> 3D + XR</span><span className="flex items-center gap-2"><Code2 size={16}/> Export</span></div></section>
  <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-8"><div className="mb-10"><p className="text-xs font-extrabold uppercase tracking-[.25em] text-orange-400">CREATE WITHOUT LIMITS</p><h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">From a blank canvas to the worlds you imagine.</h2></div>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{content.features.map((item,i)=>{const Icon=icons[i%icons.length];return <article key={item.dimension+"-"+i} className="group rounded-3xl border border-white/10 bg-[#101a2e] p-7 transition duration-300 hover:-translate-y-1 hover:border-orange-400/40"><div className="mb-6 flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300"><Icon size={24}/></span><span className="font-mono text-xs text-slate-500">{item.dimension}D</span></div><h3 className="text-lg font-bold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-slate-400">{item.detail}</p></article>})}</div>
  </section>
  <section id="templates" className="border-y border-white/10 bg-[#0c1528] px-4 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="mb-9 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange-400">TEMPLATES FROM THE LIBRARY</p><h2 className="mt-3 text-3xl font-black">Get started with a real template.</h2></div><Link href="/dashboard" className="flex items-center gap-1 text-sm font-semibold text-orange-300">See all templates <ArrowUpRight size={16}/></Link></div>
    <div className="grid gap-4 md:grid-cols-3">{(templates??[]).map(t=><Link href={"/dashboard?template="+encodeURIComponent(t.id)} key={t.id} className="rounded-2xl border border-white/10 bg-[#18253b] p-6 transition hover:border-orange-400/50"><div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">{t.kind==="game"?<Gamepad2/>:t.kind==="app"?<Smartphone/>:<Globe2/>}</div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-orange-300">{t.kind}</p><h3 className="text-lg font-bold">{t.name}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{t.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">Use template <ArrowUpRight size={16}/></span></Link>)}</div>
   </div></section>
  <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 sm:px-8"><div className="mb-12 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">PLANS FOR EVERY AMBITION</p><h2 className="mt-4 text-4xl font-black">Create first. Scale when you are ready.</h2><p className="mt-3 text-sm text-slate-400">Plan details are managed by the platform administrator. Upgrade requests are not automatic charges.</p></div>
   <div className="grid gap-5 lg:grid-cols-3">{content.pricing.map(plan=><article key={plan.code} className={"flex flex-col rounded-3xl border p-7 "+(plan.code==="pro"?"border-orange-500/70 bg-[#1f2439] shadow-[0_20px_80px_rgba(249,115,22,.09)]":"border-white/10 bg-[#101a2e]")}>
    <div className="mb-6 flex items-center justify-between"><span className="text-lg font-bold">{plan.name}</span>{plan.code==="pro"&&<span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-white">POPULAR</span>}</div>
    <div><span className="text-4xl font-black">{plan.price}</span><span className="ml-1 text-sm text-slate-500">{plan.period}</span></div><p className="mt-5 min-h-12 text-sm leading-6 text-slate-400">{plan.summary}</p>
    <div className="my-6 h-px bg-white/10"/><div className="flex-1 space-y-3">{plan.features.map(f=><p key={f} className="flex items-start gap-2 text-sm text-slate-300"><Check size={17} className="mt-0.5 shrink-0 text-orange-400"/>{f}</p>)}</div>
    <Link href={plan.href} className={"mt-9 block rounded-xl px-4 py-3 text-center text-sm font-bold "+(plan.code==="pro"?"bg-orange-500 text-white":"border border-slate-600 text-orange-300")}>{plan.cta}</Link>
   </article>)}</div>
  </section>
  <section className="px-4 pb-24 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[32px] border border-orange-400/20 bg-gradient-to-r from-[#251d29] to-[#0f2230] p-10 md:flex-row md:items-center"><div><h2 className="text-3xl font-black">Your next big idea starts here.</h2><p className="mt-3 text-sm text-slate-300">Build it visually. Make it real. Keep control.</p></div><Link href="/login?mode=register" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-6 py-4 text-sm font-bold">Start creating <Rocket size={19}/></Link></div></section>
  <footer className="border-t border-white/10 px-4 py-10 sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-8"><div className="max-w-md"><p className="text-lg font-black">{siteTitle}<span className="text-orange-400">.</span></p><p className="mt-3 text-xs leading-6 text-slate-500">{content.footerNote}</p></div>
   <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-400"><Link href="/ai-builder" className="hover:text-white">AI App Builder</Link><Link href="/screenshot-to-app" className="hover:text-white">Screenshot to App</Link><Link href="/marketplace" className="hover:text-white">Marketplace</Link><Link href="/blog" className="hover:text-white">Blog</Link><Link href="/about" className="hover:text-white">About NPTduy</Link><Link href="/terms" className="hover:text-white">Terms</Link><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/resources" className="hover:text-white">Resources</Link><Link href="/upgrade?plan=agency" className="hover:text-white">Contact</Link><Link href="/pricing" className="hover:text-white">Plans</Link></nav></div>
   <p className="mx-auto mt-10 max-w-7xl text-xs text-slate-600">© {new Date().getFullYear()} {siteTitle}. Founded by NPTduy. All rights reserved.</p>
  </footer>
 </main>;
}
