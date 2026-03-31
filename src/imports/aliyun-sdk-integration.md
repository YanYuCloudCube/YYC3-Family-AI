安装 SDK
阿里云提供了官方 SDK，推荐使用 dashscope 库。
Python:
bash

编辑



pip install dashscope
Node.js:
bash

编辑



npm install @alicloud/dashscope
# 或者使用通用的 openai 兼容库 (如果配置了兼容模式)
npm install openai
第三步：代码集成示例
方案 A：Python 原生集成 (推荐)
这是最稳定且功能最全的方式，支持流式输出、工具调用等功能。
python

编辑



import os
from dashscope import Generation

# 设置 API Key (建议放入环境变量 DASHSCOPE_API_KEY)
os.environ["DASHSCOPE_API_KEY"] = "sk-你的API_KEY_在这里"

def call_qwen_pro():
    # 定义模型型号 (根据 PRO 套餐可用列表选择)
    # 常用型号: qwen-max, qwen-plus, qwen-coder-plus, qwen-vl-max
    model_name = "qwen-max" 
    
    messages = [
        {'role': 'system', 'content': '你是一位资深的全栈工程师，擅长解决复杂的架构问题。'},
        {'role': 'user', 'content': '请用 Python 写一个异步 HTTP 客户端，并解释 asyncio.gather 的用法。'}
    ]

    try:
        # 调用生成接口
        response = Generation.call(
            model=model_name,
            messages=messages,
            result_format='message',  # 设置为 message 格式，便于后续多轮对话
            stream=True,              # 开启流式输出，提升用户体验
            incremental_output=True   # 配合 stream=True 使用，仅返回新增内容
        )

        print(f"正在调用 {model_name} ...")
        print("-" * 30)
        
        # 处理流式响应
        for chunk in response:
            if chunk.status_code == 200:
                # 提取增量内容
                content = chunk.output.choices[0].message.content
                if content:
                    print(content, end="", flush=True)
            else:
                print(f"\n错误: Code={chunk.code}, Message={chunk.message}")
                break
        
        print("\n" + "-" * 30)
        print("生成完毕。")

    except Exception as e:
        print(f"发生异常: {str(e)}")

if __name__ == "__main__":
    call_qwen_pro()
方案 B：Node.js 集成 (适配 OpenAI 格式)
阿里云 DashScope 完全兼容 OpenAI 的 API 协议，你可以直接使用 openai 库，只需修改 baseURL。这对于集成到现有的 AI 应用（如 LangChain, Vercel AI SDK）非常方便。
javascript

编辑



import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "sk-你的API_KEY_在这里",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1", // 关键：指向阿里云兼容端点
});

async function main() {
  const model = "qwen-max"; // 或者 qwen-coder-plus

  console.log(`正在调用 ${model} ...`);

  const stream = await client.chat.completions.create({
    model: model,
    messages: [
      { role: "system", content: "你是一个高效的代码助手。" },
      { role: "user", content: "解释一下 React Server Components 的核心优势。" }
    ],
    stream: true, // 开启流式
  });

  process.stdout.write("\n");
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    process.stdout.write(content);
  }
  process.stdout.write("\n完成。\n");
}

main().catch(console.error);
方案 C：直接 HTTP 请求 (通用语言)
如果你不使用 SDK，可以直接发送 POST 请求。
bash

编辑



curl https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-你的API_KEY_在这里" \
  -d '{
    "model": "qwen-max",
    "messages": [
      {"role": "user", "content": "Hello, Qwen!"}
    ],
    "stream": true
  }'
第四步：关键参数与最佳实践
在集成 PRO 套餐模型时，注意以下参数以发挥最大性能：
表格
参数	说明	推荐设置 (PRO 场景)
model	模型标识	qwen-max (最强推理), qwen-coder-plus (代码专用)
temperature	创造性程度	0.1 - 0.3 (代码/逻辑任务)
0.7 - 0.9 (创意写作)
top_p	采样阈值	通常设为 0.8 或与 temperature 配合使用
max_tokens	最大输出长度	PRO 套餐通常支持较长上下文，可设为 4096 或更高 (视具体模型上限)
stream	流式输出	True (强烈建议，降低首字延迟，提升交互体验)
tools	函数调用	若需让模型调用外部 API，需在 messages 中定义 tools 结构 (Qwen-Max 支持极佳)
常见问题排查
报错 InvalidApiKey: 检查 Key 是否复制完整，是否有前后空格，或是否在阿里云控制台被禁用。
报错 ModelNotFound: 确认模型名称是否正确。PRO 套餐有时需要特定的模型后缀（如 qwen-max-2026-01-23），请在控制台“模型广场”确认最新可用 ID。
配额限制 (RateLimitExceeded): PRO 套餐虽然有高配额，但如果并发过高仍可能触发限制。建议在代码中加入重试机制 (Retry Logic) 和 指数退避 (Exponential Backoff)。
进阶：如何在本地 IDE (VS Code / Cursor) 中集成？
如果你想让本地的 AI 编程插件使用阿里云的 PRO 模型：
Cursor 设置:
进入 Settings -> Models。
添加自定义模型提供商，选择 OpenAI Compatible。
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
API Key: 填入你的阿里云 Key。
Model Name: 输入 qwen-max 或 qwen-coder-plus。
Cline / OpenClaw (VS Code 插件):
在插件设置中选择 Alibaba Cloud (DashScope) 作为 Provider。
填入 API Key 即可自动识别可用模型列表。