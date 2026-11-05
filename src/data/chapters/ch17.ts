import type { Chapter } from "../../types";

export const ch17: Chapter = {
  id: "ch17",
  part: "第四部分：安全、风格与上线",
  title: "Effective Go 与代码风格",
  summary: "学习 Effective Go 与代码评审指南中的命名、错误处理、接口设计与注释约定，写出地道、易读、易维护的 Go 代码。",
  level: "进阶",
  minutes: 40,
  icon: "✍️",
  goals: [
    "使用 gofmt、go vet 与 go fix 保持代码的统一风格",
    "遵循命名约定，避免常见的命名陷阱",
    "掌握「提前返回」与错误包装的写法",
    "理解「接受接口、返回结构体」与小接口设计原则",
    "为导出标识符编写规范的文档注释",
  ],
  body: [
    { type: "h2", text: "1. 格式：交给 gofmt" },
    {
      type: "p",
      text: "Go 社区没有「花括号该不该换行」之争：所有代码都由 gofmt 统一格式化，缩进使用制表符。大多数编辑器保存时会自动运行它，也可以手动执行 `go fmt ./...`。",
    },

    { type: "h2", text: "2. 命名约定" },
    {
      type: "table",
      head: ["场景", "推荐", "避免"],
      rows: [
        ["包名", "简短、小写、单个单词：`http`、`store`", "`httpUtils`、`my_store`、`util`、`common`"],
        ["导出标识符", "驼峰（MixedCaps）：`ParseURL`", "下划线：`parse_url`"],
        ["getter 方法", "直接用字段名：`Owner()`", "`GetOwner()`"],
        ["接口", "单方法接口以 -er 结尾：`Reader`、`Stringer`", "`IReader`、`ReaderInterface`"],
        ["接收者名称", "1–2 个字母，全程一致：`func (c *Counter)`", "`this`、`self`"],
        ["避免重复", "`bufio.Reader`、`user.New()`", "`bufio.BufReader`、`user.NewUser()`"],
      ],
    },

    { type: "h2", text: "3. 错误处理：快乐路径靠左对齐" },
    {
      type: "p",
      text: "Effective Go 与评审指南都推荐“提前返回”：先处理错误并立即返回，让正常流程保持在函数最外层，阅读时一目了然。",
    },
    {
      type: "code",
      lang: "go",
      file: "不推荐：嵌套过深",
      code: String.raw`func process(path string) error {
	f, err := os.Open(path)
	if err == nil {
		defer f.Close()
		data, err := io.ReadAll(f)
		if err == nil {
			fmt.Println(len(data))
		} else {
			return err
		}
	} else {
		return err
	}
	return nil
}`,
    },
    {
      type: "code",
      lang: "go",
      file: "推荐：提前返回",
      code: String.raw`func process(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("打开文件失败: %w", err)
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return fmt.Errorf("读取文件失败: %w", err)
	}
	fmt.Println(len(data))
	return nil
}`,
    },
    {
      type: "ul",
      items: [
        "错误字符串以小写开头、结尾不加标点，方便与其他上下文拼接，例如 `加载配置失败: 文件不存在`。",
        "用 `%w` 包装错误，为它添加上下文，同时保留原始错误以供 errors.Is / errors.As 判断。",
        "不要用 `_` 忽略错误。确实需要忽略时，写注释说明理由。",
      ],
    },

    { type: "h2", text: "4. 接口与设计" },
    {
      type: "ul",
      items: [
        "**接受接口，返回结构体**（Accept interfaces, return structs）：参数使用接口，调用方可以传入任何满足需求的实现；返回值使用具体类型，调用方可以使用它的全部能力。",
        "**接口在使用方定义，并保持小巧**：标准库中的 `io.Reader` 只有一个方法，这是最理想的形态。",
        "**让零值可用**（Make the zero value useful）：`sync.Mutex` 与 `bytes.Buffer` 不需要显式初始化即可直接使用。",
        "**不要过早抽象**：只有出现了多个实现，或者确实需要替换依赖（例如测试时使用假实现）时，才引入接口。",
      ],
    },
    {
      type: "code",
      lang: "go",
      code: String.raw`// 在使用方定义接口：只声明本包真正需要的方法
type UserFinder interface {
	FindUser(ctx context.Context, id int64) (User, error)
}

// 接受接口作为参数，返回具体的结构体指针
func NewProfileService(users UserFinder) *ProfileService {
	return &ProfileService{users: users}
}`,
    },

    { type: "h2", text: "5. 注释：为导出标识符写文档注释" },
    {
      type: "p",
      text: "导出的类型、函数、方法与包都应当有注释，并以标识符的名字开头。`go doc` 与 pkg.go.dev 会直接展示这些注释，因此它们就是你的 API 文档。",
    },
    {
      type: "code",
      lang: "go",
      code: String.raw`// Hello 返回对指定人物的问候语。
// 如果 name 为空，则返回错误。
func Hello(name string) (string, error) {`,
    },

    { type: "h2", text: "6. 并发：通过通信共享内存" },
    {
      type: "p",
      text: "Effective Go 中的名言是：“不要通过共享内存来通信，而要通过通信来共享内存。”优先用 channel 传递数据的所有权；只有在需要保护共享状态时，才使用 sync.Mutex。Go 1.27 的 goroutine 泄漏分析也可以帮助你发现永久阻塞的 goroutine。",
    },

    { type: "h2", text: "7. 现代化：go fix 与 modernizers" },
    {
      type: "p",
      text: "Go 1.26 让 `go fix` 重新成为代码现代化工具的入口，Go 1.27 为它新增了 atomictypes、embedlit、slicesbackward、unsafefuncs 等改写规则。它能把旧写法自动替换为更新、更清晰的写法。",
    },
    { type: "code", lang: "bash", code: String.raw`go fix ./...   # 查看并应用可用的现代化改写` },
    {
      type: "tip",
      text: "建议在版本控制下运行 go fix，逐个检查改动后再提交，既能学习新写法，也不会误改业务逻辑。",
    },

    { type: "h2", text: "8. 代码评审中的常见问题" },
    {
      type: "table",
      head: ["反模式", "推荐写法"],
      rows: [
        ["使用 `util`、`common` 这类包名", "按职责命名包，如 `pricing`、`auth`"],
        ["忽略错误：`f, _ := os.Open(...)`", "处理错误；确需忽略时写注释说明理由"],
        ["深层嵌套的 if-else", "提前 return，让正常流程靠左对齐"],
        ["接收者使用 `this`、`self`", "使用简短的一致名称，如 `c` 表示 Counter"],
        ["getter 使用 `Get` 前缀", "直接使用字段名，如 `Owner()`"],
        ["定义包含十几个方法的大接口", "定义小接口，并由使用方声明"],
        ["使用 `interface{}`", "使用 `any`（Go 1.18+ 的别名）"],
        ["在 init 函数中做复杂初始化", "显式的构造函数，把依赖通过参数传入"],
      ],
    },
  ],
  exercises: [
    "用 `go fix ./...` 检查你之前写过的代码，观察有哪些现代化改写，并判断它们是否更清晰。",
    "找一段嵌套较深的 if-else，改写为提前返回的形式。",
    "阅读 Go Code Review Comments，列出你最认同的三条建议，并说明理由。",
  ],
  quiz: [
    {
      q: "下列哪个命令用于统一代码格式？",
      options: ["go vet", "go fmt", "go test", "go run"],
      answer: 1,
      explain: "`go fmt` 会调用 gofmt 按照统一的规则格式化代码，结束关于排版的争论。",
    },
    {
      q: "Effective Go 推荐的错误字符串风格是？",
      options: ["首字母大写并以句号结尾", "全部使用大写字母", "小写开头、结尾不加标点", "包含时间戳"],
      answer: 2,
      explain: "错误字符串通常会被拼接到更长的信息中，小写开头、不加标点可以让拼接结果更自然。",
    },
    {
      q: "下列哪个是 getter 方法的推荐命名？",
      options: ["GetName()", "Name()", "get_name()", "fetchName()"],
      answer: 1,
      explain: "Go 社区的约定是直接使用字段名作为 getter 的名字，不加 Get 前缀。",
    },
  ],
  refs: [
    { title: "Effective Go", url: "https://go.dev/doc/effective_go" },
    { title: "Go Code Review Comments（代码评审指南）", url: "https://go.dev/wiki/CodeReviewComments" },
    { title: "How to Write Go Code", url: "https://go.dev/doc/code" },
    { title: "Go FAQ", url: "https://go.dev/doc/faq" },
  ],
};
