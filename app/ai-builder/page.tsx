import type {Metadata} from "next";
import AiAppBuilderWorkspace from "@/components/ai/AiAppBuilderWorkspace";
export const metadata:Metadata={title:"AI App Builder | NuvoraCraft",description:"Create a website from a prompt and edit it visually with NuvoraCraft. Model Puter FREE creates validated UI saved in Supabase.",robots:{index:true,follow:true}};
export default async function AiBuilderPage({searchParams}:{searchParams:Promise<{prompt?:string}>}){const params=await searchParams;return <AiAppBuilderWorkspace initialPrompt={typeof params.prompt==="string"?params.prompt.slice(0,850):""}/>;}
