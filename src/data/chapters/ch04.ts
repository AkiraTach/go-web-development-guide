import type { Chapter } from "../../types";

const BT = "`";

export const ch04: Chapter = {
  id: "ch04",
  part: "第一部分：Go 语言基础",
  title: "复合类型：数组、切片、映射与结构体",
  summary: "理解数组与切片的区别、掌握 map 的读写与遍历，学会用结构体和方法组织数据。",
  level: "入门",
  minutes: 60,
  icon: "🧱",
  goals: [
    "区分数组与切片，使用 append、len、cap 与子切片",
    "掌握 map 的增删改查与「逗号 ok」判断",
    "定义结构体，并区分值接收者与指针接收者",
    "理解「组合优于继承」的思路（结构体嵌入）",
  ],
  body: [
    { type: "h2", text: "1. 数组与切片" },
    {
      type: "p",
      text: `数组的长度是类型的一部分，实际开发中很少直接使用。**切片（slice）** 是对底层数组的一个“窗口”，由指针、长度 ${BT}len${BT} 和容量 ${BT}cap${BT} 组成，是 Go 中最常用的序列类型。`,
    },
    {
      type: "ul",
      items: [
        `${BT}[3]int{1, 2, 3}${BT}：数组，长度固定为 3`,
        `${BT}[]int{1, 2, 3}${BT}：切片字面量，长度可变`,
        `${BT}make([]string, 0, 4)${BT}：创建长度为 0、容量为 4 的切片`,
        `${BT}append${BT} 追加元素；容量不足时会分配新数组，所以必须使用返回值：${BT}s = append(s, x)${BT}`,
        `${BT}s[1:3]${BT} 取子切片（左闭右开），子切片与原切片共享底层数组`,
      ],
    },
    {
      type: "warn",
      text: "子切片与原切片共享内存：修改子切片的元素会影响原数据。需要独立副本时，使用 `slices.Clone`，或先创建新切片再 `copy`。",
    },
    {
      type: "table",
      head: ["类型", "长度", "是否可变", "典型用途"],
      rows: [
        ["数组 `[N]T`", "固定", "长度不可变", "固定大小的数据，如坐标、哈希值"],
        ["切片 `[]T`", "动态", "可 append 扩容", "绝大多数列表场景"],
        ["映射 `map[K]V`", "动态", "可增删键值", "键值查找、计数、缓存"],
      ],
    },

    { type: "h2", text: "2. 映射（map）" },
    {
      type: "p",
      text: `map 是哈希表，键的类型必须是可比较的（如 string、int、结构体）。读取不存在的键会返回零值；使用「逗号 ok」形式 ${BT}v, ok := m[k]${BT} 可以区分“不存在”和“值为零值”。`,
    },
    {
      type: "warn",
      text: "只声明而未初始化的 map 是 nil：可以读取，但写入会导致 panic。请使用 `make(map[K]V)` 或字面量进行初始化。",
    },
    {
      type: "note",
      title: "遍历顺序",
      text: "map 的遍历顺序是随机的。需要稳定顺序时，先取出所有键并排序；Go 1.23 起可以写成 `slices.Sorted(maps.Keys(m))`。",
    },

    { type: "h2", text: "3. 结构体与方法" },
    {
      type: "p",
      text: "结构体（struct）把多个字段组合成一个类型，方法则是绑定在类型上的函数。方法的接收者有两种：**值接收者**拿到的是副本，只能读取；**指针接收者**拿到的是地址，可以修改原对象。一般规则是：只要类型的某个方法需要指针接收者，其他方法也统一使用指针接收者。",
    },

    { type: "h2", text: "4. 完整示例" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/collections",
      code: String.raw`package main

import "fmt"

type Book struct {
	Title  string
	Author string
	Pages  int
}

// Summary 使用值接收者：只读取字段，不修改原对象。
func (b Book) Summary() string {
	return fmt.Sprintf("《%s》- %s（%d 页）", b.Title, b.Author, b.Pages)
}

// AddPages 使用指针接收者：会修改原对象。
func (b *Book) AddPages(n int) {
	b.Pages += n
}

type Library struct {
	books []Book
}

func (l *Library) Add(b Book) {
	l.books = append(l.books, b)
}

func main() {
	// 数组：长度固定
	scores := [3]int{90, 80, 70}
	fmt.Println("数组:", scores, len(scores))

	// 切片：长度可变
	nums := []int{1, 2, 3}
	nums = append(nums, 4, 5)
	fmt.Println("切片:", nums, "len =", len(nums))
	fmt.Println("子切片 nums[1:3]:", nums[1:3])

	// make 创建指定容量的切片
	buf := make([]string, 0, 4)
	buf = append(buf, "go")
	fmt.Println(buf, len(buf), cap(buf))

	// 映射：键值对
	stock := map[string]int{"apple": 5, "pear": 0}
	stock["banana"] = 12
	if n, ok := stock["kiwi"]; !ok {
		fmt.Println("kiwi 不存在，零值 =", n)
	}
	delete(stock, "pear")
	fmt.Println("水果种类:", len(stock), "苹果库存:", stock["apple"])

	// 结构体与方法
	b := Book{Title: "Go 入门", Author: "张三", Pages: 300}
	b.AddPages(20) // Go 会自动取地址，等价于 (&b).AddPages(20)
	fmt.Println(b.Summary())

	lib := &Library{}
	lib.Add(b)
	lib.Add(Book{Title: "Web 开发", Author: "李四", Pages: 250})
	for i, book := range lib.books {
		fmt.Printf("%d. %s\n", i+1, book.Title)
	}
	fmt.Printf("%+v\n", lib.books[1])
}`,
    },
    {
      type: "output",
      text: String.raw`数组: [90 80 70] 3
切片: [1 2 3 4 5] len = 5
子切片 nums[1:3]: [2 3]
[go] 1 4
kiwi 不存在，零值 = 0
水果种类: 2 苹果库存: 5
《Go 入门》- 张三（320 页）
1. Go 入门
2. Web 开发
{Title:Web 开发 Author:李四 Pages:250}`,
    },

    { type: "h2", text: "5. 组合代替继承" },
    {
      type: "p",
      text: `Go 没有类继承。复用字段与方法靠**结构体嵌入（embedding）**，例如 ${BT}type Admin struct { User; Level int }${BT}：Admin 会自动拥有 User 的字段和方法。这种“组合优于继承”的思路让类型之间的关系更松散、更易维护。`,
    },
    {
      type: "tip",
      text: "结构体字段名首字母大写才能被其他包访问，与标识符的导出规则一致。JSON 等编码场景还会用到结构体标签（struct tag），例如第 9 章的 `json:\"name\"`。",
    },
  ],
  exercises: [
    "给 Book 增加一个 `IsThick() bool` 方法，页数超过 500 页时返回 true。",
    "用 map 统计一段英文文本中每个单词出现的次数（提示：先用 strings.Fields 切分）。",
    "使用 `slices.Clone` 复制一个切片，修改副本后观察原切片是否变化。",
  ],
  quiz: [
    {
      q: "下面哪一项说法正确？",
      options: [
        "切片的长度在创建后不能改变",
        "切片是对底层数组的引用，append 时可能分配新数组",
        "数组比切片更常用",
        "切片和数组都可以使用 map 语法访问",
      ],
      answer: 1,
      explain: "切片由指针、长度和容量组成；容量不足时 append 会分配新的底层数组，因此必须使用其返回值。",
    },
    {
      q: "读取 map 时，哪种写法可以判断键是否真实存在？",
      options: ["v := m[k]", "v, ok := m[k]", "v = m.get(k)", "v := m.k"],
      answer: 1,
      explain: "逗号 ok 形式中，ok 为 false 表示键不存在，即使 v 显示为零值也能区分。",
    },
    {
      q: "什么情况下方法应该使用指针接收者？",
      options: ["方法需要修改接收者的字段时", "方法名以大写字母开头时", "结构体字段很多时", "从不需要使用指针接收者"],
      answer: 0,
      explain: "指针接收者可以修改原对象。修改字段、或结构体较大不想复制时，应使用指针接收者。",
    },
  ],
  refs: [
    { title: "A Tour of Go：复合类型", url: "https://go.dev/tour/moretypes/1" },
    { title: "Effective Go：Slices 与 Maps", url: "https://go.dev/doc/effective_go#slices" },
    { title: "Go Blog：Slices: usage and internals", url: "https://go.dev/blog/slices-intro" },
    { title: "pkg.go.dev：maps 与 slices 包", url: "https://pkg.go.dev/slices" },
  ],
};
