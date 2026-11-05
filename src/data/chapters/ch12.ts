import type { Chapter } from "../../types";

export const ch12: Chapter = {
  id: "ch12",
  part: "第三部分：Web 开发核心",
  title: "实战：编写 Wiki 应用（官方教程）",
  summary: "跟着官方「Writing Web Applications」的思路，用 net/http、html/template、文件读写与路由参数实现一个可编辑的 Wiki。",
  level: "实战",
  minutes: 90,
  icon: "📝",
  goals: [
    "用结构体与文件实现简单的数据持久化（os.WriteFile / os.ReadFile）",
    "用路由参数 {title} 与正则白名单校验用户输入",
    "综合使用 html/template 渲染查看页与编辑页",
    "理解 POST-Redirect-GET 模式与错误信息的处理原则",
  ],
  body: [
    { type: "h2", text: "1. 项目目标" },
    {
      type: "p",
      text: "这是官方教程「Writing Web Applications」的现代化版本。我们要实现一个极简的 Wiki：每个页面保存为 `data/标题.txt` 文件，支持查看、编辑和保存。它综合运用了前面学过的 net/http、html/template、文件读写、正则校验与路由参数。",
    },
    {
      type: "note",
      title: "和官方原文的区别",
      text: "官方原文使用 regexp 与闭包 makeHandler 从 URL 中提取页面标题。Go 1.22 之后，可以直接用路由模式 `/view/{title}` 加上 r.PathValue 完成同样的工作，代码更简洁。校验逻辑仍然保留，安全性不变。",
    },

    { type: "h2", text: "2. 项目结构" },
    {
      type: "code",
      lang: "text",
      code: String.raw`wiki/
├── go.mod
├── main.go          # 页面模型、处理函数与路由（本章只用一个文件）
├── tmpl/
│   ├── view.html    # 查看页面
│   └── edit.html    # 编辑页面
└── data/            # 运行时自动创建，保存 *.txt 页面文件`,
    },

    { type: "h2", text: "3. 页面模型与文件存储" },
    {
      type: "p",
      text: "`Page` 结构体保存标题和正文（`[]byte`）。`save` 方法把页面写入 `data/标题.txt`，`loadPage` 则从文件中读取。`os.WriteFile` 与 `os.ReadFile` 是 Go 1.16 起推荐使用的文件读写函数，一次调用即可完成操作。",
    },

    { type: "h2", text: "4. 完整代码" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/wiki",
      code: String.raw`package main

import (
	"bytes"
	"embed"
	"html/template"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
)

//go:embed tmpl/*.html
var tmplFS embed.FS

var templates = template.Must(template.ParseFS(tmplFS, "tmpl/*.html"))

// validTitle 只允许字母和数字，防止路径穿越等攻击。
var validTitle = regexp.MustCompile("^[a-zA-Z0-9]+$")

const dataDir = "data"

type Page struct {
	Title string
	Body  []byte
}

// save 把页面保存为 data/<标题>.txt
func (p *Page) save() error {
	filename := filepath.Join(dataDir, p.Title+".txt")
	return os.WriteFile(filename, p.Body, 0o600)
}

// loadPage 从文件中读取页面。
func loadPage(title string) (*Page, error) {
	filename := filepath.Join(dataDir, title+".txt")
	body, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	return &Page{Title: title, Body: body}, nil
}

// getTitle 读取并校验路径参数 {title}。
func getTitle(w http.ResponseWriter, r *http.Request) (string, bool) {
	title := r.PathValue("title")
	if !validTitle.MatchString(title) {
		http.NotFound(w, r)
		return "", false
	}
	return title, true
}

// renderTemplate 先渲染到缓冲区，成功后再写入响应。
func renderTemplate(w http.ResponseWriter, name string, p *Page) {
	var buf bytes.Buffer
	if err := templates.ExecuteTemplate(&buf, name+".html", p); err != nil {
		log.Printf("渲染模板失败: %v", err)
		http.Error(w, "内部错误", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	buf.WriteTo(w)
}

func viewHandler(w http.ResponseWriter, r *http.Request) {
	title, ok := getTitle(w, r)
	if !ok {
		return
	}
	p, err := loadPage(title)
	if err != nil {
		// 页面不存在：跳转到编辑页去创建它
		http.Redirect(w, r, "/edit/"+title, http.StatusFound)
		return
	}
	renderTemplate(w, "view", p)
}

func editHandler(w http.ResponseWriter, r *http.Request) {
	title, ok := getTitle(w, r)
	if !ok {
		return
	}
	p, err := loadPage(title)
	if err != nil {
		p = &Page{Title: title}
	}
	renderTemplate(w, "edit", p)
}

func saveHandler(w http.ResponseWriter, r *http.Request) {
	title, ok := getTitle(w, r)
	if !ok {
		return
	}
	p := &Page{Title: title, Body: []byte(r.FormValue("body"))}
	if err := p.save(); err != nil {
		log.Printf("保存页面失败: %v", err)
		http.Error(w, "保存失败", http.StatusInternalServerError)
		return
	}
	http.Redirect(w, r, "/view/"+title, http.StatusFound)
}

func main() {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/view/FrontPage", http.StatusFound)
	})
	mux.HandleFunc("GET /view/{title}", viewHandler)
	mux.HandleFunc("GET /edit/{title}", editHandler)
	mux.HandleFunc("POST /save/{title}", saveHandler)

	log.Println("Wiki 已启动：http://localhost:8080/view/FrontPage")
	log.Fatal(http.ListenAndServe(":8080", mux))
}`,
    },
    {
      type: "code",
      lang: "html",
      file: "tmpl/view.html",
      mod: "example.com/wiki",
      code: String.raw`<h1>{{.Title}}</h1>
<p>[<a href="/edit/{{.Title}}">编辑</a>]</p>
<div>{{printf "%s" .Body}}</div>`,
    },
    {
      type: "code",
      lang: "html",
      file: "tmpl/edit.html",
      mod: "example.com/wiki",
      code: String.raw`<h1>编辑：{{.Title}}</h1>
<form action="/save/{{.Title}}" method="POST">
  <textarea name="body" rows="20" cols="80">{{printf "%s" .Body}}</textarea><br>
  <input type="submit" value="保存">
</form>`,
    },

    { type: "h2", text: "5. 运行与体验" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`mkdir wiki && cd wiki
go mod init example.com/wiki
# 把上面的 main.go 与 tmpl/ 目录放好后
go run .`,
    },
    {
      type: "p",
      text: "打开 http://localhost:8080 ，会自动跳转到 FrontPage；由于页面不存在，会进入编辑页。输入内容并保存后，就会跳转到查看页。随后可以在 data 目录中看到 FrontPage.txt 文件。",
    },
    {
      type: "output",
      text: "2026/10/01 12:00:00 Wiki 已启动：http://localhost:8080/view/FrontPage",
    },

    { type: "h2", text: "6. 关键点回顾" },
    {
      type: "ul",
      items: [
        "`GET /{$}` 只匹配首页，并重定向到 FrontPage。`{title}` 是路径参数，用 `r.PathValue(\"title\")` 读取。",
        "正则 `^[a-zA-Z0-9]+$` 是白名单校验：只允许字母和数字，因此 `../../etc/passwd` 这类路径穿越输入会被拒绝。",
        "保存成功后用 `http.Redirect` 跳转到查看页，遵循 POST-Redirect-GET 模式，刷新页面不会重复提交表单。",
        "错误细节写入日志，只把通用的错误信息返回给用户，避免泄露内部实现（第 16 章）。",
      ],
    },
    {
      type: "tip",
      text: "用 `curl -i http://localhost:8080/view/..%2F..%2Fetc` 之类的请求尝试攻击，观察服务器的响应。正则校验正是为了防御这类问题。",
    },
  ],
  exercises: [
    "增加删除页面功能：`POST /delete/{title}` 删除对应的 txt 文件，然后跳转到首页。",
    "在首页列出所有页面：用 `os.ReadDir` 遍历 data 目录，并生成链接列表。",
    "实现 WikiWord 自动链接：把正文中的 CamelCase 单词（如 HelloWorld）替换为指向对应页面的链接。",
    "为 getTitle 相关的校验逻辑编写表驱动测试，覆盖合法标题与非法标题。",
  ],
  quiz: [
    {
      q: "为什么要对页面标题做正则校验？",
      options: ["让标题更美观", "防止路径穿越等非法文件名", "提高运行速度", "这是 Go 的强制要求"],
      answer: 1,
      explain: "标题会直接拼接成文件路径。白名单校验可以阻止 ../ 之类的输入访问 data 目录之外的文件。",
    },
    {
      q: "保存页面后，为什么要用 http.Redirect 跳转，而不是直接输出页面？",
      options: [
        "为了减少代码行数",
        "遵循 POST-Redirect-GET 模式，避免刷新时重复提交表单",
        "因为 POST 请求不能返回 HTML",
        "为了让浏览器缓存页面",
      ],
      answer: 1,
      explain: "POST 后重定向（PRG）可以避免用户刷新页面时再次提交相同的表单数据。",
    },
    {
      q: "os.WriteFile 的作用是？",
      options: ["读取文件内容", "创建目录", "一次性把字节写入文件（不存在则创建）", "删除文件"],
      answer: 2,
      explain: "os.WriteFile 会打开或创建文件，写入全部数据并关闭文件，是最简洁的文件写入方式。",
    },
  ],
  refs: [
    { title: "编写 Web 应用（Writing Web Applications）", url: "https://go.dev/doc/articles/wiki/" },
    { title: "pkg.go.dev：regexp", url: "https://pkg.go.dev/regexp" },
    { title: "pkg.go.dev：os（文件读写）", url: "https://pkg.go.dev/os" },
    { title: "pkg.go.dev：html/template", url: "https://pkg.go.dev/html/template" },
    { title: "标准库 net/http", url: "https://pkg.go.dev/net/http" },
  ],
};
