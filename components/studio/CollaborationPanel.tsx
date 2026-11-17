"use client";
import {useState,type FormEvent} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {Copy,Users,X} from "lucide-react";
import {inviteCollaborator} from "@/app/builder/collab-actions";
export default function CollaborationPanel({projectId,canInvite,connected,peers}:{projectId:string;canInvite:boolean;connected:boolean;peers:number}){
 const [open,setOpen]=useState(false),[email,setEmail]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");setMessage("");
  const result=await inviteCollaborator(projectId,email);if(result.ok){setMessage("Editor invited. Share the project link with this registered account.");setEmail("");}else setError(result.error);setBusy(false);};
 return <Dialog.Root open={open} onOpenChange={setOpen}>
   <Dialog.Trigger asChild><button className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-xs text-orange-200"><Users size={15}/> Live {connected?"●":"○"} · {peers+1}</button></Dialog.Trigger>
   <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[120] bg-slate-950/80"/><Dialog.Content className="fixed left-1/2 top-1/2 z-[121] w-[min(94vw,520px)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-2xl border border-slate-700 bg-[#142238] p-6 text-white shadow-2xl">
    <div className="flex items-center justify-between"><Dialog.Title className="text-xl font-black">Multiplayer editing</Dialog.Title><Dialog.Close aria-label="Close"><X size={18}/></Dialog.Close></div>
    <Dialog.Description className="text-sm leading-6 text-slate-400">Authorized collaborators see cursor presence and Yjs-synchronized canvas updates. Project data stays protected by Supabase RLS; saving uses version conflict protection.</Dialog.Description>
    <p className="text-xs text-slate-300">Room: {connected?"Connected":"Connecting"} · Online editors: {peers+1}</p>
    <button type="button" onClick={()=>void navigator.clipboard.writeText(window.location.origin+"/builder?project="+encodeURIComponent(projectId))} className="flex items-center gap-2 rounded-xl border border-slate-600 px-3 py-2 text-xs"><Copy size={15}/> Copy project link</button>
    {canInvite?<form onSubmit={submit} className="space-y-3"><label htmlFor="invite-email" className="block text-xs font-bold">Invite a registered account via email</label><input id="invite-email" type="email" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)} placeholder="teammate@example.com" className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-sm"/><button disabled={busy} type="submit" className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold disabled:opacity-60">Invite editor</button></form>:<p className="text-xs text-slate-400">Only the owner can invite new editors.</p>}
    {error&&<p role="alert" className="text-xs text-rose-300">{error}</p>}{message&&<p role="status" className="text-xs text-emerald-300">{message}</p>}
   </Dialog.Content></Dialog.Portal>
 </Dialog.Root>;
}
