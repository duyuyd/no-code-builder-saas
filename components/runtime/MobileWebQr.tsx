"use client";
import {useEffect,useState} from "react";
import QRCode from "qrcode";
export default function MobileWebQr({url}:{url:string}){
 const [src,setSrc]=useState(""),[error,setError]=useState("");
 useEffect(()=>{let active=true;void QRCode.toDataURL(url,{width:252,margin:3,errorCorrectionLevel:"M",color:{dark:"#0f172a",light:"#ffffff"}}).then(data=>{if(active)setSrc(data);}).catch(()=>{if(active)setError("QR rendering unavailable");});return()=>{active=false;};},[url]);
 return <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-6">
   {src?<img src={src} width={252} height={252} alt="QR code for the published mobile web app" className="rounded-xl bg-white p-2"/>:<p className="text-sm text-slate-400">{error||"Generating QR..."}</p>}
   <a href={url} target="_blank" rel="noopener noreferrer" className="max-w-full break-all text-center text-xs text-orange-300 underline">{url}</a>
   <p className="text-center text-xs leading-5 text-slate-400">Scan to open the <b>published mobile web runtime</b> in your phone browser. This is not an Expo Go / native binary QR.</p>
 </div>;
}
