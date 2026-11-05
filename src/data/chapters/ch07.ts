import type { Chapter } from "../../types";

export const ch07: Chapter = {
  id: "ch07",
  part: "第二部分：工程化与质量",
  title: "项目结构与模块布局",
  summary: "依据官方「Organizing a Go module」指南，学会在单包、命令、多包与服务端项目之间选择合适的目录结构。",
  level: "进阶",
  minutes: 45,
  icon: "🗂️",
  goals: [
    "理解官方推荐的几种模块布局及其适用场景",
    "掌握 internal 目录的作用，并能用它隐藏实现细节",
    "遵循包的命名约定，避免循环依赖",
    "了解多模块与工作区（go.work）的使用时机",
  ],
  body: [
    { type: "h2", text: "1. 项目结构的基本原则" },
    {
      type: "p",
      text: "Go 并不强制项目结构。官方「Organizing a Go module」指南给出了一套推荐做法：**先用最简单的布局，随着代码增长再逐步拆分**。其中最重要的原则是：能放进 `internal/` 的代码就放进去。`internal` 下的包不能被其他模块导入，你就可以放心地重构它们，而不必担心破坏外部用户。",
    },

    { type: "h2", text: "2. 官方推荐的几种布局" },
    {
      type: "table",
      head: ["场景", "推荐布局", "说明"],
      rows: [
        ["单个包（库）", "根目录放 go.mod 和 `模块名.go`", "包名与模块路径的最后一段一致，可以拆成多个文件"],
        ["单个命令（工具）", "根目录放 `main.go`，可拆分为多个文件", "所有文件都声明 `package main`"],
        ["命令 + 内部包", "根目录 main.go + `internal/` 子包", "内部包只供本模块使用，是最常见的起步布局"],
        ["多个命令", "`cmd/程序名/main.go`", "每个命令一个目录，可以分别 go install"],
        ["库 + 命令", "根目录放公开包，`cmd/` 放命令，`internal/` 放私有实现", "同一仓库同时提供可导入的库与可执行程序"],
        ["服务端项目", "`cmd/api-server/` 加 `internal/` 按业务划分", "服务通常是独立的二进制程序，一般不导出包"],
      ],
    },
    {
      type: "p",
      text: "官方指南中的服务端项目示例如下。注意其中没有 `pkg/` 目录：官方并未强制要求它，简单项目用 `internal/` 与 `cmd/` 就足够了。",
    },
    {
      type: "code",
      lang: "text",
      code: String.raw`project-root/
├── go.mod
├── cmd/
│   └── api-server/
│       └── main.go        # 程序入口：只负责组装依赖并启动服务
├── internal/
│   ├── auth/              # 业务包（只能被本模块导入）
│   ├── model/             # 数据结构
│   └── metrics/           # 监控指标
└── ...                    # 静态文件、配置、Dockerfile 等非 Go 文件`,
    },

    { type: "h2", text: "3. 动手实践：带 internal 包的小程序" },
    {
      type: "p",
      text: "下面创建模块 `example.com/shop`。其中 `internal/pricing` 只能被本模块导入，`cmd/shop` 是程序入口：",
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`mkdir -p shop/cmd/shop shop/internal/pricing
cd shop
go mod init example.com/shop`,
    },
    {
      type: "code",
      lang: "go",
      file: "internal/pricing/pricing.go",
      mod: "example.com/shop",
      code: String.raw`// Package pricing 提供价格计算逻辑。
// 位于 internal 目录中的包只能被本模块（example.com/shop）导入。
package pricing

// Discount 返回折扣后的价格：VIP 会员享受九折。
func Discount(price float64, vip bool) float64 {
	if vip {
		return price * 0.9
	}
	return price
}`,
    },
    {
      type: "code",
      lang: "go",
      file: "cmd/shop/main.go",
      mod: "example.com/shop",
      code: String.raw`package main

import (
	"fmt"

	"example.com/shop/internal/pricing"
)

func main() {
	fmt.Printf("普通会员: %.2f\n", pricing.Discount(100, false))
	fmt.Printf("VIP 会员: %.2f\n", pricing.Discount(100, true))
}`,
    },
    { type: "code", lang: "bash", code: String.raw`go run ./cmd/shop` },
    {
      type: "output",
      text: String.raw`普通会员: 100.00
VIP 会员: 90.00`,
    },
    {
      type: "tip",
      text: "试着在另一个模块中导入 `example.com/shop/internal/pricing`，编译器会报错，提示 use of internal package not allowed。这就是 internal 的保护作用。",
    },

    { type: "h2", text: "4. 包的命名与导入" },
    {
      type: "ul",
      items: [
        "包名使用简短的小写单词，不使用下划线与驼峰：`http`、`store`、`pricing`。",
        "避免 `util`、`common`、`base` 这类含义模糊的包名，应当按职责命名。",
        "导入路径 = 模块路径 + 目录路径，例如 `example.com/shop/internal/pricing`。",
        "避免循环导入：如果两个包互相依赖，可以抽出第三个包，或让其中一方依赖接口。",
        "不要过早拆包：一个几百行的程序放在一个包里完全没有问题。",
      ],
    },

    { type: "h2", text: "5. 多模块与工作区" },
    {
      type: "p",
      text: "当一个仓库包含多个需要独立发布版本的模块时，可以为每个模块分别创建 go.mod。开发阶段可以使用工作区（`go work init` 与 `go work use`）让多个本地模块互相引用，具体步骤见官方教程「Getting started with multi-module workspaces」。",
    },
    {
      type: "note",
      title: "Go 1.27 变化",
      text: "`go mod tidy` 会自动把 go.mod 中的多个 require 块整理为规范的两块结构（直接依赖与间接依赖），目录布局相关的文件更加清晰。",
    },
  ],
  exercises: [
    "在 internal 下新增 `discount` 包，把会员折扣规则从 pricing 包中拆分出来。",
    "新增第二个命令 `cmd/report`，同样导入 pricing 包，输出一段简单的价格报表。",
    "新建另一个模块，尝试导入 `example.com/shop/internal/pricing`，观察编译错误信息。",
  ],
  quiz: [
    {
      q: "哪个目录中的包不能被其他模块导入？",
      options: ["cmd", "internal", "vendor", "testdata"],
      answer: 1,
      explain: "internal 目录中的包只能被其父目录所在模块内的代码导入，适合存放私有实现。",
    },
    {
      q: "按照官方布局指南，多个可执行程序应该怎样组织？",
      options: ["全部放在根目录", "每个程序放在 cmd/程序名/ 目录下", "放在 internal/bin 中", "放在 pkg 目录里"],
      answer: 1,
      explain: "每个命令放在 cmd 下的独立目录中，各自声明 package main，便于单独 go install。",
    },
    {
      q: "下列哪个包名最符合 Go 的命名习惯？",
      options: ["commonUtils", "common_utils", "utils", "pricing"],
      answer: 3,
      explain: "包名应简短、小写并体现职责。utils、common 这类名字含义模糊，应避免。",
    },
  ],
  refs: [
    { title: "官方的项目/模块布局指南（Organizing a Go module）", url: "https://go.dev/doc/modules/layout" },
    { title: "Tutorial: Create a module", url: "https://go.dev/doc/tutorial/create-module" },
    { title: "Getting started with multi-module workspaces", url: "https://go.dev/doc/tutorial/workspaces" },
    { title: "Managing dependencies（管理依赖）", url: "https://go.dev/doc/modules/managing-dependencies" },
    { title: "go.mod 文件参考", url: "https://go.dev/doc/modules/gomod-ref" },
  ],
};
