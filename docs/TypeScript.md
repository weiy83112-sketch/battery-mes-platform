# TypeScript 学习记录

这个文件用于记录当前 `battery-mes-platform` 前端中出现的 TypeScript 和 React 写法。

## 创建工单函数

### 原代码

```tsx
function createWorkOrder(event: FormEvent) {
  event.preventDefault();
  void submit(
    "/work-orders",
    {
      product_name: productName.trim(),
      planned_quantity: Number(plannedQuantity),
      status: "待生产",
    },
    "工单创建成功",
    () => {
      setProductName("");
      setPlannedQuantity("");
    },
  );
}
```

### 这个函数整体负责什么

```text
用户提交创建工单表单
→ 阻止浏览器刷新页面
→ 整理表单数据
→ 调用 submit 发送 POST 请求
→ 创建成功后清空输入框
```

这个函数主要负责组织前端操作，真正发送 HTTP 请求的通用逻辑放在 `submit` 函数中。

## 1. 函数声明

```tsx
function createWorkOrder(event: FormEvent) {
  // 函数体
}
```

分开理解：

```text
function              声明一个函数
createWorkOrder       函数名称
(...)                 函数接收的参数
event                 参数名称
FormEvent             event 参数的类型
{ ... }               函数执行的代码
```

可以读成：

```text
声明一个叫 createWorkOrder 的函数。
这个函数接收一个名叫 event 的表单事件。
```

这里没有手动写返回值类型，TypeScript 会根据函数内容推断它不返回数据，也就是：

```tsx
function createWorkOrder(event: FormEvent): void {
  // ...
}
```

函数返回值中的 `void` 表示：

```text
这个函数执行操作，但不向调用者返回一个有用的结果。
```

## 2. `event: FormEvent`

```tsx
event: FormEvent
```

冒号 `:` 后面写的是参数类型：

```text
event       参数名称
:           表示“它的类型是”
FormEvent   React 的表单事件类型
```

当函数被表单这样使用时：

```tsx
<form onSubmit={createWorkOrder}>
```

用户提交表单后，React 会调用 `createWorkOrder`，并把这次表单事件作为 `event` 参数传入。

这里写的是：

```tsx
onSubmit={createWorkOrder}
```

而不是：

```tsx
onSubmit={createWorkOrder()}
```

原因是前者把函数交给 React，等用户提交时再执行；后者会在页面渲染时立刻执行函数。

## 3. 阻止表单默认刷新

```tsx
event.preventDefault();
```

HTML 表单默认提交后会让浏览器跳转或刷新页面。React 页面通常希望使用 JavaScript 自己发送请求，所以调用：

```tsx
preventDefault()
```

完整含义是：

```text
阻止这次表单提交事件的浏览器默认行为。
```

它不是阻止创建工单，而是阻止浏览器使用传统方式刷新页面。

## 4. 调用 `submit` 函数

```tsx
void submit(...);
```

`submit` 是项目自己定义的异步函数，不是 TypeScript 内置函数。

当前调用一共传入四个参数：

```text
第一个参数：接口路径
第二个参数：提交给后端的数据
第三个参数：成功提示文字
第四个参数：成功后执行的回调函数
```

它们的位置必须和 `submit` 的参数定义顺序一致。

## 5. 第一个参数：接口路径

```tsx
"/work-orders"
```

这是字符串类型的接口路径。`submit` 会把它和后端基础地址拼接起来，例如：

```text
http://127.0.0.1:8000 + /work-orders
```

最终请求地址是：

```text
http://127.0.0.1:8000/work-orders
```

## 6. 第二个参数：请求数据对象

```tsx
{
  product_name: productName.trim(),
  planned_quantity: Number(plannedQuantity),
  status: "待生产",
}
```

花括号 `{}` 在这里表示创建一个 JavaScript 对象。

对象中每一项都是：

```text
属性名: 属性值
```

例如：

```tsx
status: "待生产"
```

其中：

```text
status       属性名
"待生产"     属性值
```

对象最后会被转换成类似下面的 JSON，发送给后端：

```json
{
  "product_name": "动力电池模组",
  "planned_quantity": 500,
  "status": "待生产"
}
```

这里使用 `product_name` 和 `planned_quantity`，是因为属性名称需要和后端接口约定保持一致。

## 7. `productName.trim()`

```tsx
product_name: productName.trim()
```

`productName` 是 React 状态中保存的产品名称。

`.trim()` 会删除字符串开头和结尾的空格：

```tsx
"  动力电池模组  ".trim()
```

得到：

```tsx
"动力电池模组"
```

需要注意：`.trim()` 返回一个处理后的新字符串，不会直接修改 `productName` 状态。

## 8. `Number(plannedQuantity)`

```tsx
planned_quantity: Number(plannedQuantity)
```

