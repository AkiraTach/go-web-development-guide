import type { Chapter } from "../../types";

export const ch05: Chapter = {
  id: "ch05",
  part: "第一部分：Go 语言基础",
  title: "接口、错误处理与泛型",
  summary: "理解隐式实现的接口、把错误当作普通的值处理，并用 Go 1.18+ 的泛型写出可复用的代码。",
  level: "进阶",
  minutes: 60,
  icon: "🔌",
  goals: [
    "理解接口的隐式实现，并能定义和使用小接口",
    "使用类型断言与类型 switch 处理 any 类型的值",
    "用 errors.New、fmt.Errorf（%w）、errors.Is、errors.As 处理错误链",
    "编写简单的泛型函数，并了解 Go 1.27 的泛型方法",
  ],
  body: [
    { type: "h2", text: "1. 接口：隐式实现" },
    {
      type: "p",
      text: "接口（interface）定义了一组方法签名。Go 的接口是**隐式实现**的：只要某个类型实现了接口要求的全部方法，它就自动满足该接口，无需声明 implements。这让类型之间的耦合更低。",
    },
    {
      type: "ul",
      items: [
        "标准库的接口通常很小：`io.Reader` 只有一个 `Read` 方法，`fmt.Stringer` 只有一个 `String` 方法。",
        "接口应由**使用方**定义，并且只包含真正需要的方法（参见第 17 章）。",
      ],
    },
    {
      type: "p",
      text: "下面的程序定义了 Shape 接口，并演示错误处理、类型 switch 与泛型：",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/shapes",
      code: String.raw`package main

import (
	"cmp"
	"errors"
	"fmt"
	"math"

	"example.com/shapes/box"
)

// Shape 接口：只要类型拥有 Area 与 Name 方法，就自动实现了该接口。
type Shape interface {
	Area() float64
	Name() string
}

type Circle struct{ R float64 }

type Rect struct{ W, H float64 }

func (c Circle) Area() float64 { return math.Pi * c.R * c.R }
func (c Circle) Name() string  { return "圆形" }

func (r Rect) Area() float64 { return r.W * r.H }
func (r Rect) Name() string  { return "矩形" }

// ErrNotFound 是哨兵错误（sentinel error），表示“未找到”。
var ErrNotFound = errors.New("未找到")

// ValidationError 是自定义的错误类型。
type ValidationError struct {
	Field string
}

func (e *ValidationError) Error() string {
	return "字段无效: " + e.Field
}

func findUser(id int) (string, error) {
	if id != 1 {
		return "", fmt.Errorf("findUser(%d): %w", id, ErrNotFound)
	}
	return "Alice", nil
}

func validateAge(age int) error {
	if age < 0 {
		return &ValidationError{Field: "age"}
	}
	return nil
}

// Max 是泛型函数：T 必须是可以比较大小的类型。
func Max[T cmp.Ordered](a, b T) T {
	if a > b {
		return a
	}
	return b
}

// describe 使用类型 switch 判断 any 的实际类型。
func describe(v any) string {
	switch x := v.(type) {
	case int:
		return fmt.Sprintf("整数 %d", x)
	case string:
		return fmt.Sprintf("字符串 %q", x)
	case Shape:
		return fmt.Sprintf("%s，面积 %.2f", x.Name(), x.Area())
	default:
		return fmt.Sprintf("未知类型 %T", x)
	}
}

func main() {
	shapes := []Shape{Circle{R: 1}, Rect{W: 2, H: 3}}
	for _, s := range shapes {
		fmt.Printf("%s 面积: %.2f\n", s.Name(), s.Area())
	}

	if _, err := findUser(2); errors.Is(err, ErrNotFound) {
		fmt.Println("错误:", err)
	}

	err := validateAge(-1)
	var ve *ValidationError
	if errors.As(err, &ve) {
		fmt.Println("校验失败，字段 =", ve.Field)
	}

	fmt.Println("Max:", Max(3, 7), Max("apple", "banana"))
	fmt.Println(describe(42))
	fmt.Println(describe("go"))
	fmt.Println(describe(Rect{W: 1, H: 1}))
	fmt.Println(describe(3.14))

	// Go 1.27+ 泛型方法：box 包中的 Apply 方法
	b := box.Box[int]{V: 21}
	fmt.Println("Apply:", b.Apply(func(v int) string { return fmt.Sprintf("值=%d", v*2) }))
}`,
    },
    {
      type: "output",
      text: String.raw`圆形 面积: 3.14
矩形 面积: 6.00
错误: findUser(2): 未找到
校验失败，字段 = age
Max: 7 banana
整数 42
字符串 "go"
矩形，面积 1.00
未知类型 float64
Apply: 值=42`,
    },
    {
      type: "code",
      lang: "go",
      file: "box/box.go",
      mod: "example.com/shapes",
      code: String.raw`package box

// Box 是一个泛型容器。
type Box[T any] struct {
	V T
}

// Apply 是 Go 1.27+ 支持的泛型方法：方法自身也可以声明类型参数 R。
func (b Box[T]) Apply[R any](f func(T) R) R {
	return f(b.V)
}`,
    },

    { type: "h2", text: "2. 类型断言与类型 switch" },
    {
      type: "p",
      text: "`any`（即 `interface{}`）可以保存任何类型的值。使用 `v.(T)` 断言为具体类型；使用 `switch v.(type)` 按类型分支处理，如上面的 describe 函数。",
    },

    { type: "h2", text: "3. 错误处理：error 只是一个值" },
    {
      type: "p",
      text: "`error` 是一个只有 `Error() string` 方法的内置接口。Go 不用异常机制处理可预期的错误，而是把 error 作为函数的最后一个返回值，由调用方用 `if err != nil` 检查。",
    },
    {
      type: "ul",
      items: [
        "`errors.New` 创建简单的错误；`fmt.Errorf` 搭配 `%w` 可以包装错误，保留完整的错误链。",
        "`errors.Is` 判断错误链中是否包含某个**哨兵错误**（如 ErrNotFound）。",
        "`errors.As` 从错误链中提取某种具体类型的错误（如 `*ValidationError`）。",
      ],
    },
    {
      type: "warn",
      text: "“类型化 nil”陷阱：如果函数返回类型是 error，却返回了值为 nil 的具体指针（例如 `*MyError`），得到的 error 接口并不等于 nil。正确做法是直接返回 `nil` 字面量。",
    },

    { type: "h2", text: "4. panic 与 recover" },
    {
      type: "p",
      text: "`panic` 用于真正不可恢复的编程错误，例如数组越界、空指针解引用。库代码应优先返回 error。Web 服务中可以用 `recover` 中间件捕获单个请求中的 panic，防止它拖垮整个进程（第 13 章）。",
    },

    { type: "h2", text: "5. 泛型入门" },
    {
      type: "p",
      text: "Go 1.18 引入了泛型。类型参数写在函数名后的方括号中，`cmp.Ordered` 这样的**约束**限定了类型参数可以是哪些类型。Go 1.27 进一步允许**方法本身声明类型参数**，就像上面 box 包中的 Apply 方法。",
    },
    {
      type: "note",
      title: "泛型方法（Go 1.27+）",
      text: "方法可以像函数一样声明自己的类型参数，例如 `func (b Box[T]) Apply[R any](f func(T) R) R`。在此之前，同样的功能只能通过包级函数实现。",
    },
  ],
  exercises: [
    "为 Shape 接口增加 `Perimeter() float64` 方法，并为 Circle 与 Rect 实现它。",
    "编写泛型函数 `Sum[T int | float64](nums []T) T`，并分别用整数切片和浮点数切片调用它。",
    "把 findUser 改为返回自定义的 `NotFoundError` 类型，并使用 errors.As 判断与提取它。",
  ],
  quiz: [
    {
      q: "关于 Go 的接口，下列哪项说法正确？",
      options: ["需要使用 implements 关键字声明", "只要实现了接口要求的全部方法，就自动满足该接口", "接口只能被结构体实现", "接口必须包含至少 5 个方法"],
      answer: 1,
      explain: "Go 的接口是隐式实现的，无需显式声明，这是 Go 解耦设计的重要特点。",
    },
    {
      q: "下列哪个函数可以判断错误链中是否包含某个哨兵错误？",
      options: ["errors.New", "errors.Is", "errors.Join", "fmt.Errorf"],
      answer: 1,
      explain: "errors.Is 会沿着错误链逐层比较，只要找到目标错误就返回 true。",
    },
    {
      q: "在 fmt.Errorf 中，哪个动词用于包装底层错误？",
      options: ["%v", "%s", "%w", "%e"],
      answer: 2,
      explain: "%w 会把底层错误包装进新错误中，之后可以用 errors.Is 或 errors.As 检查。",
    },
  ],
  refs: [
    { title: "Go Blog：Error handling and Go", url: "https://go.dev/blog/error-handling-and-go" },
    { title: "Go Blog：Working with Errors in Go 1.13", url: "https://go.dev/blog/go1.13-errors" },
    { title: "Tutorial: Getting started with generics", url: "https://go.dev/doc/tutorial/generics" },
    { title: "Effective Go：接口与其他类型", url: "https://go.dev/doc/effective_go#interfaces_and_types" },
    { title: "pkg.go.dev：errors", url: "https://pkg.go.dev/errors" },
  ],
};
