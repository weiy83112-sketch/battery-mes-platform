import os
import tempfile
import unittest
from pathlib import Path


# 测试使用独立的临时数据库，不会污染本地开发数据。
test_database_path = Path(tempfile.gettempdir()) / "battery_mes_test.db"
if test_database_path.exists():
    test_database_path.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{test_database_path}"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


client = TestClient(app)


class MainApiTestCase(unittest.TestCase):
    @classmethod
    def tearDownClass(cls) -> None:
        client.close()
        if test_database_path.exists():
            test_database_path.unlink()

    def test_health_and_dashboard(self) -> None:
        self.assertEqual(client.get("/health").json(), {"status": "ok"})
        response = client.get("/dashboard")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["work_orders"], 3)

    def test_work_order_is_saved_in_database(self) -> None:
        response = client.post(
            "/work-orders",
            json={
                "product_name": "电芯测试工单",
                "planned_quantity": 200,
                "status": "待生产",
            },
        )
        self.assertEqual(response.status_code, 201)
        work_order_id = response.json()["id"]
        self.assertEqual(client.get(f"/work-orders/{work_order_id}").status_code, 200)

    def test_barcode_station_and_normal_device_data(self) -> None:
        barcode = "BAT-TEST-NORMAL"
        barcode_response = client.post(
            "/barcodes", json={"barcode": barcode, "work_order_id": 1001, "status": "生产中"}
        )
        self.assertEqual(barcode_response.status_code, 201)

        station_response = client.post(
            "/station-passes",
            json={
                "barcode": barcode,
                "station_name": "气密测试站",
                "station_code": "ST-TEST-01",
                "equipment_code": "EQ-TEST-01",
                "operator": "测试员",
                "result": "通过",
            },
        )
        self.assertEqual(station_response.status_code, 201)

        data_response = client.post(
            "/device-data",
            json={
                "barcode": barcode,
                "station_pass_id": station_response.json()["id"],
                "equipment_code": "EQ-TEST-01",
                "parameter_name": "气密压力",
                "value": 45,
                "unit": "kPa",
                "lower_limit": 40,
                "upper_limit": 50,
            },
        )
        self.assertEqual(data_response.status_code, 201)
        self.assertFalse(data_response.json()["is_abnormal"])

    def test_abnormal_data_creates_alarm_and_trace(self) -> None:
        barcode = "BAT-TEST-ALARM"
        self.assertEqual(
            client.post(
                "/barcodes", json={"barcode": barcode, "work_order_id": 1001, "status": "生产中"}
            ).status_code,
            201,
        )
        response = client.post(
            "/device-data",
            json={
                "barcode": barcode,
                "equipment_code": "EQ-002",
                "parameter_name": "绝缘电阻",
                "value": 8,
                "unit": "MΩ",
                "lower_limit": 10,
                "upper_limit": 20,
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["is_abnormal"])

        trace_response = client.get(f"/traceability/{barcode}")
        self.assertEqual(trace_response.status_code, 200)
        trace = trace_response.json()
        self.assertEqual(trace["work_order"]["id"], 1001)
        self.assertEqual(len(trace["device_data"]), 1)
        self.assertEqual(len(trace["alarms"]), 1)
        self.assertEqual(trace["alarms"][0]["alarm_type"], "参数超限")

    def test_duplicate_and_missing_barcode_errors(self) -> None:
        response = client.post(
            "/barcodes",
            json={"barcode": "BAT-2026-0001", "work_order_id": 1001, "status": "生产中"},
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(client.get("/traceability/NOT-FOUND").status_code, 404)


if __name__ == "__main__":
    unittest.main(verbosity=2)
