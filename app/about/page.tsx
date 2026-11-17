import Link from "next/link";
import type {Metadata} from "next";
import {ArrowUpRight,Code2,Globe2,Layers3,Users} from "lucide-react";
import {getSiteSettings} from "@/lib/platform-settings";
export const metadata:Metadata={title:"About NuvoraCraft & NPTduy",description:"The story of NuvoraCraft, a visual creator studio for websites, apps and interactive 3D worlds, founded by NPTduy.",robots:{index:true,follow:true}};
export default async function About(){
 const {siteTitle}=await getSiteSettings();
 return <main className="min-h-dvh bg-[#080f20] px-5 py-12 text-slate-100"><div className="mx-auto max-w-5xl">
  <Link href="/" className="text-sm text-orange-300">← {siteTitle}</Link>
  <div className="mt-16 max-w-4xl"><p className="text-xs font-black uppercase tracking-[.22em] text-orange-400">Our story · Made by NPTduy</p>
   <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight sm:text-7xl">One idea. Infinite worlds.</h1>
   <p className="mt-7 text-lg leading-9 text-slate-300">NuvoraCraft began with a question from founder <strong className="text-white">NPTduy</strong>: what if creating a website, an app and an interactive 3D experience could happen in one visual workspace? No jumping between disconnected tools. No artificial ceiling on imagination.</p>
   <p className="mt-5 text-base leading-8 text-slate-400">We're building that workspace one tested module at a time. The code connects a real visual editor, Supabase, interactive scenes and AI-assisted generation—while being clear about which integrations still require configuration or production validation.</p>
  </div>
  <div className="mt-14 grid gap-4 sm:grid-cols-3">{[
   {title:"Design",description:"Compose responsive pages from editable, nested components.",icon:Layers3},
   {title:"Build",description:"Experiment with 3D, logic and native deployment workflows.",icon:Code2},
   {title:"Collaborate",description:"Help shape an evolving platform with the GitHub community.",icon:Users}
  ].map(x=><div key={x.title} className="rounded-2xl border border-slate-700 bg-slate-900 p-7"><x.icon className="mb-5 text-orange-400" size={28}/><h2 className="text-xl font-bold">{x.title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{x.description}</p></div>)}</div>
  <section className="my-16 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-slate-900 p-8"><Globe2 className="text-orange-300"/><h2 className="mt-5 text-3xl font-black">Join the people building what's next.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Designers, makers, QA testers, technical writers and developers are welcome to discuss ideas and contribute. Founder: NPTduy. Every meaningful contribution matters.</p><Link href="https://github.com/duyuyd/no-code-builder-saas" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white">Explore GitHub <ArrowUpRight size={17}/></Link></section>
 </div></main>;
}