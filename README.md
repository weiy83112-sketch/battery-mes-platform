# battery-mes-platform

一个用于学习的微型动力电池 MES 云平台，已实现从工单下发到产品质量追溯的完整基础链路。

## 当前能力

- 工单管理：创建、列表和详情查询，数据保存到 SQLite
- 条码管理：产品唯一条码建档并绑定工单
- 扫码过站：记录工站、设备、操作人员、结果和时间
- 设备采集：上传参数、单位和上下限，自动判断是否异常
- 异常报警：参数超限时自动创建待处理报警
- 追溯查询：按条码汇总工单、过站、设备参数和报警信息

## 阶段进度

- [x] 第一阶段：项目初始化
- [x] 第二阶段：前后端最小跑通
- [x] 第三阶段：工单基础功能及数据库持久化
- [x] 第四阶段：条码建档与扫码过站
- [x] 第五阶段：设备数据、阈值判断与报警
- [x] 第六阶段：按产品条码进行完整追溯

## 技术栈

- 前端：Next.js 16、React 19、TypeScript、Tailwind CSS
- 后端：FastAPI、SQLAlchemy 2、SQLite
- 测试：Python unittest、FastAPI TestClient、ESLint、Next.js Build

## 在 macOS 上运行

### 1. 启动后端

首次安装：

```bash
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
```

启动服务：

```bash
backend/.venv/bin/python -m uvicorn app.main:app --app-dir backend --reload
```

后端地址：<http://127.0.0.1:8000>

接口文档：<http://127.0.0.1:8000/docs>

### 2. 启动前端

另开一个终端：

```bash
cd frontend
npm install
npm run dev
```

前端地址：<http://localhost:3000>

## 快速体验追溯

系统首次启动会写入一组演示数据。在前端打开“追溯查询”，查询：

```text
BAT-2026-0001
```

体验自动报警：在“生产采集”中上传“绝缘电阻”，设置下限为 `10`、上限为 `20`，把采集值设为 `8`。系统会保存异常参数并自动生成报警，再次追溯该条码即可看到完整记录。

## 主要接口

| 方法 | 地址 | 作用 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| GET | `/dashboard` | 生产统计 |
| GET / POST | `/work-orders` | 查询或创建工单 |
| GET / POST | `/barcodes` | 查询或创建产品条码 |
| GET / POST | `/station-passes` | 查询或创建过站记录 |
| GET / POST | `/device-data` | 查询或上传设备参数 |
| GET | `/alarms` | 查询报警 |
| GET | `/traceability/{barcode}` | 查询产品完整追溯链路 |

## 自动测试

```bash
PYTHONPATH=backend backend/.venv/bin/python -m unittest discover -s backend/tests -v
cd frontend && npm run lint && npm run build
```

本地业务数据库位于 `backend/mes.db`，已加入 `.gitignore`，不会被提交到 GitHub。
