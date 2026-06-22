import unittest

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


class MainApiTestCase(unittest.TestCase):
    def test_health_check(self) -> None:
        response = client.get("/health")

        print("\nGET /health")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_create_work_order(self) -> None:
        response = client.post(
            "/work-orders",
            json={
                "product_name": "电芯测试工单",
                "planned_quantity": 200,
                "status": "待生产",
            },
        )

        print("\nPOST /work-orders")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": 1004,
                "product_name": "电芯测试工单",
                "planned_quantity": 200,
                "status": "待生产",
            },
        )

        detail_response = client.get("/work-orders/1004")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json(), response.json())

    def test_get_work_order(self) -> None:
        response = client.get("/work-orders/1001")

        print("\nGET /work-orders/1001")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": 1001,
                "product_name": "动力电池模组",
                "planned_quantity": 500,
                "status": "生产中",
            },
        )

    def test_get_work_order_not_found(self) -> None:
        response = client.get("/work-orders/9999")

        print("\nGET /work-orders/9999")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "工单不存在"})

    def test_get_work_order_with_invalid_id(self) -> None:
        response = client.get("/work-orders/abc")

        print("\nGET /work-orders/abc")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main(verbosity=2)
