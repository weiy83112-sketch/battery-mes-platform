"use client";

import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";
const inputStyle =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

type WorkOrder = {
  id: number;
  product_name: string;
  planned_quantity: number;
  status: string;
  created_at: string;
};

type ProductBarcode = {
  id: number;
  barcode: string;
  work_order_id: number;
  status: string;
  created_at: string;
};

type StationPass = {
  id: number;
  barcode_id: number;
  station_name: string;
  station_code: string;
  equipment_code: string;
  operator: string;
  result: string;
  passed_at: string;
};

type DeviceData = {
  id: number;
  barcode_id: number;
  station_pass_id: number | null;
  equipment_code: string;
  parameter_name: string;
  value: number;
  unit: string;
  lower_limit: number | null;
  upper_limit: number | null;
  is_abnormal: boolean;
  collected_at: string;
};

type Alarm = {
  id: number;
  barcode_id: number;
  device_data_id: number | null;
  alarm_type: string;
  message: string;
  level: string;
  status: string;
  created_at: string;
};

type Traceability = {
  product: ProductBarcode;
  work_order: WorkOrder;
  station_passes: StationPass[];
  device_data: DeviceData[];
  alarms: Alarm[];
};

type Dashboard = {
  work_orders: number;
  products: number;
  station_passes: number;
  pending_alarms: number;
};

type Tab = "overview" | "collection" | "trace";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? "请求失败，请确认后端服务已启动");
  }
  return response.json() as Promise<T>;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: string }) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
    red: "bg-rose-50 text-rose-700 ring-rose-600/10",
    slate: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}>
      {children}
    </span>
  );
}

