from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class WorkOrderCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=100)
    planned_quantity: int = Field(gt=0)
    status: str = Field(default="待生产", min_length=1, max_length=20)


class WorkOrderResponse(WorkOrderCreate, OrmModel):
    id: int
    created_at: datetime


class BarcodeCreate(BaseModel):
    barcode: str = Field(min_length=3, max_length=80)
    work_order_id: int
    status: str = Field(default="生产中", min_length=1, max_length=20)


class BarcodeResponse(BarcodeCreate, OrmModel):
    id: int
    created_at: datetime


class StationPassCreate(BaseModel):
    barcode: str = Field(min_length=3, max_length=80)
    station_name: str = Field(min_length=1, max_length=80)
    station_code: str = Field(min_length=1, max_length=40)
    equipment_code: str = Field(min_length=1, max_length=40)
    operator: str = Field(min_length=1, max_length=40)
    result: str = Field(default="通过", min_length=1, max_length=20)


class StationPassResponse(OrmModel):
    id: int
    barcode_id: int
    station_name: str
    station_code: str
    equipment_code: str
    operator: str
    result: str
    passed_at: datetime


class DeviceDataCreate(BaseModel):
    barcode: str = Field(min_length=3, max_length=80)
    station_pass_id: int | None = None
    equipment_code: str = Field(min_length=1, max_length=40)
    parameter_name: str = Field(min_length=1, max_length=80)
    value: float
    unit: str = Field(min_length=1, max_length=20)
    lower_limit: float | None = None
    upper_limit: float | None = None


class DeviceDataResponse(OrmModel):
    id: int
    barcode_id: int
    station_pass_id: int | None
    equipment_code: str
    parameter_name: str
    value: float
    unit: str
    lower_limit: float | None
    upper_limit: float | None
    is_abnormal: bool
    collected_at: datetime


class AlarmResponse(OrmModel):
    id: int
    barcode_id: int
    device_data_id: int | None
    alarm_type: str
    message: str
    level: str
    status: str
    created_at: datetime


class TraceabilityResponse(BaseModel):
    product: BarcodeResponse
    work_order: WorkOrderResponse
    station_passes: list[StationPassResponse]
    device_data: list[DeviceDataResponse]
    alarms: list[AlarmResponse]


class DashboardResponse(BaseModel):
    work_orders: int
    products: int
    station_passes: int
    pending_alarms: int
