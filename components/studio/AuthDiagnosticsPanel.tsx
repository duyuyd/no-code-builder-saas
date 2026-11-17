"use client";
import {useState} from "react";
import {runAuthRoundTrip,type AuthProbe} from "@/app/auth-diagnostics/actions";
export default function AuthDiagnosticsPanel(){
 const [result,setResult]=useState<AuthProbe|null>(null);const [loading,setLoading]=useState(false);
 return <section className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-4 text-white">
  <h2 className="text-lg font-bold">Kiểm tra Supabase production</h2>
  <p className="text-xs text-slate-400">Chạy bằng phiên đăng nhập thực của bạn, thêm bản ghi kiểm tra, đọc lại và xóa ngay. Không sửa dự án và không hiển thị token.</p>
  <button disabled={loading} onClick={async()=>{setLoading(true);try{setResult(await runAuthRoundTrip());}finally{setLoading(false);}}} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold disabled:opacity-50">Chạy kiểm tra xác thực / dữ liệu</button>
  {result&&<div role="status" className="space-y-2 rounded-lg bg-slate-800 p-3 text-sm">
   <p className={result.ok?"text-emerald-300":"text-rose-300"}>{result.message}</p>
   <p>Phiên đăng nhập: {result.auth?"PASS":"FAIL"}</p><p>Ghi dữ liệu: {result.write?"PASS":"FAIL"}</p><p>Đọc lại dữ liệu: {result.read?"PASS":"FAIL"}</p><p>Dọn bản ghi kiểm tra: {result.cleanup?"PASS":"FAIL"}</p>
  </div>}
 </section>;
}