function statusTone(status: string) {
  if (["已完成", "通过", "正常"].includes(status)) return "green";
  if (["生产中", "运行中"].includes(status)) return "blue";
  if (["异常", "失败", "待处理"].includes(status)) return "red";
  return "amber";
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [online, setOnline] = useState<boolean | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([]);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [message, setMessage] = useState("正在读取生产数据…");

  const [productName, setProductName] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [barcode, setBarcode] = useState("");
  const [barcodeWorkOrder, setBarcodeWorkOrder] = useState("1001");

  const [passBarcode, setPassBarcode] = useState("BAT-2026-0001");
  const [stationName, setStationName] = useState("模组测试站");
  const [stationCode, setStationCode] = useState("ST-TEST-01");
  const [passEquipment, setPassEquipment] = useState("EQ-002");
  const [operator, setOperator] = useState("操作员01");

  const [dataBarcode, setDataBarcode] = useState("BAT-2026-0001");
  const [dataEquipment, setDataEquipment] = useState("EQ-002");
  const [parameterName, setParameterName] = useState("绝缘电阻");
  const [parameterValue, setParameterValue] = useState("15");
  const [parameterUnit, setParameterUnit] = useState("MΩ");
  const [lowerLimit, setLowerLimit] = useState("10");
  const [upperLimit, setUpperLimit] = useState("20");

  const [traceQuery, setTraceQuery] = useState("BAT-2026-0001");
  const [trace, setTrace] = useState<Traceability | null>(null);
  const [traceError, setTraceError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [health, summary, orders, products, alarmList] = await Promise.all([
        api<{ status: string }>("/health"),
        api<Dashboard>("/dashboard"),
        api<WorkOrder[]>("/work-orders"),
        api<ProductBarcode[]>("/barcodes"),
        api<Alarm[]>("/alarms"),
      ]);
      setOnline(health.status === "ok");
      setDashboard(summary);
      setWorkOrders(orders);
      setBarcodes(products);
      setAlarms(alarmList);
      setMessage("数据已同步");
    } catch (error) {
      setOnline(false);
      setMessage(error instanceof Error ? error.message : "数据加载失败");
    }
  }, []);

  useEffect(() => {
    // 推迟到当前渲染结束后加载，避免 effect 内同步触发一串状态更新。
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function submit(
    path: string,
    body: Record<string, unknown>,
    successMessage: string,
    after?: () => void,
  ) {
    setMessage("正在提交…");
    try {
      await api(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMessage(successMessage);
      after?.();
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交失败");
    }
  }

  function createWorkOrder(event: FormEvent) {
    event.preventDefault();
    void submit(
      "/work-orders",
      { product_name: productName.trim(), planned_quantity: Number(plannedQuantity), status: "待生产" },
      "工单创建成功",
      () => {
        setProductName("");
        setPlannedQuantity("");
      },
    );
  }

  function createBarcode(event: FormEvent) {
    event.preventDefault();
    void submit(
      "/barcodes",
      { barcode: barcode.trim(), work_order_id: Number(barcodeWorkOrder), status: "生产中" },
      "产品条码建档成功",
      () => setBarcode(""),
    );
  }

  function createStationPass(event: FormEvent) {
    event.preventDefault();
    void submit(
      "/station-passes",
      {
        barcode: passBarcode.trim(),
        station_name: stationName.trim(),
        station_code: stationCode.trim(),
        equipment_code: passEquipment.trim(),
        operator: operator.trim(),
        result: "通过",
      },
      "扫码过站记录成功",
    );
  }

  function createDeviceData(event: FormEvent) {
    event.preventDefault();
    const value = Number(parameterValue);
    const low = lowerLimit === "" ? null : Number(lowerLimit);
    const high = upperLimit === "" ? null : Number(upperLimit);
    const abnormal = (low !== null && value < low) || (high !== null && value > high);
    void submit(
      "/device-data",
      {
        barcode: dataBarcode.trim(),
        equipment_code: dataEquipment.trim(),
        parameter_name: parameterName.trim(),
        value,
        unit: parameterUnit.trim(),
        lower_limit: low,
        upper_limit: high,
      },
      abnormal ? "数据已采集，并自动生成超限报警" : "设备数据采集成功，参数正常",
    );
  }

  async function searchTrace(event?: FormEvent) {
    event?.preventDefault();
    setTraceError("");
    setTrace(null);
    try {
      const result = await api<Traceability>(`/traceability/${encodeURIComponent(traceQuery.trim())}`);
      setTrace(result);
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : "追溯查询失败");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.28em] text-blue-400">BATTERY MES · V0.6</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">动力电池制造执行平台</h1>
            <p className="mt-1 text-sm text-slate-400">工单、条码、过站、设备参数与质量追溯</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-slate-300">{message}</span>
            <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${online ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>
              <i className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : online === null ? "bg-amber-400" : "bg-rose-400"}`} />
              后端{online ? "在线" : online === null ? "检查中" : "离线"}
            </span>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 px-6 py-2">
          {([
            ["overview", "生产总览"],
            ["collection", "生产采集"],
            ["trace", "追溯查询"],
          ] as [Tab, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === value ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {tab === "overview" && (
          <div className="space-y-8">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["工单总数", dashboard?.work_orders ?? "-", "生产任务"],
                ["产品建档", dashboard?.products ?? "-", "唯一条码"],
                ["过站次数", dashboard?.station_passes ?? "-", "生产履历"],
                ["待处理报警", dashboard?.pending_alarms ?? "-", "质量风险"],
              ].map(([label, value, hint], index) => (
                <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className={`mb-5 h-1.5 w-10 rounded-full ${index === 3 ? "bg-rose-500" : "bg-blue-600"}`} />
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{hint}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionTitle title="工单管理" description="创建生产任务，数据持久保存到 SQLite" />
                <form onSubmit={createWorkOrder} className="mt-5 grid gap-3 md:grid-cols-[1fr_160px_auto]">
                  <input required value={productName} onChange={(e) => setProductName(e.target.value)} className={inputStyle.replace("mt-2 ", "")} placeholder="产品名称，例如：液冷电池包" />
                  <input required min="1" type="number" value={plannedQuantity} onChange={(e) => setPlannedQuantity(e.target.value)} className={inputStyle.replace("mt-2 ", "")} placeholder="计划数量" />
                  <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">创建工单</button>
                </form>
                <div className="mt-6 divide-y divide-slate-100">
                  {workOrders.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <p className="font-semibold">{order.product_name}</p>
                        <p className="mt-1 text-xs text-slate-500">WO-{order.id} · 计划 {order.planned_quantity} 件</p>
                      </div>
                      <Badge tone={statusTone(order.status)}>{order.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionTitle title="产品条码建档" description="把唯一条码绑定到生产工单" />
                <form onSubmit={createBarcode} className="mt-5 space-y-4">
                  <label className="text-sm font-medium text-slate-700">产品条码
                    <input required value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputStyle} placeholder="例如：BAT-2026-0002" />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">所属工单
                    <select value={barcodeWorkOrder} onChange={(e) => setBarcodeWorkOrder(e.target.value)} className={inputStyle}>
                      {workOrders.map((order) => <option key={order.id} value={order.id}>WO-{order.id} · {order.product_name}</option>)}
                    </select>
                  </label>
                  <button className="w-full rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">保存条码</button>
                </form>
                <div className="mt-6 flex flex-wrap gap-2">
                  {barcodes.map((item) => (
                    <button key={item.id} type="button" onClick={() => { setTraceQuery(item.barcode); setTab("trace"); }} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300">
                      {item.barcode}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionTitle title="最近报警" description="采集值超出阈值时由系统自动生成" />
              {alarms.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {alarms.slice(0, 6).map((alarm) => (
                    <article key={alarm.id} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                      <div className="flex items-center justify-between"><p className="font-semibold text-rose-900">{alarm.alarm_type}</p><Badge tone="red">{alarm.status}</Badge></div>
                      <p className="mt-2 text-sm text-rose-800">{alarm.message}</p>
                      <p className="mt-2 text-xs text-rose-500">{formatTime(alarm.created_at)}</p>
                    </article>
                  ))}
                </div>
              ) : <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">当前没有报警，产线参数正常。</p>}
            </section>
          </div>
        )}

        {tab === "collection" && (
          <div className="space-y-6">
            <SectionTitle title="生产过程采集" description="依次完成扫码过站和设备参数上传；参数超限会自动报警" />
            <div className="grid gap-6 lg:grid-cols-2">
              <form onSubmit={createStationPass} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 font-bold text-white">1</span><h3 className="font-bold">扫码过站</h3></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">产品条码<input required value={passBarcode} onChange={(e) => setPassBarcode(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">工站名称<input required value={stationName} onChange={(e) => setStationName(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">工站编号<input required value={stationCode} onChange={(e) => setStationCode(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">设备编号<input required value={passEquipment} onChange={(e) => setPassEquipment(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">操作人员<input required value={operator} onChange={(e) => setOperator(e.target.value)} className={inputStyle} /></label>
                </div>
                <button className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">确认通过工站</button>
              </form>

              <form onSubmit={createDeviceData} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 font-bold text-white">2</span><h3 className="font-bold">设备数据上传</h3></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">产品条码<input required value={dataBarcode} onChange={(e) => setDataBarcode(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">设备编号<input required value={dataEquipment} onChange={(e) => setDataEquipment(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">参数名称<input required value={parameterName} onChange={(e) => setParameterName(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">采集值<input required type="number" step="any" value={parameterValue} onChange={(e) => setParameterValue(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">单位<input required value={parameterUnit} onChange={(e) => setParameterUnit(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">下限<input type="number" step="any" value={lowerLimit} onChange={(e) => setLowerLimit(e.target.value)} className={inputStyle} /></label>
                  <label className="text-sm font-medium text-slate-700">上限<input type="number" step="any" value={upperLimit} onChange={(e) => setUpperLimit(e.target.value)} className={inputStyle} /></label>
                </div>
                <button className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700">上传并判断阈值</button>
              </form>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              体验异常报警：把“绝缘电阻”采集值改成 8（下限为 10），提交后系统会自动生成“参数超限”报警。
            </div>
          </div>
        )}

        {tab === "trace" && (
          <div className="space-y-6">
            <SectionTitle title="产品全流程追溯" description="输入唯一产品条码，反查工单、过站、设备参数和报警信息" />
            <form onSubmit={searchTrace} className="flex flex-col gap-3 rounded-2xl bg-slate-950 p-5 shadow-lg sm:flex-row">
              <input value={traceQuery} onChange={(e) => setTraceQuery(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-400" placeholder="输入产品条码" />
              <button className="rounded-xl bg-blue-500 px-7 py-3 text-sm font-bold text-white hover:bg-blue-400">开始追溯</button>
            </form>
            <div className="flex flex-wrap gap-2">
              <span className="py-1 text-xs text-slate-400">已有条码：</span>
              {barcodes.map((item) => <button key={item.id} type="button" onClick={() => setTraceQuery(item.barcode)} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm hover:text-blue-600">{item.barcode}</button>)}
            </div>

            {traceError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{traceError}</div>}
            {!trace && !traceError && <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center"><div><p className="text-lg font-semibold text-slate-700">等待追溯查询</p><p className="mt-1 text-sm text-slate-400">演示条码：BAT-2026-0001</p></div></div>}

            {trace && (
              <div className="space-y-6">
                <section className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">产品身份</p><p className="mt-3 text-lg font-bold">{trace.product.barcode}</p><div className="mt-3"><Badge tone={statusTone(trace.product.status)}>{trace.product.status}</Badge></div></article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">来源工单</p><p className="mt-3 text-lg font-bold">WO-{trace.work_order.id}</p><p className="mt-1 text-sm text-slate-500">{trace.work_order.product_name} · {trace.work_order.planned_quantity} 件</p></article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">质量结论</p><p className={`mt-3 text-lg font-bold ${trace.alarms.length ? "text-rose-600" : "text-emerald-600"}`}>{trace.alarms.length ? `发现 ${trace.alarms.length} 条报警` : "生产数据正常"}</p><p className="mt-1 text-sm text-slate-500">{trace.station_passes.length} 次过站 · {trace.device_data.length} 条参数</p></article>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <SectionTitle title="生产时间线" description="按发生时间展示产品完整制造履历" />
                  <div className="relative mt-6 space-y-6 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-slate-200">
                    {trace.station_passes.map((item) => (
                      <div key={`pass-${item.id}`} className="relative flex gap-4"><span className="z-[1] mt-1 h-9 w-9 shrink-0 rounded-full border-4 border-white bg-blue-500 shadow-sm" /><div className="flex-1 rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">过站 · {item.station_name}</p><Badge tone={statusTone(item.result)}>{item.result}</Badge></div><p className="mt-2 text-sm text-slate-600">{item.station_code} · {item.equipment_code} · 操作人 {item.operator}</p><p className="mt-2 text-xs text-slate-400">{formatTime(item.passed_at)}</p></div></div>
                    ))}
                    {trace.device_data.map((item) => (
                      <div key={`data-${item.id}`} className="relative flex gap-4"><span className={`z-[1] mt-1 h-9 w-9 shrink-0 rounded-full border-4 border-white shadow-sm ${item.is_abnormal ? "bg-rose-500" : "bg-violet-500"}`} /><div className={`flex-1 rounded-xl p-4 ${item.is_abnormal ? "bg-rose-50" : "bg-slate-50"}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">参数 · {item.parameter_name}</p><Badge tone={item.is_abnormal ? "red" : "green"}>{item.is_abnormal ? "异常" : "正常"}</Badge></div><p className="mt-2 text-sm text-slate-600">实测 <b>{item.value} {item.unit}</b> · 范围 {item.lower_limit ?? "-"} ～ {item.upper_limit ?? "-"} {item.unit} · {item.equipment_code}</p><p className="mt-2 text-xs text-slate-400">{formatTime(item.collected_at)}</p></div></div>
                    ))}
                    {!trace.station_passes.length && !trace.device_data.length && <p className="pl-14 text-sm text-slate-500">该产品尚无生产过程记录。</p>}
                  </div>
                </section>

                {trace.alarms.length > 0 && <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><SectionTitle title="关联质量报警" description="该产品生产过程中触发的异常记录" /><div className="mt-5 space-y-3">{trace.alarms.map((alarm) => <article key={alarm.id} className="rounded-xl border border-rose-200 bg-white p-4"><div className="flex items-center justify-between"><p className="font-bold text-rose-900">{alarm.alarm_type}</p><Badge tone="red">{alarm.level} · {alarm.status}</Badge></div><p className="mt-2 text-sm text-rose-800">{alarm.message}</p><p className="mt-2 text-xs text-rose-400">{formatTime(alarm.created_at)}</p></article>)}</div></section>}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