HTML 输入框读取到的值通常是字符串，即使用户输入的是数字：

```tsx
plannedQuantity === "500"
```

后端需要的是数字，所以使用：

```tsx
Number("500")
```

转换结果是：

```tsx
500
```

两者类型不同：

```text
"500"   string 字符串
500     number 数字
```

## 9. 第三个参数：成功提示

```tsx
"工单创建成功"
```

这是传给 `submit` 的成功提示文字。

当请求成功后，`submit` 会用它更新页面上的消息状态。

这个字符串本身不会自动显示，必须由 `submit` 内部调用对应的状态更新函数。

## 10. 第四个参数：箭头函数

```tsx
() => {
  setProductName("");
  setPlannedQuantity("");
}
```

这叫箭头函数，也叫回调函数。

基本结构：

```tsx
() => {
  // 将来需要执行的代码
}
```

其中：

```text
()       这个函数不接收参数
=>       箭头函数符号
{ ... }  函数执行内容
```

这里是把函数作为第四个参数交给 `submit`，不是立即执行它。

当请求成功后，`submit` 内部执行：

```tsx
after?.();
```

这时才会运行：

```tsx
setProductName("");
setPlannedQuantity("");
```

它们会请求 React 把两个表单状态更新为空字符串，输入框随后显示为空。

## 11. 为什么前面写 `void`

```tsx
void submit(...);
```

`submit` 是 `async` 异步函数，所以调用它会返回一个 `Promise`。

这里的 `createWorkOrder` 不需要继续使用这个 Promise 的返回结果，因此使用 `void` 明确表示：

```text
启动这个异步提交操作，但这里不使用它返回的 Promise。
```

这不是停止 `submit`，请求仍然会正常执行。

当前项目的 `submit` 内部已经使用 `try / catch` 处理请求错误，所以事件函数只负责启动提交操作。

这里的 `void` 和函数返回类型 `: void` 位置不同：

```tsx
function example(): void {}
```

表示函数不返回有用结果。

```tsx
void submit();
```

表示忽略这次函数调用产生的返回值。

## 12. 末尾的逗号

```tsx
() => {
  setProductName("");
  setPlannedQuantity("");
},
```

最后的逗号是函数参数之间使用的分隔符。JavaScript 和 TypeScript 允许最后一个参数后保留尾随逗号。

下面两种写法含义相同：

```tsx
submit(a, b, c, callback);
```

```tsx
submit(
  a,
  b,
  c,
  callback,
);
```

多行代码保留尾随逗号，后续增加、删除参数时会更方便。

## 13. 把代码展开理解

原来的紧凑写法：

```tsx
void submit(
  "/work-orders",
  { product_name: productName.trim(), planned_quantity: Number(plannedQuantity), status: "待生产" },
  "工单创建成功",
  () => {
    setProductName("");
    setPlannedQuantity("");
  },
);
```

可以先在脑中展开成：

```tsx
const requestBody = {
  product_name: productName.trim(),
  planned_quantity: Number(plannedQuantity),
  status: "待生产",
};

function clearForm() {
  setProductName("");
  setPlannedQuantity("");
}

void submit(
  "/work-orders",
  requestBody,
  "工单创建成功",
  clearForm,
);
```

两种写法表达的是同一件事。原代码只是把请求对象和成功回调直接写在函数参数中。

## 14. 完整执行顺序

```text
1. 用户在表单中填写产品名称和计划数量
2. 用户点击提交按钮
3. 表单触发 onSubmit
4. React 调用 createWorkOrder(event)
5. event.preventDefault() 阻止页面刷新
6. productName.trim() 处理产品名称
7. Number(plannedQuantity) 把数量转换成数字
8. 调用 submit 发送 POST /work-orders
9. 后端创建工单并返回结果
10. submit 显示“工单创建成功”
11. submit 调用传入的箭头函数
12. React 清空产品名称和计划数量状态
13. submit 重新请求页面数据
14. React 显示最新工单列表
```

## 15. 当前需要记住

```text
function 用于声明函数。
参数后面的冒号用于标注 TypeScript 类型。
FormEvent 表示 React 表单事件。
preventDefault 阻止浏览器默认刷新。
对象用于组织提交给后端的数据。
trim 删除字符串两端空格。
Number 把字符串转换成数字。
箭头函数可以作为参数传给另一个函数，稍后执行。
void submit 表示不使用异步函数返回的 Promise，不代表停止请求。
```

## 16. 自测问题

1. `event` 是谁传给 `createWorkOrder` 的？
2. 为什么需要调用 `event.preventDefault()`？
3. 为什么计划数量需要使用 `Number()`？
4. 第四个参数中的箭头函数什么时候执行？
5. `void submit(...)` 会不会阻止请求执行？
6. `product_name` 为什么没有直接写成 `productName`？

