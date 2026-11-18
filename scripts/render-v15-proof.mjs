import {bundle} from "@remotion/bundler";
import {ensureBrowser,selectComposition,renderMedia} from "@remotion/renderer";
import {mkdir,readFile,stat} from "node:fs/promises";
import {join,resolve} from "node:path";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";

const output=resolve("proof/nuvoracraft-v15-proof.mp4");
const nodes=Array.from({length:24},(_,i)=>({
 id:"proof_paragraph_"+(i+1),
 type:"paragraph",
 props:{text:"NuvoraCraft by NPTduy • verified 15-second Remotion output • feature "+String(i+1).padStart(2,"0")+
  " • editable website and application layouts • authentic H.264 video export"},
 style:{color:i%2?"#19304c":"#a14216"},
 children:[]
}));
console.log("RENDER_SOURCE=scripts/remotion-entry.tsx");
console.log("RENDER_COMPOSITION=NuvoraDemo");
console.log("RENDER_ENGINE=@remotion/renderer");
await mkdir(resolve("proof"),{recursive:true});
const serveUrl=await bundle({entryPoint:join(process.cwd(),"scripts/remotion-entry.tsx")});
await ensureBrowser();
const inputProps={projectName:"NuvoraCraft by NPTduy",pagePath:"/verified",nodes};
const composition=await selectComposition({serveUrl,id:"NuvoraDemo",inputProps});
if(composition.durationInFrames!==450||composition.fps!==30||composition.width!==1280||composition.height!==720)
 throw new Error("Unexpected composition metadata: "+JSON.stringify(composition));
console.log("RENDER_FRAMES="+composition.durationInFrames+" FPS="+composition.fps+" SIZE="+composition.width+"x"+composition.height);
let lastProgress=-1;
await renderMedia({serveUrl,composition,codec:"h264",outputLocation:output,inputProps,
 videoBitrate:"8M",
 onProgress:({progress})=>{
  const p=Math.floor(progress*10);
  if(p>lastProgress){lastProgress=p;console.log("RENDER_PROGRESS="+(p*10)+"%");}
 }});
const data=await readFile(output);
const info=await stat(output);
const hash=createHash("sha256").update(data).digest("hex");
console.log("MP4_FILE="+output);
console.log("MP4_BYTES="+info.size);
console.log("MP4_SHA256="+hash);
if(data.subarray(4,8).toString("ascii")!=="ftyp")throw Error("Invalid MP4 header");
const probe=spawnSync("ffprobe",[
 "-v","error","-show_entries","stream=codec_name,width,height","-show_entries",
 "format=format_name,duration,size","-of","json",output
],{encoding:"utf8"});
console.log("FFPROBE_EXIT_CODE="+probe.status);
console.log("FFPROBE_STDOUT_BEGIN");
process.stdout.write(probe.stdout);
console.log("FFPROBE_STDOUT_END");
if(probe.stderr)process.stderr.write(probe.stderr);
if(probe.status!==0)throw Error("ffprobe failed");
const parsed=JSON.parse(probe.stdout);
const stream=parsed.streams?.find(s=>s.codec_name==="h264");
const duration=Number(parsed.format?.duration);
if(!stream||Math.abs(duration-15)>0.15||info.size<=1048576)
 throw Error("MP4 proof did not meet H264 / 15 seconds / >1MB: "+JSON.stringify({stream,duration,size:info.size}));
console.log("PASS V15 REAL REMOTION VIDEO PROOF");
