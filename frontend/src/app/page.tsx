"use client";

import { useEffect, useState } from "react";

type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

type DeviceStatusCardProps = {
  name: string;
  code: string;
  status: "运行中" | "待机" | "异常";
};

const devices: DeviceStatusCardProps[] = [
  { name: "激光焊接机", code: "EQ-001", status: "运行中" },
  { name: "模组测试机", code: "EQ-002", status: "待机" },
  { name: "电池包装配机", code: "EQ-003", status: "异常" },
];

const statusStyles: Record<DeviceStatusCardProps["status"], string> = {
  运行中: "bg-emerald-100 text-emerald-700",
  待机: "bg-amber-100 text-amber-700",
  异常: "bg-rose-100 text-rose-700",
};

type BackendStatus = "检查中" | "在线" | "离线";

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

function DeviceStatusCard({ name, code, status }: DeviceStatusCardProps) {
  return (
    <article className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="font-semibold text-slate-900">{name}</p>
        <p className="mt-1 text-sm text-slate-500">设备编号：{code}</p>
      </div>
      <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[status]}`}>
        {status}
      </span>
    </article>
  );
}

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("检查中");

  useEffect(() => {
    async function checkBackendHealth() {
      try {
        const response = await fetch("http://127.0.0.1:8000/health");

        if (!response.ok) {
          throw new Error("后端健康检查失败");
        }

        const data: { status: string } = await response.json();
        setBackendStatus(data.status === "ok" ? "在线" : "离线");
      } catch {
        setBackendStatus("离线");
      }
    }

    checkBackendHealth();
  }, []);

  const backendStatusStyle =
    backendStatus === "在线"
      ? "bg-emerald-100 text-emerald-700"
      : backendStatus === "检查中"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <header>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-blue-600">BATTERY MES</p>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${backendStatusStyle}`}>
              后端服务：{backendStatus}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold">微型动力电池 MES 云平台</h1>
          <p className="mt-3 text-slate-600">
            当前设备和统计数据为静态测试数据，服务状态来自 FastAPI 后端。
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="今日工单" value="12" description="其中 8 个正在生产" />
          <StatCard label="今日产量" value="1,280" description="计划完成率 85%" />
          <StatCard label="异常报警" value="3" description="其中 1 个待处理" />
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">设备状态</h2>
            <p className="mt-1 text-sm text-slate-500">当前展示 3 台模拟设备</p>
          </div>

          <div className="grid gap-4">
            {devices.map((device) => (
              <DeviceStatusCard
                key={device.code}
                name={device.name}
                code={device.code}
                status={device.status}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
