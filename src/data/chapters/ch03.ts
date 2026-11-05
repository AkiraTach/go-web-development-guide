import type { Chapter } from "../../types";

export const ch03: Chapter = {
  id: "ch03",
  part: "第一部分：Go 语言基础",
  title: "基础语法：变量、控制流与函数",
  summary: "掌握变量与零值、基本类型、if / for / switch / range 控制流，以及多返回值、可变参数、defer 与指针。",
  level: "入门",
  minutes: 60,
  icon: "🔤",
  goals: [
    "区分 var 声明与短变量声明 :=，理解零值",
    "掌握基本类型、字符串与 rune 的区别",
    "熟练使用 if、for、switch 与 range",
    "编写多返回值函数、可变参数函数，并理解 defer 的执行顺序",
    "理解指针与值传递的区别",
  ],
  body: [
    { type: "h2", text: "1. 变量、常量与零值" },
    {
      type: "p",
      text: "Go 中声明变量有两种方式：`var` 用于完整声明，可在函数外使用；`:=` 是短变量声明，会根据右侧的值自动推断类型，只能在函数内部使用。变量声明后如果没有赋值，会自动获得该类型的**零值**：数字为 0，字符串为空，布尔为 false，指针、切片、map 为 nil。",
    },
    {
      type: "p",
      text: "常量使用 `const` 声明。配合 `iota`，可以方便地创建递增的枚举值，例如 Sunday = 0、Monday = 1。",
    },

    { type: "h2", text: "2. 基本类型" },
    {
      type: "ul",
      items: [
        "数字：`int`、`int64`、`float64` 等；布尔：`bool`",
        "`string`：不可变的字节序列，源代码默认使用 UTF-8 编码",
        "`byte`（即 uint8）表示一个字节；`rune`（即 int32）表示一个 Unicode 字符",
        "Go 不会自动转换类型，必须显式转换，例如 `float64(n)`",
      ],
    },

    { type: "h2", text: "3. 完整示例" },
    {
      type: "p",
      text: "下面的程序覆盖了本章的主要语法点，可以直接复制到 main.go 中运行：",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/basics",
      code: String.raw`package main

import (
	"errors"
	"fmt"
	"strings"
)

const Pi = 3.14159 // 常量

const (
	Sunday  = iota // 0
	Monday         // 1
	Tuesday        // 2
)

// divide 返回两个数相除的结果；除数为 0 时返回错误。
func divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, errors.New("除数不能为 0")
	}
	return a / b, nil
}

// sum 接收任意数量的整数（可变参数）。
func sum(nums ...int) int {
	total := 0
	for _, n := range nums {
		total += n
	}
	return total
}

func main() {
	// 1. 变量与零值
	var name string = "Gopher"
	age := 15
	var isStudent bool // 未赋值，零值为 false
	fmt.Println(name, age, isStudent)

	// 2. 常量与 iota
	fmt.Println(Pi, Monday, Tuesday)

	// 3. 字符串：len 返回字节数，range 遍历得到的是字符（rune）
	s := "你好, Go"
	fmt.Println(len(s))         // 字节数：每个中文字符占 3 字节
	fmt.Println(len([]rune(s))) // 字符数
	for i, r := range "Go语言" {
		fmt.Printf("%d:%c ", i, r)
	}
	fmt.Println()

	// 4. 控制流
	for i := range 3 { // Go 1.22+：直接遍历整数
		fmt.Printf("%d ", i)
	}
	fmt.Println()

	score := 85
	switch {
	case score >= 90:
		fmt.Println("优秀")
	case score >= 60:
		fmt.Println("及格")
	default:
		fmt.Println("不及格")
	}

	if n := len(name); n > 3 { // if 可以带一个初始化语句
		fmt.Println("名字较长:", n)
	}

	// 5. 多返回值与错误处理
	q, err := divide(10, 0)
	fmt.Println(q, err)

	// 6. 可变参数
	fmt.Println(sum(1, 2, 3), sum())

	// 7. defer：函数返回前执行，多个 defer 按后进先出的顺序执行
	defer fmt.Println("defer：最后执行")

	// 8. 指针
	x := 1
	p := &x
	*p = 42
	fmt.Println("x =", x)

	ptr := new(42) // Go 1.26+：new 可以直接接受初始值
	fmt.Println("new(42) =", *ptr)

	// 9. 内置函数 min / max（Go 1.21+）
	fmt.Println(min(3, 1, 2), max(3, 1, 2))
	fmt.Println(strings.ToUpper("go"))
}`,
    },
    {
      type: "output",
      text: String.raw`Gopher 15 false
3.14159 1 2
10
6
0:G 1:o 2:语 5:言 
0 1 2 
及格
名字较长: 6
0 除数不能为 0
6 0
x = 42
new(42) = 42
1 3
GO
defer：最后执行`,
    },

    { type: "h2", text: "4. 控制流" },
    {
      type: "ul",
      items: [
        "**if**：条件不需要括号，可以带一个初始化语句（如 `if n := len(s); n > 3 { }`）。",
        "**for**：Go 只有 `for` 一个循环关键字。它可以是 `for 条件 { }`（相当于 while）、`for 初始; 条件; 后置 { }`，或 `for range`。",
        "**range**：遍历切片、数组、字符串、map、channel，以及 Go 1.23 起的迭代器函数；Go 1.22 起还可以遍历整数。",
        "**switch**：不需要 `break`，默认不会贯穿到下一个分支；不带表达式的 switch 等价于一串 if-else。",
      ],
    },
    {
      type: "note",
      title: "Go 1.22 语义变化",
      text: "for 循环变量在每次迭代中都是新的变量。这修复了在闭包中捕获循环变量时的经典陷阱，老代码在新版本中行为会更符合直觉。",
    },

    { type: "h2", text: "5. 函数与 defer" },
    {
      type: "ul",
      items: [
        "函数可以返回多个值，最常见的模式是「结果 + error」，error 放在最后。",
        "可变参数 `nums ...int` 在函数内部是一个 `[]int` 切片。",
        "函数是一等公民：可以赋值给变量、作为参数传递、作为返回值返回。",
        "`defer` 把函数调用推迟到外层函数返回前执行，常用于关闭文件、释放锁等清理工作。",
      ],
    },

    { type: "h2", text: "6. 指针" },
    {
      type: "p",
      text: "Go 有指针，但没有指针运算。`&` 取地址，`*` 解引用。函数参数默认是值的拷贝；如果需要修改调用方的变量，就传递指针。`new(T)` 返回指向零值的指针。",
    },

    { type: "h2", text: "7. 常见错误" },
    {
      type: "warn",
      text: "声明了却未使用的局部变量，或导入了却未使用的包，都会导致**编译失败**（不是警告）。这能帮助你保持代码整洁。",
    },
    {
      type: "warn",
      text: "整数相除会截断小数：`7 / 2` 的结果是 `3`。需要小数结果时，写成 `float64(7) / 2`，得到 3.5。",
    },
  ],
  exercises: [
    "编写函数 `grade(score int) string`，返回「优秀 / 良好 / 及格 / 不及格」，分别用 if-else 和 switch 实现。",
    "修改 divide 函数，让除数为 0 时使用 panic，并思考 panic 与返回 error 的区别（参见第 5 章）。",
    "用 for 循环计算 1 到 100 的和，再用 `for i := range 101` 写出同样的功能，比较两种写法。",
  ],
  quiz: [
    {
      q: "下列哪一种是函数内短变量声明的正确写法？",
      options: ["var x := 1", "x := 1", "let x = 1", "x = int 1"],
      answer: 1,
      explain: "`:=` 会根据右侧的值推断类型，只能在函数内部使用。",
    },
    {
      q: "Go 语言中有几个循环关键字？",
      options: ["for、while、do", "只有 for", "for 与 loop", "for 与 foreach"],
      answer: 1,
      explain: "Go 只保留 for，通过不同写法实现 while 式循环、无限循环与 range 遍历。",
    },
    {
      q: "执行 len(「你好」) 的结果是多少？",
      options: ["2", "4", "6", "3"],
      answer: 2,
      explain: "len 返回的是字节数。每个中文字符在 UTF-8 中占 3 字节，「你好」共 6 字节。需要字符数时使用 len([]rune(s))。",
    },
  ],
  refs: [
    { title: "A Tour of Go：基础语法", url: "https://go.dev/tour/basics/1" },
    { title: "Effective Go：控制结构", url: "https://go.dev/doc/effective_go#control-structures" },
    { title: "Go 语言规范（Language Specification）", url: "https://go.dev/ref/spec" },
    { title: "Go 1.22 发布说明（range 遍历整数）", url: "https://go.dev/doc/go1.22" },
  ],
};
