"use client";
import { useActionState } from "react";
import { updateSettings } from "@/app/(admin)/settings/actions";
export default function AdminSettingsForm({ title, color }: { title: string; color: string }) {
  const [state, action, pending] = useActionState(updateSettings, { ok: false, message: "" });
  return <form action={action} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
    <label className="block text-sm font-medium">Tiêu đề nền tảng
      <input className="mt-2 w-full rounded border p-3" name="site_title" minLength={2} maxLength={120} required defaultValue={title} />
    </label>
    <label className="block text-sm font-medium">Màu chủ đạo
      <input className="mt-2 block h-14 w-24 cursor-pointer rounded border p-1" name="primary_color" type="color" defaultValue={color} />
    </label>
    {state.message && <p role="status" className={state.ok ? "text-green-700" : "text-red-700"}>{state.message}</p>}
    <button disabled={pending} className="brand-bg rounded-lg px-5 py-3 font-semibold text-white disabled:opacity-50">
      {pending ? "Đang lưu..." : "Lưu cấu hình"}
    </button>
  </form>;
}
