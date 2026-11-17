import Link from "next/link";
import {redirect,notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import BlogEditor from "@/components/blog/BlogEditor";
export const dynamic="force-dynamic";
export const metadata={title:"Blog Admin Drafts",robots:{index:false,follow:false}};
export default async function BlogAdmin(){
 const db=await createClient(),{data:{user}}=await db.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="admin")notFound();
 const {data:drafts}=await db.from("blog_posts").select("id,title,excerpt,published").eq("author_id",user.id).order("created_at",{ascending:false}).limit(40);
 return <main className="min-h-dvh bg-slate-950 p-6 text-white"><div className="mx-auto max-w-3xl"><Link href="/blog" className="text-sm text-orange-300">← Blog</Link><h1 className="my-6 text-3xl font-black">SEO content editor</h1><BlogEditor drafts={drafts??[]}/></div></main>;
}
