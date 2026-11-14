import {getDefinition,safeUrl,type BuilderNode} from "./component-registry";
export type StudioDiagnosis={
 total:number;gridCount:number;grids:Array<{path:string;columns:number;children:number}>;
 emptyImages:number;configuredImages:number;buttonsWithoutAction:number;deepest:number;
};
export function diagnosePage(nodes:BuilderNode[]):StudioDiagnosis{
 const report:StudioDiagnosis={total:0,gridCount:0,grids:[],emptyImages:0,configuredImages:0,buttonsWithoutAction:0,deepest:0};
 const visit=(list:BuilderNode[],parents:string[],depth:number)=>{
  for(const node of list){
   const def=getDefinition(node.type);
   if(!def)continue;
   report.total++;report.deepest=Math.max(report.deepest,depth);
   const branch=[...parents,def.label].slice(-5);
   const isGrid=node.type==="grid"||node.type.endsWith("-grid");
   if(isGrid){
    report.gridCount++;
    report.grids.push({path:branch.join(" › "),columns:Math.max(1,Math.min(6,Number(node.style.gridColumns)||2)),children:node.children.length});
   }
   if(def.kind==="image"){if(safeUrl(node.props.src??""))report.configuredImages++;else report.emptyImages++;}
   if(def.kind==="button"&&node.type!=="submit-button"&&!safeUrl(node.props.href??""))report.buttonsWithoutAction++;
   if(node.children.length)visit(node.children,branch,depth+1);
  }
 };
 visit(nodes,[],1);
 return report;
}
export function explainMobileLayout(report:StudioDiagnosis,pagePath:string):string{
 const multi=report.grids.filter(grid=>grid.columns>1);
 const headline="Tôi đã đọc cây giao diện đã lưu của trang "+pagePath+": "+report.total+" khối, "+report.gridCount+" Grid, "+report.emptyImages+" ảnh chưa gắn nguồn và "+report.buttonsWithoutAction+" nút chưa có liên kết.";
 const gridText=multi.length
 ?"\nCác lưới nhiều cột: "+multi.slice(0,5).map(item=>item.path+" ("+item.columns+" cột, "+item.children+" khối)").join("; ")+"."
 :"\nKhông thấy Grid nhiều cột; hãy kiểm tra khối Row hoặc kích thước cố định trong Thuộc tính.";
 return headline+gridText+
  "\nTôi đã cập nhật chế độ responsive của Studio: khi vùng xem trước hẹp hơn 620px, Grid chuyển về 1 cột. Bạn có thể mở lại Chạy thử để kiểm tra. Nếu vẫn tràn màn hình, chọn chính khối bị lỗi và gửi lại ảnh. "+
  (report.emptyImages?"\nCác ô ảnh chưa có dữ liệu thật. Mở Thuộc tính của từng khối Hình ảnh → chọn ảnh trong Kho ảnh Supabase.":"");
}
