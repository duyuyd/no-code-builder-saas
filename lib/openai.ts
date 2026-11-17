import "server-only";
import OpenAI from "openai";

/** Never instantiate in Client Components. No embedded or fallback credentials. */
export function getOpenAI():OpenAI{
 const apiKey=process.env.OPENAI_API_KEY?.trim();
 if(!apiKey)throw new Error("OPENAI_API_KEY has not been configured in server environment secrets.");
 return new OpenAI({apiKey,maxRetries:0,timeout:25_000});
}
export function openAIHttpError(error:unknown):{status:number;message:string}{
 if(error instanceof OpenAI.APIError){
  if(error.status===401||error.status===403)return {status:503,message:"OpenAI credential invalid or model access denied."};
  if(error.status===429)return {status:429,message:"OpenAI rate limit or billing quota reached."};
  return {status:502,message:"OpenAI request failed ("+(error.status??"unknown")+")."};
 }
 if(error instanceof Error&&error.message.includes("OPENAI_API_KEY"))
  return {status:503,message:"OpenAI is not configured on this deployment."};
 return {status:502,message:"OpenAI is currently unavailable."};
}
