import type { BuilderNode } from "@/lib/component-registry";
type ExportPage={path:string;ui_tree:BuilderNode[]};
export function generateReactNativeSource(pages:ExportPage[]):string{
 if(!pages.length)throw new Error("Missing project pages");
 const serialized=JSON.stringify(pages).replace(/</g,"\\u003c");
 return `import React from "react";
import {SafeAreaView,ScrollView,Text,View,Image,Pressable,Linking,TextInput} from "react-native";
type Node={id:string;type:string;props:Record<string,string>;children:Node[]};
type Page={path:string;ui_tree:Node[]};
const pages:Page[]=${serialized};
const safeUrl=(url:string)=>/^https:\\/\\//i.test(url)?url:"";
function renderNode(node:Node):React.ReactNode{
 const p=node.props||{};
 const children=(node.children||[]).map(n=><React.Fragment key={n.id}>{renderNode(n)}</React.Fragment>);
 if(node.type==="text"||node.type==="heading"||node.type==="paragraph")return <Text style={{fontSize:node.type==="heading"?24:16,color:"#111827",marginBottom:8}}>{p.text||p.title||""}</Text>;
 if(node.type==="image"&&safeUrl(p.src||""))return <Image source={{uri:p.src}} style={{width:"100%",height:200,resizeMode:"contain"}}/>;
 if(node.type==="button"||node.type==="link")return <Pressable onPress={()=>{const u=safeUrl(p.href||"");if(u)void Linking.openURL(u);}} style={{backgroundColor:"#ea580c",borderRadius:8,padding:12,marginBottom:8}}><Text style={{color:"#ffffff"}}>{p.text||p.label||"Mở"}</Text></Pressable>;
 if(node.type==="input"||node.type==="textarea")return <TextInput placeholder={p.placeholder||""} multiline={node.type==="textarea"} style={{borderWidth:1,borderColor:"#cbd5e1",padding:12,borderRadius:8,marginBottom:8}}/>;
 if(["container","section","row","column","card","grid"].includes(node.type))return <View style={{padding:8,marginBottom:4}}>{children}</View>;
 return <View style={{padding:8,borderWidth:1,borderColor:"#cbd5e1",marginBottom:6}}><Text>{node.type} — native renderer chưa hỗ trợ</Text>{children}</View>;
}
export default function App(){const first=pages.find(p=>p.path==="/")||pages[0];return <SafeAreaView style={{flex:1,backgroundColor:"#fff"}}><ScrollView contentContainerStyle={{padding:16}}>{first?.ui_tree.map(n=><React.Fragment key={n.id}>{renderNode(n)}</React.Fragment>)}</ScrollView></SafeAreaView>;}
`;
}
