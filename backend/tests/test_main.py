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

    def test_get_work_order(self) -> None:
        response = client.get("/work-orders/1001")

        print("\nGET /work-orders/1001")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"work_order_id": 1001})

    def test_get_work_order_with_invalid_id(self) -> None:
        response = client.get("/work-orders/abc")

        print("\nGET /work-orders/abc")
        print("状态码：", response.status_code)
        print("响应内容：", response.json())

        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main(verbosity=2)
