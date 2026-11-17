"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import type {SupabaseClient} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/browser";
type QueryResult<T>={data:T|null;error:{message:string;code?:string}|null};
function retryable(error:unknown){
 if(!(error instanceof Error))return false;
 return /failed to fetch|network|fetch failed|timeout|networkerror|load failed|econnreset|etimedout/i.test(error.message);
}
function delay(ms:number){return new Promise<void>(resolve=>setTimeout(resolve,ms));}
export function useSupabase(){
 const client=useMemo(()=>createClient(),[]);
 const [authState,setAuthState]=useState<"loading"|"signed-in"|"signed-out"|"error">("loading");
 useEffect(()=>{
  let mounted=true;
  const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>{
   if(mounted)setAuthState(session?.user?"signed-in":"signed-out");
  });
  void client.auth.getSession().then(({data,error})=>{
   if(mounted)setAuthState(error?"error":data.session?.user?"signed-in":"signed-out");
  }).catch(()=>{if(mounted)setAuthState("error");});
  return()=>{mounted=false;subscription.unsubscribe();};
 },[client]);
 const readWithRetry=useCallback(async <T,>(query:(client:SupabaseClient)=>PromiseLike<QueryResult<T>>):Promise<T>=>{
  // createBrowserClient automatically attaches and refreshes the access token.
  // Retry reads only. Never retry writes, which may be non-idempotent.
  for(let attempt=0;attempt<=3;attempt++){
   try{
    const result=await query(client);
    if(result.error)throw new Error(result.error.message);
    return result.data as T;
   }catch(error){
    if(attempt===3||!retryable(error))throw error;
    await delay(200*2**attempt);
   }
  }
  throw new Error("Read failed");
 },[client]);
 return {client,authState,readWithRetry};
}
