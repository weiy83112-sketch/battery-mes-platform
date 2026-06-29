from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def current_time() -> datetime:
    """返回本地时间，便于学习项目直接阅读数据库记录。"""
    return datetime.now()


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_name: Mapped[str] = mapped_column(String(100))
    planned_quantity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=current_time)

    barcodes: Mapped[list["ProductBarcode"]] = relationship(back_populates="work_order")


class ProductBarcode(Base):
    __tablename__ = "product_barcodes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    barcode: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_orders.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="生产中")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=current_time)

    work_order: Mapped[WorkOrder] = relationship(back_populates="barcodes")
    station_passes: Mapped[list["StationPass"]] = relationship(back_populates="product")
    device_data: Mapped[list["DeviceData"]] = relationship(back_populates="product")
    alarms: Mapped[list["Alarm"]] = relationship(back_populates="product")


class StationPass(Base):
    __tablename__ = "station_passes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    barcode_id: Mapped[int] = mapped_column(ForeignKey("product_barcodes.id"), index=True)
    station_name: Mapped[str] = mapped_column(String(80))
    station_code: Mapped[str] = mapped_column(String(40))
    equipment_code: Mapped[str] = mapped_column(String(40))
    operator: Mapped[str] = mapped_column(String(40))
    result: Mapped[str] = mapped_column(String(20), default="通过")
    passed_at: Mapped[datetime] = mapped_column(DateTime, default=current_time)

    product: Mapped[ProductBarcode] = relationship(back_populates="station_passes")
    device_data: Mapped[list["DeviceData"]] = relationship(back_populates="station_pass")


class DeviceData(Base):
    __tablename__ = "device_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    barcode_id: Mapped[int] = mapped_column(ForeignKey("product_barcodes.id"), index=True)
    station_pass_id: Mapped[int | None] = mapped_column(ForeignKey("station_passes.id"), nullable=True)
    equipment_code: Mapped[str] = mapped_column(String(40))
    parameter_name: Mapped[str] = mapped_column(String(80))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20))
    lower_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    upper_limit: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_abnormal: Mapped[bool] = mapped_column(Boolean, default=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=current_time)

    product: Mapped[ProductBarcode] = relationship(back_populates="device_data")
    station_pass: Mapped[StationPass | None] = relationship(back_populates="device_data")
    alarms: Mapped[list["Alarm"]] = relationship(back_populates="device_data")


class Alarm(Base):
    __tablename__ = "alarms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    barcode_id: Mapped[int] = mapped_column(ForeignKey("product_barcodes.id"), index=True)
    device_data_id: Mapped[int | None] = mapped_column(ForeignKey("device_data.id"), nullable=True)
    alarm_type: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(String(200))
    level: Mapped[str] = mapped_column(String(20), default="中")
    status: Mapped[str] = mapped_column(String(20), default="待处理")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=current_time)

    product: Mapped[ProductBarcode] = relationship(back_populates="alarms")
    device_data: Mapped[DeviceData | None] = relationship(back_populates="alarms")
