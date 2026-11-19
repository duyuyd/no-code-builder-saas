import {readFile,writeFile,unlink} from "node:fs/promises";

type HarEntry={
 request:{url:string;headers?:unknown;cookies?:unknown;queryString?:unknown;postData?:unknown};
 response:{headers?:unknown;cookies?:unknown;content?:{text?:unknown}};
 [key:string]:unknown
};
type HarArchive={log:{pages?:Array<{title?:string}>;entries:HarEntry[]}};

function pathOnly(value:string):string{
 try{const url=new URL(value);return url.origin+url.pathname;}
 catch{return "[redacted-url]";}
}
export async function redactHar(inputPath:string,outputPath:string):Promise<void>{
 const raw=await readFile(inputPath,"utf8");
 const har=JSON.parse(raw) as HarArchive;
 if(!Array.isArray(har.log?.entries))throw new Error("Playwright HAR is missing request entries");
 for(const page of har.log.pages??[])if(page.title)page.title=pathOnly(page.title);
 for(const entry of har.log.entries){
  entry.request.url=pathOnly(entry.request.url);
  entry.request.headers=[];
  entry.request.cookies=[];
  entry.request.queryString=[];
  delete entry.request.postData;
  entry.response.headers=[];
  entry.response.cookies=[];
  if(entry.response.content)delete entry.response.content.text;
  delete entry.serverIPAddress;
 }
 await writeFile(outputPath,JSON.stringify(har),{mode:0o600});
 await unlink(inputPath);
}
