import Link from "next/link";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
type Params={slug:string};
async function read(slug:string){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return null;
 const db=await createClient(),{data}=await db.from("blog_posts").select("title,excerpt,body,published_at").eq("slug",slug).eq("published",true).maybeSingle();
 return data;
}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{
 const post=await read((await params).slug);
 return post?{title:post.title,description:post.excerpt,openGraph:{type:"article",title:post.title,description:post.excerpt,publishedTime:post.published_at??undefined},robots:{index:true,follow:true}}:{title:"Article missing",robots:{index:false,follow:false}};
}
export default async function Article({params}:{params:Promise<Params>}){
 const post=await read((await params).slug);if(!post)notFound();
 const structured={"@context":"https://schema.org","@type":"BlogPosting",headline:post.title,description:post.excerpt,datePublished:post.published_at,author:{"@type":"Organization",name:"NuvoraCraft"}};
 return <main className="min-h-dvh bg-[#0a1426] p-5 text-white"><article className="mx-auto max-w-3xl"><Link href="/blog" className="text-sm text-orange-300">← Blog</Link><h1 className="mt-12 text-4xl font-black">{post.title}</h1><p className="mt-4 text-sm text-slate-400">{post.published_at?new Date(post.published_at).toLocaleDateString("en-US"):""}</p><div className="mt-10 whitespace-pre-wrap break-words text-base leading-8 text-slate-200">{post.body}</div></article><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/></main>;
}
