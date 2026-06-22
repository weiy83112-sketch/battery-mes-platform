from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="微型动力电池 MES 云平台")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

work_orders = [
    {
        "id": 1001,
        "product_name": "动力电池模组",
        "planned_quantity": 500,
        "status": "生产中",
    },
    {
        "id": 1002,
        "product_name": "储能电池包",
        "planned_quantity": 300,
        "status": "待生产",
    },
    {
        "id": 1003,
        "product_name": "高压电池箱",
        "planned_quantity": 120,
        "status": "已完成",
    },
]


@app.get("/health")
def health_check() -> dict[str, str]:
    """检查后端服务是否正常运行。"""
    return {"status": "ok"}


@app.get("/work-orders")
def list_work_orders() -> list[dict[str, int | str]]:
    """返回模拟工单列表。"""
    return work_orders


@app.post("/work-orders")
def create_work_order(work_order: dict[str, int | str]) -> dict[str, int | str]:
    """创建一条新的模拟工单。"""
    if work_orders:
        max_id = max(item["id"] for item in work_orders)
    else:
        max_id = 1000

    new_work_order = {
        "id": max_id + 1,
        "product_name": work_order["product_name"],
        "planned_quantity": work_order["planned_quantity"],
        "status": work_order["status"],
    }

    work_orders.append(new_work_order)

    return new_work_order


@app.get("/work-orders/{work_order_id}")
def get_work_order(work_order_id: int) -> dict[str, int | str]:#dict[str, int | str] 字典 两个值
    """根据工单编号返回对应工单的完整信息。"""
    for work_order in work_orders:
        if work_order["id"] == work_order_id:
            return work_order

    # 如果编号不存在，返回 404，表示资源没有找到。
    raise HTTPException(status_code=404, detail="工单不存在")
