# Go Web 开发完全教程

基于 Go 官方文档、面向新手的 Go Web 开发教程站（Go 1.27）：语言基础、net/http、路由增强、模板、数据库、slog、安全与部署。

在线访问：https://akiratach.github.io/go-web-development-guide/

## 本地开发

```bash
npm ci
npm run dev     # 开发服务器
npm run build   # 构建（vite-plugin-singlefile 打成单个 dist/index.html）
```

推送到 main 分支后由 GitHub Actions 自动构建并部署到 GitHub Pages。
