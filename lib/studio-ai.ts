// This module is only imported by Server Actions and server components.
// API credentials are read from process.env at request time and never passed to a client.
export type AiProvider="gemini"|"deepseek"|"openai";
export type AiMode="offline"|AiProvider;
export type AiConfig={
 enabled:boolean;provider:AiProvider;model:string;dailyUserLimit:number;dailyGlobalLimit:number;maxOutputTokens:number;
};
export type ChatTurn={role:"user"|"assistant";content:string};
const providers:AiProvider[]=["gemini","deepseek","openai"];
export const AI_DEFAULT_MODELS:Record<AiProvider,string>={
 gemini:"gemini-3.5-flash-lite",deepseek:"deepseek-flash",openai:"gpt-5-mini"
};
export const AI_DEFAULT_CONFIG:AiConfig={enabled:false,provider:"gemini",model:AI_DEFAULT_MODELS.gemini,dailyUserLimit:10,dailyGlobalLimit:80,maxOutputTokens:900};
export function validAiModel(value:string):boolean{
 return /^[a-zA-Z][a-zA-Z0-9._-]{2,79}$/.test(value);
}
export function readAiConfig(raw:unknown):AiConfig{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return AI_DEFAULT_CONFIG;
 const v=raw as Record<string,unknown>;
 const provider=providers.includes(v.provider as AiProvider)?v.provider as AiProvider:"gemini";
 const model=typeof v.model==="string"&&validAiModel(v.model)?v.model:AI_DEFAULT_MODELS[provider];
 const integer=(n:unknown,fallback:number,min:number,max:number)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max?Number(n):fallback;
 return {
  enabled:v.enabled===true,provider,model,
  dailyUserLimit:integer(v.dailyUserLimit,10,1,20),
  dailyGlobalLimit:integer(v.dailyGlobalLimit,80,1,300),
  maxOutputTokens:integer(v.maxOutputTokens,900,250,1500)
 };
}
export function providerKey(provider:AiProvider):string{
 if(provider==="gemini")return process.env.GEMINI_API_KEY?.trim()??"";
 if(provider==="deepseek")return process.env.DEEPSEEK_API_KEY?.trim()??"";
 return process.env.OPENAI_API_KEY?.trim()??"";
}
export function aiIsAvailable(config:AiConfig):boolean{
 return config.enabled&&!!providerKey(config.provider);
}
function parseResponse(provider:AiProvider,value:unknown):string{
 if(!value||typeof value!=="object")return "";
 const v=value as Record<string,unknown>;
 if(provider==="gemini"){
  const candidates=v.candidates as Array<{content?:{parts?:Array<{text?:string}>}}>|undefined;
  return candidates?.[0]?.content?.parts?.map(p=>p.text??"").join("\n").trim()??"";
 }
 if(provider==="deepseek"){
  const choices=v.choices as Array<{message?:{content?:string}}>|undefined;
  return choices?.[0]?.message?.content?.trim()??"";
 }
 const output=v.output as Array<{type?:string;content?:Array<{type?:string;text?:string}>}>|undefined;
 const text=output?.filter(x=>x.type==="message").flatMap(x=>x.content??[]).filter(x=>x.type==="output_text").map(x=>x.text??"").join("\n").trim();
 return text??"";
}
export async function askProvider(config:AiConfig,instructions:string,messages:ChatTurn[]):Promise<string>{
 const key=providerKey(config.provider);
 if(!key||!config.enabled)throw new Error("Nhà cung cấp AI chưa được quản trị viên bật và cấu hình API key.");
 const signal=AbortSignal.timeout(18000);
 let url:string;
 let headers:Record<string,string>={"content-type":"application/json"};
 let body:unknown;
 if(config.provider==="gemini"){
  url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(config.model)+":generateContent";
  headers["x-goog-api-key"]=key;
  body={
   systemInstruction:{parts:[{text:instructions}]},
   contents:messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]})),
   generationConfig:{maxOutputTokens:config.maxOutputTokens,temperature:0.4}
  };
 }else if(config.provider==="deepseek"){
  url="https://api.deepseek.com/chat/completions";
  headers.authorization="Bearer "+key;
  body={
   model:config.model,messages:[{role:"system",content:instructions},...messages],
   thinking:{type:"disabled"},max_tokens:config.maxOutputTokens,temperature:0.45,stream:false
  };
 }else{
  url="https://api.openai.com/v1/responses";
  headers.authorization="Bearer "+key;
  body={
   model:config.model,instructions,
   input:messages,max_output_tokens:config.maxOutputTokens,store:false
  };
 }
 let result:Response;
 try{
  result=await fetch(url,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store",signal});
 }catch(error){
  if(error instanceof Error&&error.name==="TimeoutError")throw new Error("AI phản hồi quá chậm; vui lòng thử lại.");
  throw new Error("Không kết nối được máy chủ "+config.provider+".");
 }
 if(!result.ok){
  if(result.status===401||result.status===403)throw new Error("API key không có quyền sử dụng mô hình này. Quản trị viên cần kiểm tra khóa.");
  if(result.status===404)throw new Error("Mã model không tồn tại hoặc chưa được cấp quyền; hãy đổi model trong Admin AI.");
  if(result.status===429)throw new Error("Nhà cung cấp báo giới hạn truy cập/chi phí. Vui lòng thử sau.");
  throw new Error("API "+config.provider+" trả lỗi HTTP "+result.status+". Không có yêu cầu nào được tự động thử lại.");
 }
 let parsed:unknown;
 try{parsed=await result.json();}catch{throw new Error("Nhà cung cấp trả dữ liệu không hợp lệ.");}
 const answer=parseResponse(config.provider,parsed).slice(0,7000);
 if(!answer)throw new Error("Mô hình chưa trả lời bằng văn bản; thử câu hỏi khác hoặc đổi model.");
 return answer;
}
