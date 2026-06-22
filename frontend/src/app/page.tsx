"use client";

import { type FormEvent, useEffect, useState } from "react";

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

type WorkOrder = {
  id: number;
  product_name: string;
  planned_quantity: number;
  status: string;
};

type WorkOrderCardProps = {
  workOrder: WorkOrder;
  isSelected: boolean;
  onSelect: (workOrderId: number) => void;
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
type WorkOrdersStatus = "加载中" | "已加载" | "加载失败";
type WorkOrderDetailStatus = "未选择" | "加载中" | "已加载" | "加载失败";
type NewWorkOrderStatus = "待生产" | "生产中" | "已完成";
type CreateWorkOrderStatus = "未提交" | "提交中" | "创建成功" | "创建失败";

async function requestWorkOrders() {
  const response = await fetch("http://127.0.0.1:8000/work-orders");

  if (!response.ok) {
    throw new Error("工单列表加载失败");
  }

  const data: WorkOrder[] = await response.json();
  return data;
}

function getWorkOrderStatusStyle(status: string) {
  if (status === "生产中") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "待生产") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "已完成") {
    return "bg-emerald-100 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

function WorkOrderCard({ workOrder, isSelected, onSelect }: WorkOrderCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(workOrder.id)}
      className={`rounded-xl border bg-white p-5 text-left transition hover:border-blue-300 hover:shadow-sm ${
        isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">工单编号：{workOrder.id}</p>
          <h3 className="mt-1 font-semibold text-slate-900">{workOrder.product_name}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${getWorkOrderStatusStyle(
            workOrder.status,
          )}`}
        >
        {workOrder.status}
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">计划数量：{workOrder.planned_quantity} 件</p>
    </button>
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
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrdersStatus, setWorkOrdersStatus] = useState<WorkOrdersStatus>("加载中");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [workOrderDetailStatus, setWorkOrderDetailStatus] =
    useState<WorkOrderDetailStatus>("未选择");
  const [productName, setProductName] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [newWorkOrderStatus, setNewWorkOrderStatus] = useState<NewWorkOrderStatus>("待生产");
  const [createWorkOrderStatus, setCreateWorkOrderStatus] =
    useState<CreateWorkOrderStatus>("未提交");

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

  useEffect(() => {
    async function loadWorkOrders() {
      try {
        const data = await requestWorkOrders();
        setWorkOrders(data);
        setWorkOrdersStatus("已加载");
      } catch {
        setWorkOrdersStatus("加载失败");
      }
    }

    loadWorkOrders();
  }, []);

  async function createWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateWorkOrderStatus("提交中");

    try {
      const response = await fetch("http://127.0.0.1:8000/work-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_name: productName.trim(),
          planned_quantity: Number(plannedQuantity),
          status: newWorkOrderStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("创建工单失败");
      }

      const createdWorkOrder: WorkOrder = await response.json();
      const latestWorkOrders = await requestWorkOrders();

      setWorkOrders(latestWorkOrders);
      setWorkOrdersStatus("已加载");
      setSelectedWorkOrder(createdWorkOrder);
      setWorkOrderDetailStatus("已加载");
      setProductName("");
      setPlannedQuantity("");
      setNewWorkOrderStatus("待生产");
      setCreateWorkOrderStatus("创建成功");
    } catch {
      setCreateWorkOrderStatus("创建失败");
    }
  }

  async function loadWorkOrderDetail(workOrderId: number) {
    setWorkOrderDetailStatus("加载中");

    try {
      const response = await fetch(`http://127.0.0.1:8000/work-orders/${workOrderId}`);

      if (!response.ok) {
        throw new Error("工单详情加载失败");
      }

      const data: WorkOrder = await response.json();
      setSelectedWorkOrder(data);
      setWorkOrderDetailStatus("已加载");
    } catch {
      setSelectedWorkOrder(null);
      setWorkOrderDetailStatus("加载失败");
    }
  }

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
          <StatCard
            label="当前工单"
            value={workOrdersStatus === "已加载" ? String(workOrders.length) : "-"}
            description="数据来自后端工单列表接口"
          />
          <StatCard label="今日产量" value="1,280" description="计划完成率 85%" />
          <StatCard label="异常报警" value="3" description="其中 1 个待处理" />
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">创建工单</h2>
              <p className="mt-1 text-sm text-slate-500">通过 POST 接口新增一条模拟工单</p>
            </div>
            <span className="text-sm text-slate-500">{createWorkOrderStatus}</span>
          </div>

          <form
            onSubmit={createWorkOrder}
            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 lg:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              产品名称
              <input
                value={productName}
                onChange={(event) => setProductName(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="例如：电芯测试工单"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              计划数量
              <input
                value={plannedQuantity}
                onChange={(event) => setPlannedQuantity(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                min="1"
                placeholder="例如：200"
                type="number"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              状态
              <select
                value={newWorkOrderStatus}
                onChange={(event) =>
                  setNewWorkOrderStatus(event.target.value as NewWorkOrderStatus)
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="待生产">待生产</option>
                <option value="生产中">生产中</option>
                <option value="已完成">已完成</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={!productName.trim() || Number(plannedQuantity) <= 0}
              className="self-end rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {createWorkOrderStatus === "提交中" ? "创建中" : "创建工单"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">工单列表</h2>
              <p className="mt-1 text-sm text-slate-500">从 FastAPI 后端读取当前模拟工单</p>
            </div>
            <span className="text-sm text-slate-500">{workOrdersStatus}</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="grid gap-4 md:grid-cols-2">
              {workOrders.map((workOrder) => (
                <WorkOrderCard
                  key={workOrder.id}
                  workOrder={workOrder}
                  isSelected={selectedWorkOrder?.id === workOrder.id}
                  onSelect={loadWorkOrderDetail}
                />
              ))}
            </div>

            <article className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">工单详情</h3>
                  <p className="mt-1 text-sm text-slate-500">{workOrderDetailStatus}</p>
                </div>
                {selectedWorkOrder ? (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getWorkOrderStatusStyle(
                      selectedWorkOrder.status,
                    )}`}
                  >
                    {selectedWorkOrder.status}
                  </span>
                ) : null}
              </div>

              {selectedWorkOrder ? (
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-slate-500">工单编号</dt>
                    <dd className="mt-1 font-medium text-slate-900">{selectedWorkOrder.id}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">产品名称</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedWorkOrder.product_name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">计划数量</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {selectedWorkOrder.planned_quantity} 件
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-5 text-sm text-slate-500">暂无工单详情</p>
              )}
            </article>
          </div>
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
