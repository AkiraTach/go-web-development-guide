export interface DocLink {
  topic: string;
  url: string;
  desc: string;
}

/** 用户指定的核心官方文档 */
export const coreDocs: DocLink[] = [
  {
    topic: "官方教程总目录",
    url: "https://go.dev/doc/tutorial/",
    desc: "所有官方教程的入口，可作为学习路线的总索引",
  },
  {
    topic: "官方的项目/模块布局指南",
    url: "https://go.dev/doc/modules/layout",
    desc: "目录结构最权威的参考：basic package、cmd、internal 等布局",
  },
  {
    topic: "编写 Web 应用",
    url: "https://go.dev/doc/articles/wiki/",
    desc: "标准库 + html/template 入门，官方 Wiki 实战项目",
  },
  {
    topic: "访问关系型数据库",
    url: "https://go.dev/doc/tutorial/database-access",
    desc: "database/sql 与 MySQL 驱动的完整入门示例",
  },
  {
    topic: "Go 1.22 路由增强",
    url: "https://go.dev/blog/routing-enhancements",
    desc: "HTTP 方法匹配、路径参数、通配符与优先级规则",
  },
  {
    topic: "标准库 net/http",
    url: "https://pkg.go.dev/net/http",
    desc: "HTTP 客户端与服务端的完整 API 参考",
  },
  {
    topic: "标准库 html/template",
    url: "https://pkg.go.dev/html/template",
    desc: "安全的 HTML 模板引擎，支持上下文自动转义",
  },
  {
    topic: "标准库 log/slog 结构化日志",
    url: "https://go.dev/blog/slog",
    desc: "结构化日志的设计理念与用法",
  },
  {
    topic: "安全最佳实践",
    url: "https://go.dev/doc/security/best-practices",
    desc: "govulncheck、模糊测试、竞态检测、go vet 等安全实践",
  },
  {
    topic: "Effective Go",
    url: "https://go.dev/doc/effective_go",
    desc: "Go 编码风格与惯用法的经典指南",
  },
];

/** 官方教程合集（来自 go.dev/doc/tutorial/ 目录） */
export const officialTutorials: DocLink[] = [
  {
    topic: "Getting started：Say Hello, World with Go",
    url: "https://go.dev/doc/tutorial/getting-started",
    desc: "第一个 Go 程序与外部包调用",
  },
  {
    topic: "Create a module",
    url: "https://go.dev/doc/tutorial/create-module",
    desc: "多部分教程：函数、错误处理、随机数、测试与编译安装",
  },
  {
    topic: "Getting started with multi-module workspaces",
    url: "https://go.dev/doc/tutorial/workspaces",
    desc: "多模块工作区（go.work）的创建与使用",
  },
  {
    topic: "Working with JSON",
    url: "https://go.dev/doc/tutorial/json",
    desc: "使用标准库 encoding/json 处理 JSON 数据",
  },
  {
    topic: "Accessing a relational database",
    url: "https://go.dev/doc/tutorial/database-access",
    desc: "使用 database/sql 访问关系型数据库",
  },
  {
    topic: "Developing a RESTful API with Go and Gin",
    url: "https://go.dev/doc/tutorial/web-service-gin",
    desc: "使用 Gin 框架编写 RESTful Web 服务",
  },
  {
    topic: "Getting started with generics",
    url: "https://go.dev/doc/tutorial/generics",
    desc: "泛型入门：类型参数与约束",
  },
  {
    topic: "Getting started with fuzzing",
    url: "https://go.dev/doc/tutorial/fuzz",
    desc: "模糊测试：自动生成输入发现边界问题",
  },
  {
    topic: "Getting started with govulncheck",
    url: "https://go.dev/doc/tutorial/govulncheck",
    desc: "使用 govulncheck 查找并修复已知漏洞",
  },
  {
    topic: "Find and fix vulnerable dependencies with VS Code Go",
    url: "https://go.dev/doc/tutorial/govulncheck-ide",
    desc: "在编辑器中直接发现与修复依赖漏洞",
  },
  {
    topic: "A Tour of Go",
    url: "https://go.dev/tour/",
    desc: "交互式 Go 语言入门，适合快速浏览语法",
  },
];

/** 版本与发布说明 */
export const releaseDocs: DocLink[] = [
  {
    topic: "Go 1.27 发布说明（当前最新稳定版）",
    url: "https://go.dev/doc/go1.27",
    desc: "2026-08-19 发布：泛型方法、encoding/json v2、goroutine 泄漏分析正式可用等",
  },
  {
    topic: "Go 1.26 发布说明",
    url: "https://go.dev/doc/go1.26",
    desc: "new 支持初始值表达式、Green Tea 垃圾回收器默认开启",
  },
  {
    topic: "Go 1.25 发布说明",
    url: "https://go.dev/doc/go1.25",
    desc: "sync.WaitGroup.Go、net/http CrossOriginProtection、testing/synctest 正式可用",
  },
  {
    topic: "Go 1.22 发布说明",
    url: "https://go.dev/doc/go1.22",
    desc: "net/http 路由增强、range 遍历整数、循环变量语义调整",
  },
  {
    topic: "版本历史（Release History）",
    url: "https://go.dev/doc/devel/release",
    desc: "所有 Go 版本与补丁发布记录",
  },
];
