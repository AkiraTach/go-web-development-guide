import type { Chapter } from "../../types";

export const ch11: Chapter = {
  id: "ch11",
  part: "第三部分：Web 开发核心",
  title: "html/template：模板与自动转义",
  summary: "用 html/template 生成安全的网页：掌握模板语法、布局复用、embed 嵌入模板文件，并理解上下文自动转义。",
  level: "进阶",
  minutes: 60,
  icon: "🧩",
  goals: [
    "区分 text/template 与 html/template，理解自动转义的作用",
    "使用 {{ }} 中的变量、条件、循环与管道",
    "使用 define、template 组织布局与复用片段",
    "使用 embed 嵌入模板文件，并用 template.Must 在启动时检查语法",
    "识别 template.HTML 等会绕过转义的危险用法",
  ],
  body: [
    { type: "h2", text: "1. text/template 与 html/template" },
    {
      type: "p",
      text: "Go 有两个模板包：`text/template` 用于生成任意文本；`html/template` 专门用于生成 HTML。它会根据输出位置（HTML 正文、属性、JavaScript、CSS 或 URL）**自动转义**数据，有效防止 XSS（跨站脚本）攻击。生成网页时应始终使用 html/template。",
    },

    { type: "h2", text: "2. 模板语法速查" },
    {
      type: "table",
      head: ["语法", "含义"],
      rows: [
        ["`{{.Name}}`", "输出当前数据的 Name 字段（自动转义）"],
        ["`{{if .InStock}}…{{else}}…{{end}}`", "条件判断"],
        ["`{{range $i, $p := .Products}}…{{else}}…{{end}}`", "遍历切片；集合为空时执行 else 分支"],
        ["`{{with .User}}{{.Name}}{{end}}`", "值非空时才进入该上下文，减少重复书写"],
        ["`{{define \"name\"}}…{{end}}`", "定义一个命名模板"],
        ["`{{template \"name\" .}}`", "引用命名模板，并把当前数据传给它"],
        ["`{{block \"name\" .}}默认内容{{end}}`", "定义可以被覆盖的模板块，相当于 define 加 template 的简写"],
        ["`{{.Price | printf \"%.2f\"}}`", "管道：把左边的值作为最后一个参数传给函数"],
        ["`{{- ... -}}`", "去掉前后的空白字符，让输出的 HTML 更整洁"],
      ],
    },

    { type: "h2", text: "3. 完整示例：布局与商品列表" },
    {
      type: "p",
      text: "下面的程序用 `embed` 把模板文件打包进可执行文件，用 `template.Must` 在启动时检查模板语法，并采用「布局 + 内容」的组织方式：layout.html 定义页面骨架，products.html 提供 content 片段。",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/tmpldemo",
      code: String.raw`package main

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strings"
	"time"
)

//go:embed templates/*.html
var templateFS embed.FS

type Product struct {
	Name    string
	Price   float64
	InStock bool
}

type PageData struct {
	Title    string
	Now      time.Time
	Comment  string
	Products []Product
}

// tmpl 在程序启动时解析全部模板；语法错误会直接 panic，尽早暴露问题。
var tmpl = template.Must(
	template.New("root").
		Funcs(template.FuncMap{
			"upper": strings.ToUpper,
			"yuan":  func(f float64) string { return fmt.Sprintf("¥%.2f", f) },
			"inc":   func(i int) int { return i + 1 },
		}).
		ParseFS(templateFS, "templates/*.html"),
)

func productsPage(w http.ResponseWriter, r *http.Request) {
	data := PageData{
		Title:   "商品列表",
		Now:     time.Now(),
		Comment: r.URL.Query().Get("msg"), // 用户输入：模板会自动转义
		Products: []Product{
			{Name: "Go 语言实战", Price: 59.9, InStock: true},
			{Name: "机械键盘", Price: 399, InStock: false},
		},
	}

	// 先渲染到缓冲区：出错时可以返回完整的错误页，而不是半截 HTML
	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "layout", data); err != nil {
		log.Printf("模板渲染失败: %v", err)
		http.Error(w, "页面渲染失败", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	buf.WriteTo(w)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /products", productsPage)
	log.Println("打开 http://localhost:8080/products?msg=欢迎")
	log.Fatal(http.ListenAndServe(":8080", mux))
}`,
    },
    {
      type: "code",
      lang: "html",
      file: "templates/layout.html",
      mod: "example.com/tmpldemo",
      code: String.raw`{{define "layout"}}
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>{{.Title}}</title>
</head>
<body>
  <h1>{{.Title | upper}}</h1>
  <main>{{template "content" .}}</main>
  <footer>生成时间：{{.Now.Format "2006-01-02 15:04"}}</footer>
</body>
</html>
{{end}}`,
    },
    {
      type: "code",
      lang: "html",
      file: "templates/products.html",
      mod: "example.com/tmpldemo",
      code: String.raw`{{define "content"}}
<p>用户留言：{{.Comment}}</p>
<ul>
{{- range $i, $p := .Products}}
  <li>{{inc $i}}. {{$p.Name}} — {{yuan $p.Price}}{{if $p.InStock}}（有货）{{else}}（缺货）{{end}}</li>
{{- else}}
  <li>暂无商品</li>
{{- end}}
</ul>
{{end}}`,
    },
    {
      type: "output",
      title: "访问 /products?msg=欢迎 得到的 HTML 片段（节选）",
      text: String.raw`<p>用户留言：欢迎</p>
<ul>
  <li>1. Go 语言实战 — ¥59.90（有货）</li>
  <li>2. 机械键盘 — ¥399.00（缺货）</li>
</ul>`,
    },
    {
      type: "note",
      title: "block 的用法",
      text: "`{{block \"content\" .}}默认内容{{end}}` 相当于先定义一个名为 content 的默认模板，再用 template 引用它。另一个文件中如果用 define 重新定义了同名模板，就会覆盖默认内容，这是实现页面模板继承的常用方式。",
    },

    { type: "h2", text: "4. 自动转义与安全" },
    {
      type: "ul",
      items: [
        "访问 `/products?msg=<script>alert(1)</script>`，输出的 HTML 会变成 `&lt;script&gt;alert(1)&lt;/script&gt;`，浏览器只会把它当作文本显示，不会执行脚本。",
        "属性、JavaScript、CSS 与 URL 中的数据也会按各自的规则转义，因此模板会根据输出位置选择不同的转义方式。",
        "把用户数据作为普通字段传入模板，而不是自己拼接字符串，是保持安全的基本原则。",
      ],
    },
    {
      type: "warn",
      text: "`template.HTML`、`template.JS`、`template.URL` 等类型会告诉模板「这段内容是可信的」，从而跳过转义。千万不要把用户输入转换成这些类型后再输出，否则会重新引入 XSS 漏洞。第 16 章会详细讨论。",
    },

    { type: "h2", text: "5. 渲染前先写入缓冲区" },
    {
      type: "p",
      text: "模板执行时如果中途出错，前面已经写入响应的内容无法撤回，用户会看到半截页面。示例中先把结果渲染到 `bytes.Buffer`，成功后再一次性写入 ResponseWriter，这是更稳妥的做法。",
    },
  ],
  exercises: [
    "为 PageData 增加一个 `Tags []string` 字段，在模板中用 range 显示标签，为空时显示「暂无标签」。",
    "新增 `templates/about.html`，让它通过 `{{define \"content\"}}` 复用 layout 布局，并增加一个 /about 路由。",
    "访问 `/products?msg=<img src=x onerror=alert(1)>`，观察输出的 HTML 是否被转义。",
  ],
  quiz: [
    {
      q: "生成网页时，应使用哪个标准库包？",
      options: ["text/template", "html/template", "strings", "encoding/xml"],
      answer: 1,
      explain: "html/template 会根据输出位置自动转义内容，可以防止 XSS 攻击。",
    },
    {
      q: "range 遍历的集合为空时，如何输出备用内容？",
      options: ["用 {{if}} 包住 range", "在 range 中使用 {{else}} 分支", "使用 {{default}}", "无法实现"],
      answer: 1,
      explain: "range 后面可以接 {{else}}，集合为空时执行该分支。",
    },
    {
      q: "下列哪种做法最可能引入 XSS 漏洞？",
      options: [
        "把用户输入作为普通字符串字段传入模板",
        "把用户输入转换为 template.HTML 后直接输出",
        "用 template.Must 检查模板语法",
        "先渲染到 bytes.Buffer 再写入响应",
      ],
      answer: 1,
      explain: "template.HTML 会跳过转义。对用户可控的内容使用它，等于直接输出了未经过滤的 HTML。",
    },
  ],
  refs: [
    { title: "标准库 html/template", url: "https://pkg.go.dev/html/template" },
    { title: "pkg.go.dev：text/template（模板语法）", url: "https://pkg.go.dev/text/template" },
    { title: "pkg.go.dev：embed（嵌入文件）", url: "https://pkg.go.dev/embed" },
    { title: "Go 安全最佳实践", url: "https://go.dev/doc/security/best-practices" },
  ],
};
