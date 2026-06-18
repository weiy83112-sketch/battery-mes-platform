from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="微型动力电池 MES 云平台")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.get("/work-orders/{work_order_id}")
def get_work_order(work_order_id: int) -> dict[str, int]:
    """返回指定工单编号，用于学习路径参数。"""
    return {"work_order_id": work_order_id}
