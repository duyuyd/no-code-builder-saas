import type {Metadata} from "next";
import AiAppBuilderWorkspace from "@/components/ai/AiAppBuilderWorkspace";
export const metadata:Metadata={title:"AI App Builder | NuvoraCraft",description:"Create a website from a prompt and edit it visually with NuvoraCraft. OpenAI generated UI is saved in Supabase.",robots:{index:true,follow:true}};
export default function AiBuilderPage(){return <AiAppBuilderWorkspace/>;}
