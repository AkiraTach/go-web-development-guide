import type { Chapter } from "../../types";

export const ch02: Chapter = {
  id: "ch02",
  part: "第一部分：Go 语言基础",
  title: "第一个程序：Hello, World 与模块",
  summary: "用 go mod init 创建模块，编写 package main 程序，拆分子包，并掌握 go run、go build 与 go install。",
  level: "入门",
  minutes: 40,
  icon: "👋",
  goals: [
    "使用 go mod init 创建模块并理解 go.mod 的作用",
    "编写 package main 程序，并用 go run 运行",
    "把代码拆分为子包，理解导出标识符（首字母大写）",
    "处理 error，并用 go build 与 go install 生成可执行文件",
  ],
  body: [
    { type: "h2", text: "1. 创建模块与 Hello, World" },
    {
      type: "p",
      text: "Go 程序以“模块”为单位组织。模块的根目录有一个 `go.mod` 文件，其中的 `module` 行就是模块路径（module path）。下面创建名为 `example/hello` 的模块：",
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`mkdir hello && cd hello
go mod init example/hello`,
    },
    {
      type: "output",
      text: "go: creating new go.mod: module example/hello",
    },
    { type: "p", text: "在 hello 目录下创建 `main.go`：" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example/hello",
      code: String.raw`package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}`,
    },
    { type: "p", text: "运行程序：" },
    { type: "code", lang: "bash", code: String.raw`go run .` },
    { type: "output", text: "Hello, World!" },
    {
      type: "ul",
      items: [
        "`package main` 表示这是一个可执行程序；`func main()` 是程序的入口。",
        "`go run .` 中的 `.` 表示“当前目录下的包”。它会编译并立即运行，不会留下可执行文件。",
        "`import \"fmt\"` 导入标准库的格式化包，`fmt.Println` 会打印并换行。",
      ],
    },

    { type: "h2", text: "2. 拆分子包：greetings" },
    {
      type: "p",
      text: "在模块中新建 `greetings` 目录，并在其中编写一个子包。注意函数名 `Hello` 首字母大写，表示它是导出的（可以被其他包使用）。",
    },
    {
      type: "code",
      lang: "go",
      file: "greetings/greetings.go",
      mod: "example/hello",
      code: String.raw`package greetings

import (
	"errors"
	"fmt"
)

// Hello 返回对指定人物的问候语。
// 如果 name 为空，则返回错误。
func Hello(name string) (string, error) {
	if name == "" {
		return "", errors.New("name 不能为空")
	}
	return fmt.Sprintf("Hi, %v. Welcome!", name), nil
}`,
    },
    { type: "p", text: "修改 `main.go`，导入子包 `example/hello/greetings`，并处理返回的错误：" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example/hello",
      code: String.raw`package main

import (
	"fmt"
	"log"

	"example/hello/greetings"
)

func main() {
	// 设置日志前缀，并去掉时间戳，输出更简洁
	log.SetPrefix("greetings: ")
	log.SetFlags(0)

	message, err := greetings.Hello("Gladys")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(message)
}`,
    },
    { type: "output", text: "Hi, Gladys. Welcome!" },
    {
      type: "p",
      text: "`log.Fatal` 会打印错误信息并以非零状态码退出。如果把参数改为空字符串，程序会输出 `greetings: name 不能为空` 并退出。这就是 Go 典型的错误处理方式：函数返回 error，调用方检查并决定如何处理。",
    },

    { type: "h2", text: "3. 编译与安装" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`go build          # 在当前目录生成可执行文件 hello（Windows 为 hello.exe）
./hello           # 运行生成的程序
go install .      # 安装到 GOBIN（默认为 $(go env GOPATH)/bin）`,
    },
    {
      type: "tip",
      text: "`go install` 的输出目录由 GOBIN 决定，未设置时使用 GOPATH/bin。请把该目录加入 PATH，才能在任意位置直接运行安装好的程序。安装远程模块的命令形如 `go install example.com/tool@latest`。",
    },

    { type: "h2", text: "4. 常用模块命令" },
    {
      type: "table",
      head: ["命令", "说明"],
      rows: [
        ["`go mod init 模块路径`", "创建 go.mod 文件"],
        ["`go mod tidy`", "添加缺失的依赖、移除未使用的依赖，并更新 go.sum"],
        ["`go get 包路径@版本`", "添加或升级某个依赖"],
        ["`go fmt ./...`", "格式化当前模块下的所有包"],
        ["`go vet ./...`", "检查常见的可疑代码"],
      ],
    },
    {
      type: "note",
      title: "Go 1.27 变化",
      text: "`go mod tidy` 会自动把 go.mod 中分散的多个 require 块整理为「直接依赖」与「间接依赖」两个块，文件结构更清晰。",
    },

    { type: "h2", text: "5. 导出规则：没有 public 关键字" },
    {
      type: "p",
      text: "Go 没有 public、private 之类的关键字。标识符首字母大写即为导出（可被其他包访问），首字母小写则只能在包内使用。这一规则在整个标准库中被一致地使用，例如 `fmt.Println` 导出，而内部辅助函数则不导出。",
    },
    {
      type: "warn",
      text: "文件名、目录名与包名没有强制关系，但约定俗成：包名使用简短的小写单词，目录名与包名保持一致。",
    },
  ],
  exercises: [
    "为 greetings 包新增 `Goodbye(name string) string` 函数，并在 main 中调用它。",
    "修改 main.go，让程序一次问候多个人（提示：使用 `for range` 遍历切片，见第 4 章）。",
    "执行 `go build -o hi .` 生成名为 hi 的可执行文件，并运行它。",
  ],
  quiz: [
    {
      q: "可执行程序的包名必须是什么？",
      options: ["app", "main", "cmd", "start"],
      answer: 1,
      explain: "只有 package main 且包含 func main() 的包，才会被编译为可执行程序。",
    },
    {
      q: "想编译并立即运行程序，但不想留下可执行文件，应使用哪个命令？",
      options: ["go build", "go run", "go install", "go mod tidy"],
      answer: 1,
      explain: "`go run` 会在临时位置完成编译与运行；`go build` 会在当前目录生成可执行文件。",
    },
    {
      q: "在 Go 中，如何让函数 Hello 能被其他包调用？",
      options: ["加 public 关键字", "首字母大写", "放到 pkg 目录下", "加 export 注释"],
      answer: 1,
      explain: "Go 通过标识符首字母是否大写来决定是否导出，没有 public 关键字。",
    },
  ],
  refs: [
    { title: "Tutorial: Get started with Go（入门教程）", url: "https://go.dev/doc/tutorial/getting-started" },
    { title: "Tutorial: Create a module（创建模块）", url: "https://go.dev/doc/tutorial/create-module" },
    { title: "Tutorial: Call your code from another module", url: "https://go.dev/doc/tutorial/call-module-code" },
    { title: "Tutorial: Compile and install（编译与安装）", url: "https://go.dev/doc/tutorial/compile-install" },
    { title: "Managing dependencies（管理依赖）", url: "https://go.dev/doc/modules/managing-dependencies" },
  ],
};
