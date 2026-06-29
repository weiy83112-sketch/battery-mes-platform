from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, SessionLocal, engine, get_db


app = FastAPI(title="微型动力电池 MES 云平台", version="0.6.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_database() -> None:
    """首次运行时写入少量演示数据，方便立刻体验完整追溯。"""
    with SessionLocal() as database:
        work_order_count = database.scalar(select(func.count(models.WorkOrder.id))) or 0
        if work_order_count > 0:
            return

        work_orders = [
            models.WorkOrder(
                id=1001, product_name="动力电池模组", planned_quantity=500, status="生产中"
            ),
            models.WorkOrder(
                id=1002, product_name="储能电池包", planned_quantity=300, status="待生产"
            ),
            models.WorkOrder(
                id=1003, product_name="高压电池箱", planned_quantity=120, status="已完成"
            ),
        ]
        database.add_all(work_orders)
        database.flush()

        product = models.ProductBarcode(
            barcode="BAT-2026-0001", work_order_id=1001, status="生产中"
        )
        database.add(product)
        database.flush()

        station_pass = models.StationPass(
            barcode_id=product.id,
            station_name="模组装配站",
            station_code="ST-ASSY-01",
            equipment_code="EQ-001",
            operator="张工",
            result="通过",
        )
        database.add(station_pass)
        database.flush()

        device_record = models.DeviceData(
            barcode_id=product.id,
            station_pass_id=station_pass.id,
            equipment_code="EQ-001",
            parameter_name="焊接温度",
            value=265.0,
            unit="℃",
            lower_limit=240.0,
            upper_limit=280.0,
            is_abnormal=False,
        )
        database.add(device_record)
        database.commit()


Base.metadata.create_all(bind=engine)
seed_database()


def find_product(database: Session, barcode: str) -> models.ProductBarcode:
    product = database.scalar(
        select(models.ProductBarcode).where(models.ProductBarcode.barcode == barcode)
    )
    if product is None:
        raise HTTPException(status_code=404, detail="产品条码不存在")
    return product


@app.get("/health")
def health_check() -> dict[str, str]:
    """检查后端服务是否正常运行。"""
    return {"status": "ok"}


@app.get("/dashboard", response_model=schemas.DashboardResponse)
def dashboard(database: Session = Depends(get_db)) -> dict[str, int]:
    """返回首页所需的真实业务统计。"""
    return {
        "work_orders": database.scalar(select(func.count(models.WorkOrder.id))) or 0,
        "products": database.scalar(select(func.count(models.ProductBarcode.id))) or 0,
        "station_passes": database.scalar(select(func.count(models.StationPass.id))) or 0,
        "pending_alarms": database.scalar(
            select(func.count(models.Alarm.id)).where(models.Alarm.status == "待处理")
        )
        or 0,
    }


@app.get("/work-orders", response_model=list[schemas.WorkOrderResponse])
def list_work_orders(database: Session = Depends(get_db)):
    return database.scalars(select(models.WorkOrder).order_by(models.WorkOrder.id)).all()


@app.post("/work-orders", response_model=schemas.WorkOrderResponse, status_code=201)
def create_work_order(data: schemas.WorkOrderCreate, database: Session = Depends(get_db)):
    work_order = models.WorkOrder(**data.model_dump())
    database.add(work_order)
    database.commit()
    database.refresh(work_order)
    return work_order


@app.get("/work-orders/{work_order_id}", response_model=schemas.WorkOrderResponse)
def get_work_order(work_order_id: int, database: Session = Depends(get_db)):
    work_order = database.get(models.WorkOrder, work_order_id)
    if work_order is None:
        raise HTTPException(status_code=404, detail="工单不存在")
    return work_order


@app.get("/barcodes", response_model=list[schemas.BarcodeResponse])
def list_barcodes(
    work_order_id: int | None = Query(default=None), database: Session = Depends(get_db)
):
    statement = select(models.ProductBarcode).order_by(models.ProductBarcode.id.desc())
    if work_order_id is not None:
        statement = statement.where(models.ProductBarcode.work_order_id == work_order_id)
    return database.scalars(statement).all()


@app.post("/barcodes", response_model=schemas.BarcodeResponse, status_code=201)
def create_barcode(data: schemas.BarcodeCreate, database: Session = Depends(get_db)):
    if database.get(models.WorkOrder, data.work_order_id) is None:
        raise HTTPException(status_code=404, detail="工单不存在")

    product = models.ProductBarcode(**data.model_dump())
    database.add(product)
    try:
        database.commit()
    except IntegrityError:
        database.rollback()
        raise HTTPException(status_code=409, detail="产品条码已存在") from None
    database.refresh(product)
    return product


@app.get("/barcodes/{barcode}", response_model=schemas.BarcodeResponse)
def get_barcode(barcode: str, database: Session = Depends(get_db)):
    return find_product(database, barcode)


@app.get("/station-passes", response_model=list[schemas.StationPassResponse])
def list_station_passes(
    barcode: str | None = Query(default=None), database: Session = Depends(get_db)
):
    statement = select(models.StationPass).order_by(models.StationPass.passed_at.desc())
    if barcode:
        product = find_product(database, barcode)
        statement = statement.where(models.StationPass.barcode_id == product.id)
    return database.scalars(statement).all()


@app.post("/station-passes", response_model=schemas.StationPassResponse, status_code=201)
def create_station_pass(data: schemas.StationPassCreate, database: Session = Depends(get_db)):
    product = find_product(database, data.barcode)
    values = data.model_dump(exclude={"barcode"})
    station_pass = models.StationPass(barcode_id=product.id, **values)
    database.add(station_pass)
    database.commit()
    database.refresh(station_pass)
    return station_pass


@app.get("/device-data", response_model=list[schemas.DeviceDataResponse])
def list_device_data(
    barcode: str | None = Query(default=None), database: Session = Depends(get_db)
):
    statement = select(models.DeviceData).order_by(models.DeviceData.collected_at.desc())
    if barcode:
        product = find_product(database, barcode)
        statement = statement.where(models.DeviceData.barcode_id == product.id)
    return database.scalars(statement).all()


@app.post("/device-data", response_model=schemas.DeviceDataResponse, status_code=201)
def create_device_data(data: schemas.DeviceDataCreate, database: Session = Depends(get_db)):
    product = find_product(database, data.barcode)
    if data.station_pass_id is not None:
        station_pass = database.get(models.StationPass, data.station_pass_id)
        if station_pass is None or station_pass.barcode_id != product.id:
            raise HTTPException(status_code=400, detail="过站记录与产品条码不匹配")

    is_abnormal = (
        (data.lower_limit is not None and data.value < data.lower_limit)
        or (data.upper_limit is not None and data.value > data.upper_limit)
    )
    values = data.model_dump(exclude={"barcode"})
    record = models.DeviceData(barcode_id=product.id, is_abnormal=is_abnormal, **values)
    database.add(record)
    database.flush()

    if is_abnormal:
        lower_limit = data.lower_limit if data.lower_limit is not None else "-"
        upper_limit = data.upper_limit if data.upper_limit is not None else "-"
        limits = f"允许范围 {lower_limit} ~ {upper_limit} {data.unit}"
        alarm = models.Alarm(
            barcode_id=product.id,
            device_data_id=record.id,
            alarm_type="参数超限",
            message=f"{data.parameter_name}实测 {data.value} {data.unit}，{limits}",
            level="高",
            status="待处理",
        )
        database.add(alarm)

    database.commit()
    database.refresh(record)
    return record


@app.get("/alarms", response_model=list[schemas.AlarmResponse])
def list_alarms(
    barcode: str | None = Query(default=None), database: Session = Depends(get_db)
):
    statement = select(models.Alarm).order_by(models.Alarm.created_at.desc())
    if barcode:
        product = find_product(database, barcode)
        statement = statement.where(models.Alarm.barcode_id == product.id)
    return database.scalars(statement).all()


@app.get("/traceability/{barcode}", response_model=schemas.TraceabilityResponse)
def get_traceability(barcode: str, database: Session = Depends(get_db)):
    """按产品条码汇总完整生产链路，这是第六阶段的核心接口。"""
    product = find_product(database, barcode)
    work_order = database.get(models.WorkOrder, product.work_order_id)
    station_passes = database.scalars(
        select(models.StationPass)
        .where(models.StationPass.barcode_id == product.id)
        .order_by(models.StationPass.passed_at)
    ).all()
    device_data = database.scalars(
        select(models.DeviceData)
        .where(models.DeviceData.barcode_id == product.id)
        .order_by(models.DeviceData.collected_at)
    ).all()
    alarms = database.scalars(
        select(models.Alarm)
        .where(models.Alarm.barcode_id == product.id)
        .order_by(models.Alarm.created_at)
    ).all()
    return {
        "product": product,
        "work_order": work_order,
        "station_passes": station_passes,
        "device_data": device_data,
        "alarms": alarms,
    }
