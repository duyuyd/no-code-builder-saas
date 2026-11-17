import {ImageResponse} from "next/og";
import {getSiteSettings} from "@/lib/platform-settings";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const size={width:1200,height:630};
export const contentType="image/png";
export default async function Image(){
 const {siteTitle}=await getSiteSettings();
 return new ImageResponse(<div style={{display:"flex",width:"100%",height:"100%",flexDirection:"column",justifyContent:"space-between",padding:"75px",color:"#f8fafc",background:"linear-gradient(135deg,#071123 2%,#152648 68%,#382010 100%)"}}>
  <div style={{display:"flex",alignItems:"center",fontSize:35,fontWeight:800,letterSpacing:2,color:"#fb923c"}}><span style={{marginRight:22,fontSize:54}}>⬡</span>{siteTitle}</div>
  <div style={{display:"flex",flexDirection:"column",gap:20}}>
   <div style={{fontSize:76,fontWeight:900,lineHeight:1.06}}>Build Beyond Boundaries.</div>
   <div style={{fontSize:34,color:"#cbd5e1"}}>Websites · Mobile apps · 3D worlds · AI · XR</div>
  </div>
  <div style={{display:"flex",gap:18,alignItems:"center",fontSize:23,color:"#fb923c"}}><span>VISUAL BUILDER</span><span>3D ENGINE</span><span>BY NPTduy</span></div>
 </div>,size);
}
