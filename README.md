# battery-mes-platform

一个用于学习的微型动力电池 MES 云平台项目。

## 项目目标

本项目用于边做边学，逐步实现一个简化版的工业互联网 / MES / ERP 工单追溯系统。

当前已经完成前后端最小跑通，并开始进入工单基础功能阶段。

## 目录结构

```text
battery-mes-platform/
  backend/   # 后端服务目录，后续放 FastAPI、SQLAlchemy、数据库相关代码
  frontend/  # 前端项目目录，后续放 Next.js、React、TypeScript 页面和组件
  docs/      # 项目文档目录，后续放学习笔记、接口说明、表结构设计、流程图
  README.md  # 项目总说明，帮助快速了解项目用途和结构
  AGENTS.md  # 协作说明，约定后续如何一步一步开发和学习
```

## 当前进度

- [x] 初始化项目根目录结构
- [x] 建立项目思路文档
- [x] 初始化前端 Next.js 项目
- [x] 初始化后端 FastAPI 项目
- [x] 跑通后端健康检查接口
- [x] 跑通前端调用后端健康检查接口
- [x] 增加工单列表接口
- [x] 完善工单详情接口
- [x] 前端展示后端工单列表
- [x] 前端点击工单查看详情
- [x] 后端创建工单接口
- [x] 前端创建工单表单
- [ ] 接入数据库保存真实工单数据

## 当前已实现接口

### 健康检查

- 请求方式：`GET`
- 请求地址：`/health`
- 返回示例：`{"status": "ok"}`

### 工单列表

- 请求方式：`GET`
- 请求地址：`/work-orders`
- 业务作用：返回当前模拟工单列表，后续会改成从数据库查询。

### 工单详情

- 请求方式：`GET`
- 请求地址：`/work-orders/{work_order_id}`
- 当前目标：根据工单编号返回对应工单的完整信息。

### 创建工单

- 请求方式：`POST`
- 请求地址：`/work-orders`
- 当前作用：接收前端提交的工单信息，生成新工单编号并返回新工单。

## 本地运行

启动后端：

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload
```

运行后端测试：

```powershell
$env:PYTHONPATH='backend'
.\backend\.venv\Scripts\python.exe -m unittest discover -s backend\tests -v
```

## 文档入口

- [docs/项目思路.md](C:/Users/weiyun/Desktop/battery-mes-platform/docs/项目思路.md)：项目目标、模块拆分、核心业务流、阶段计划
