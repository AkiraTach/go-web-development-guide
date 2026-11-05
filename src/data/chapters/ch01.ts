import type { Chapter } from "../../types";

export const ch01: Chapter = {
  id: "ch01",
  part: "第一部分：Go 语言基础",
  title: "环境准备：安装 Go 与开发工具",
  summary: "安装最新的 Go 1.27，理解 go 命令、模块与工具链机制，并配置好 VS Code 开发环境。",
  level: "入门",
  minutes: 30,
  icon: "🛠️",
  goals: [
    "在 Windows、macOS 或 Linux 上安装 Go 1.27",
    "使用 go version、go env、go help、go doc 检查开发环境",
    "理解模块模式、GOPROXY 与工具链（toolchain）的自动切换",
    "配置 VS Code 与 Go 扩展，获得自动补全与格式化",
  ],
  body: [
    { type: "h2", text: "1. 为什么选择 Go？" },
    {
      type: "p",
      text: "Go（又称 Golang）是 Google 开发的静态类型、编译型语言。它语法精简、编译速度快，内置并发模型，标准库覆盖 HTTP、JSON、模板、数据库、加密与测试。编译结果是一个不依赖运行时的单一可执行文件，非常适合 Web 服务、命令行工具与云原生系统。",
    },
    {
      type: "ul",
      items: [
        "**语法精简**：整门语言只有 25 个关键字，新手很快就能读懂大多数代码",
        "**单文件部署**：`go build` 生成一个可执行文件，服务器上不需要额外安装运行时",
        "**并发原生支持**：goroutine 与 channel 让并发编程更直接（第 6 章）",
        "**工具链完整**：格式化、测试、文档、依赖管理与漏洞扫描都内置在 go 命令中",
      ],
    },

    { type: "h2", text: "2. 安装 Go 1.27" },
    {
      type: "p",
      text: "最可靠的下载来源是官方下载页 go.dev/dl，安装说明见官方文档「Download and install」。",
    },
    { type: "h3", text: "Windows" },
    { type: "p", text: "下载 .msi 安装包并双击安装，默认安装到 `C:\\Program Files\\Go`，安装程序会自动配置 PATH。" },
    { type: "h3", text: "macOS" },
    { type: "p", text: "下载 .pkg 安装包并双击安装。注意：Go 1.27 要求 macOS 13（Ventura）或更高版本。" },
    { type: "h3", text: "Linux" },
    {
      type: "p",
      text: "下载 `go1.27.x.linux-amd64.tar.gz`（x 为官方页面显示的最新补丁号），解压到 `/usr/local`，再把 go 命令加入 PATH：",
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`# 1. 删除旧版本（如果有）并解压新版本
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.27.x.linux-amd64.tar.gz

# 2. 把 go 命令加入 PATH（写入 ~/.bashrc 或 ~/.zshrc）
export PATH=$PATH:/usr/local/go/bin`,
    },

    { type: "h2", text: "3. 验证安装" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`go version
go env GOPATH GOROOT GOPROXY`,
    },
    {
      type: "output",
      text: String.raw`go version go1.27.1 linux/amd64
/home/you/go
/usr/local/go
https://proxy.golang.org,direct`,
    },

    { type: "h2", text: "4. 认识 go 命令" },
    {
      type: "table",
      head: ["命令", "作用"],
      rows: [
        ["`go version`", "查看当前 Go 版本"],
        ["`go help 命令名`", "查看某个命令的帮助，例如 `go help run`"],
        ["`go env`", "查看环境变量，或用 `go env -w 名称=值` 持久化设置"],
        ["`go doc fmt.Println`", "在终端查看标准库或第三方包的文档"],
        ["`go run` / `go build` / `go test`", "运行、编译、测试（后续章节详解）"],
        ["`go fmt` / `go vet`", "格式化代码 / 静态检查常见错误"],
      ],
    },

    { type: "h2", text: "5. 模块模式、GOPATH 与 GOPROXY" },
    {
      type: "p",
      text: "从 Go 1.13 起默认使用模块（module）模式：代码可以放在任意目录，依赖记录在 `go.mod` 文件中，下载的依赖缓存在模块缓存（GOMODCACHE）里。旧的 GOPATH 目录结构已不再必需，但 `$GOPATH/bin` 仍是 `go install` 默认的安装目录。",
    },
    {
      type: "p",
      text: "GOPROXY 决定依赖从哪里下载，默认值是 `https://proxy.golang.org,direct`。如果在中国大陆访问较慢，可以设置为国内代理：",
    },
    { type: "code", lang: "bash", code: String.raw`go env -w GOPROXY=https://goproxy.cn,direct` },
    {
      type: "tip",
      text: "`go env -w` 会把设置写入用户配置文件，之后所有终端都会生效，无需每次手动设置环境变量。",
    },

    { type: "h2", text: "6. 工具链自动切换（Go 1.21+）" },
    {
      type: "p",
      text: "`go.mod` 中的 `go` 指令声明了模块所需的最低 Go 版本。当本机版本低于要求时，默认的 `GOTOOLCHAIN=auto` 会自动下载并使用需要的版本。",
    },
    {
      type: "code",
      lang: "text",
      file: "go.mod",
      code: String.raw`module example.com/hello

go 1.27`,
    },

    { type: "h2", text: "7. 配置编辑器" },
    {
      type: "ul",
      items: [
        "**VS Code**：安装官方 **Go** 扩展（发布者为 Go Team at Google）。首次打开 `.go` 文件时，按提示安装 `gopls`、`dlv` 等工具即可。",
        "**gopls** 是官方语言服务器（LSP），提供自动补全、跳转定义、查找引用、重构与实时错误提示。",
        "**GoLand** 是 JetBrains 的商业 IDE，对 Go 的支持同样完整。",
        "保存时自动格式化：Go 社区统一使用 gofmt 风格，不需要争论代码排版。",
      ],
    },
    {
      type: "note",
      title: "Go 1.27 工具改进",
      text: "`go doc` 现在支持 `包路径@版本` 形式的查询，例如 `go doc example.com/pkg@v1.2.3`，可以直接查看指定版本的文档。",
    },

    { type: "h2", text: "8. 动手检查" },
    {
      type: "p",
      text: "完成安装后运行 `go version`，确认输出版本不低于 **go1.25**。本教程的示例需要 Go 1.25 及以上版本的特性，推荐使用 Go 1.27。",
    },
  ],
  exercises: [
    "运行 `go env`，找出 GOROOT、GOPATH 与 GOPROXY 的值，并记录在笔记中。",
    "运行 `go doc fmt Println`，阅读 fmt.Println 的官方说明。",
    "在 VS Code 中新建 `hello.go`，体验自动补全与保存时的自动格式化。",
  ],
  quiz: [
    {
      q: "查看当前安装的 Go 版本，应使用哪个命令？",
      options: ["go env", "go version", "go help", "go doc"],
      answer: 1,
      explain: "`go version` 会输出类似 `go version go1.27.1 linux/amd64` 的信息。",
    },
    {
      q: "从 Go 1.13 开始，默认的依赖管理模式是？",
      options: ["GOPATH 模式", "模块（module）模式", "vendor 模式", "Bazel 模式"],
      answer: 1,
      explain: "模块模式通过 go.mod 管理依赖，代码不再必须放在 GOPATH/src 目录下。",
    },
    {
      q: "GOPROXY 环境变量的作用是？",
      options: ["设置程序运行时的内存上限", "指定下载模块时使用的代理地址", "设置编辑器主题", "指定可执行文件的输出目录"],
      answer: 1,
      explain: "GOPROXY 决定模块从哪里下载，例如 https://goproxy.cn。",
    },
  ],
  refs: [
    { title: "Download and install（安装指南）", url: "https://go.dev/doc/install" },
    { title: "Go 官方下载页", url: "https://go.dev/dl/" },
    { title: "How to Write Go Code（如何编写 Go 代码）", url: "https://go.dev/doc/code" },
    { title: "Go 工具链管理（Toolchains）", url: "https://go.dev/doc/toolchain" },
    { title: "官方教程总目录", url: "https://go.dev/doc/tutorial/" },
  ],
};
