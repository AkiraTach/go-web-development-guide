import type { Chapter } from "../../types";

export const ch08: Chapter = {
  id: "ch08",
  part: "第二部分：工程化与质量",
  title: "测试与模糊测试",
  summary: "用 testing 包编写单元测试，掌握表驱动测试、基准测试与模糊测试，并学会常用的 go test 参数。",
  level: "进阶",
  minutes: 50,
  icon: "🧪",
  goals: [
    "编写 TestXxx 单元测试，并理解 t.Errorf 与 t.Fatalf 的区别",
    "使用表驱动测试与子测试覆盖多种输入",
    "编写基准测试与模糊测试（FuzzXxx）",
    "熟练使用 go test 的常用参数",
  ],
  body: [
    { type: "h2", text: "1. 第一个测试" },
    {
      type: "p",
      text: "测试文件以 `_test.go` 结尾，与被测代码放在同一个目录。测试函数名以 `Test` 开头，接收 `*testing.T` 参数。`go test ./...` 会运行当前模块中所有包的测试。下面的 Reverse 函数按 Unicode 字符（rune）反转字符串，中文也不会乱码：",
    },
    {
      type: "code",
      lang: "go",
      file: "strutil/reverse.go",
      mod: "example.com/strutil",
      code: String.raw`package strutil

// Reverse 按 Unicode 字符（rune）反转字符串，中文不会乱码。
func Reverse(s string) string {
	r := []rune(s)
	for i, j := 0, len(r)-1; i < j; i, j = i+1, j-1 {
		r[i], r[j] = r[j], r[i]
	}
	return string(r)
}`,
    },

    { type: "h2", text: "2. 表驱动测试、基准测试与模糊测试" },
    {
      type: "p",
      text: "Go 社区最常用的测试风格是**表驱动测试**：把输入与期望输出列成一张表，循环执行，并用 `t.Run` 为每个用例创建独立的子测试。`BenchmarkXxx` 用于性能测试，Go 1.24 起推荐使用 `for b.Loop() { }` 写法。`FuzzXxx` 则是模糊测试：Go 会自动生成大量随机输入，检验你定义的**性质**是否始终成立。",
    },
    {
      type: "code",
      lang: "go",
      file: "strutil/reverse_test.go",
      mod: "example.com/strutil",
      code: String.raw`package strutil

import (
	"testing"
	"unicode/utf8"
)

// TestReverse 使用表驱动测试覆盖多种输入。
func TestReverse(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{"英文", "go", "og"},
		{"中文", "你好", "好你"},
		{"空字符串", "", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Reverse(tt.in)
			if got != tt.want {
				t.Errorf("Reverse(%q) = %q，期望 %q", tt.in, got, tt.want)
			}
		})
	}
}

// BenchmarkReverse 基准测试：go test -bench=. 运行。
func BenchmarkReverse(b *testing.B) {
	for b.Loop() {
		Reverse("Hello, 世界")
	}
}

// FuzzReverse 模糊测试：检验“反转两次得到原字符串”这一性质。
func FuzzReverse(f *testing.F) {
	f.Add("hello") // 种子输入
	f.Add("你好, Go")
	f.Fuzz(func(t *testing.T, s string) {
		if !utf8.ValidString(s) {
			return // 非法 UTF-8 不在该性质的适用范围内
		}
		if Reverse(Reverse(s)) != s {
			t.Errorf("二次反转后与原字符串不一致: %q", s)
		}
	})
}`,
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`go test -v ./strutil                        # 运行单元测试（显示详细过程）
go test -bench=. ./strutil                    # 运行基准测试
go test -fuzz=FuzzReverse -fuzztime=10s ./strutil  # 模糊测试运行 10 秒`,
    },
    {
      type: "output",
      title: "go test -v ./strutil 的运行结果",
      text: String.raw`=== RUN   TestReverse
=== RUN   TestReverse/英文
=== RUN   TestReverse/中文
=== RUN   TestReverse/空字符串
--- PASS: TestReverse (0.00s)
    --- PASS: TestReverse/英文 (0.00s)
    --- PASS: TestReverse/中文 (0.00s)
    --- PASS: TestReverse/空字符串 (0.00s)
=== RUN   FuzzReverse
=== RUN   FuzzReverse/seed#0
=== RUN   FuzzReverse/seed#1
--- PASS: FuzzReverse (0.00s)
    --- PASS: FuzzReverse/seed#0 (0.00s)
    --- PASS: FuzzReverse/seed#1 (0.00s)
PASS
ok      example.com/strutil/strutil     0.004s`,
    },
    {
      type: "warn",
      text: "`t.Errorf` 报告错误后会继续执行后面的代码；`t.Fatalf` 则会立即停止当前测试。前置条件（例如数据库能否打开）失败时，应使用 Fatal 系列。",
    },

    { type: "h2", text: "3. 常用 go test 参数" },
    {
      type: "table",
      head: ["命令", "作用"],
      rows: [
        ["`go test ./...`", "运行所有包的测试"],
        ["`go test -v ./...`", "显示每个测试的详细过程"],
        ["`go test -run TestReverse/中文 ./...`", "只运行匹配的测试（参数是正则表达式）"],
        ["`go test -cover ./...`", "显示代码覆盖率"],
        ["`go test -race ./...`", "开启数据竞争检测"],
        ["`go test -count=1 ./...`", "禁用测试缓存，强制重新运行"],
      ],
    },

    { type: "h2", text: "4. 测试 HTTP 处理函数" },
    {
      type: "p",
      text: "`net/http/httptest` 可以在不监听真实端口的情况下测试 HTTP 处理函数：`httptest.NewRequest` 构造请求，`httptest.NewRecorder` 记录响应。第 9 章和第 19 章会大量使用它。",
    },
    {
      type: "note",
      title: "Go 1.27 变化",
      text: "net/http/httptest 新增 NewTestServer，它基于内存中的虚拟网络，适合与 testing/synctest 配合测试并发代码。Go 1.24 起，b.Loop 也是推荐的基准测试写法。",
    },
  ],
  exercises: [
    "为 Reverse 增加一个用例：包含 emoji 的字符串「👋Go」，观察 rune 反转的结果。",
    "编写 `IsPalindrome(s string) bool`（判断回文），并用表驱动测试覆盖至少 5 个用例。",
    "运行 `go test -cover ./...`，把覆盖率提升到 100%。",
  ],
  quiz: [
    {
      q: "测试文件的命名规则是？",
      options: ["test_*.go", "*_test.go", "*.spec.go", "tests/*.go"],
      answer: 1,
      explain: "以 _test.go 结尾的文件会被 go test 识别，并且不会被普通的 go build 编译进程序。",
    },
    {
      q: "表驱动测试的主要优点是？",
      options: ["运行速度更快", "用例集中、易于扩展，并能用 t.Run 独立运行每个用例", "不需要 testing 包", "自动生成测试数据"],
      answer: 1,
      explain: "表驱动测试把用例集中在一张表里，新增用例只需添加一行，子测试还可以单独运行。",
    },
    {
      q: "要让模糊测试检验「反转两次得到原字符串」，应当编写哪种函数？",
      options: ["TestXxx", "BenchmarkXxx", "FuzzXxx", "ExampleXxx"],
      answer: 2,
      explain: "FuzzXxx 函数接收 *testing.F，并通过 f.Fuzz 提供由 Go 自动生成的随机输入。",
    },
  ],
  refs: [
    { title: "pkg.go.dev：testing", url: "https://pkg.go.dev/testing" },
    { title: "Tutorial: Add a test（添加测试）", url: "https://go.dev/doc/tutorial/add-a-test" },
    { title: "Tutorial: Getting started with fuzzing（模糊测试入门）", url: "https://go.dev/doc/tutorial/fuzz" },
    { title: "pkg.go.dev：net/http/httptest", url: "https://pkg.go.dev/net/http/httptest" },
  ],
};
