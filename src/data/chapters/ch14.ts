import type { Chapter } from "../../types";

export const ch14: Chapter = {
  id: "ch14",
  part: "第三部分：Web 开发核心",
  title: "数据库访问：database/sql",
  summary: "基于官方「Accessing a relational database」教程，学会用 database/sql 查询、写入数据，并掌握连接池、事务与 context。",
  level: "实战",
  minutes: 80,
  icon: "🗄️",
  goals: [
    "理解 database/sql 的接口与驱动分离的设计",
    "使用 sql.Open、Ping、Query、QueryRow、Exec 访问数据库",
    "正确扫描结果（Scan）并处理 sql.ErrNoRows、rows.Err",
    "使用参数化查询防止 SQL 注入",
    "配置连接池，并使用事务保证数据一致性",
  ],
  body: [
    { type: "h2", text: "1. database/sql 的设计" },
    {
      type: "ul",
      items: [
        "`database/sql` 是标准库提供的**通用接口**，具体数据库由第三方**驱动**实现。换数据库时，大部分业务代码无需改动。",
        "官方示例直接导入驱动包，并使用它提供的 `mysql.NewConfig`。如果只想注册驱动、不直接调用它的 API，可以使用空白导入 `_`。",
        "`sql.DB` 是连接池的句柄，并发安全，应当在程序启动时创建一次并全局复用，而不是每个请求都重新打开。",
        "`sql.Open` 只是创建句柄，通常不会立即连接数据库；用 `db.Ping()` 检查连接是否真正可用。",
      ],
    },

    { type: "h2", text: "2. 准备数据库" },
    {
      type: "p",
      text: "官方教程以 MySQL 为例，数据是一些老爵士唱片。先执行下面的 SQL 脚本创建表并写入示例数据（脚本命名为 create-tables.sql）：",
    },
    {
      type: "code",
      lang: "sql",
      code: String.raw`DROP TABLE IF EXISTS album;
CREATE TABLE album (
  id         INT AUTO_INCREMENT NOT NULL,
  title      VARCHAR(128) NOT NULL,
  artist     VARCHAR(255) NOT NULL,
  price      DECIMAL(5,2) NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO album (title, artist, price) VALUES
  ('Blue Train', 'John Coltrane', 56.99),
  ('Giant Steps', 'John Coltrane', 63.99),
  ('Jeru', 'Gerry Mulligan', 17.99),
  ('Sarah Vaughan', 'Sarah Vaughan', 34.98);`,
    },
    {
      type: "p",
      text: "在 MySQL 命令行中执行 `source /path/to/create-tables.sql`，然后用 `select * from album;` 验证数据是否写入成功。",
    },

    { type: "h2", text: "3. 创建模块、导入驱动并连接" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`mkdir data-access && cd data-access
go mod init example/data-access   # 模块名可以自定义
go get .                         # 根据 import 自动添加 MySQL 驱动依赖

# 设置数据库账号（Windows PowerShell 使用：$env:DBUSER="username"）
export DBUSER=username
export DBPASS=password
go run .`,
    },
    {
      type: "p",
      text: "下面是官方教程的完整程序。它先建立连接，然后依次演示查询多行、查询单行与插入数据，三个函数的写法正是本章的重点。",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/albums",
      code: String.raw`package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/go-sql-driver/mysql"
)

var db *sql.DB

type Album struct {
	ID     int64
	Title  string
	Artist string
	Price  float32
}

func main() {
	// 收集连接参数
	cfg := mysql.NewConfig()
	cfg.User = os.Getenv("DBUSER")
	cfg.Passwd = os.Getenv("DBPASS")
	cfg.Net = "tcp"
	cfg.Addr = "127.0.0.1:3306"
	cfg.DBName = "recordings"

	// 获取数据库句柄
	var err error
	db, err = sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		log.Fatal(err)
	}

	pingErr := db.Ping()
	if pingErr != nil {
		log.Fatal(pingErr)
	}
	fmt.Println("Connected!")

	albums, err := albumsByArtist("John Coltrane")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Albums found: %v\n", albums)

	// 这里硬编码 ID 2 用于测试查询
	alb, err := albumByID(2)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Album found: %v\n", alb)

	albID, err := addAlbum(Album{
		Title:  "The Modern Sound of Betty Carter",
		Artist: "Betty Carter",
		Price:  49.99,
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("ID of added album: %v\n", albID)
}

// albumsByArtist 查询指定艺术家的所有专辑（多行查询）。
func albumsByArtist(name string) ([]Album, error) {
	var albums []Album

	rows, err := db.Query("SELECT * FROM album WHERE artist = ?", name)
	if err != nil {
		return nil, fmt.Errorf("albumsByArtist %q: %v", name, err)
	}
	defer rows.Close()
	// 逐行读取，并用 Scan 把列值写入结构体字段
	for rows.Next() {
		var alb Album
		if err := rows.Scan(&alb.ID, &alb.Title, &alb.Artist, &alb.Price); err != nil {
			return nil, fmt.Errorf("albumsByArtist %q: %v", name, err)
		}
		albums = append(albums, alb)
	}
	// 循环结束后检查错误：查询中途失败时，只有 rows.Err 能发现
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("albumsByArtist %q: %v", name, err)
	}
	return albums, nil
}

// albumByID 查询指定 ID 的专辑（单行查询）。
func albumByID(id int64) (Album, error) {
	var alb Album

	row := db.QueryRow("SELECT * FROM album WHERE id = ?", id)
	if err := row.Scan(&alb.ID, &alb.Title, &alb.Artist, &alb.Price); err != nil {
		if err == sql.ErrNoRows {
			return alb, fmt.Errorf("albumsById %d: no such album", id)
		}
		return alb, fmt.Errorf("albumsById %d: %v", id, err)
	}
	return alb, nil
}

// addAlbum 插入一张专辑，并返回数据库生成的自增 ID（不返回行的语句使用 Exec）。
func addAlbum(alb Album) (int64, error) {
	result, err := db.Exec("INSERT INTO album (title, artist, price) VALUES (?, ?, ?)", alb.Title, alb.Artist, alb.Price)
	if err != nil {
		return 0, fmt.Errorf("addAlbum: %v", err)
	}
	id, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("addAlbum: %v", err)
	}
	return id, nil
}`,
    },
    {
      type: "output",
      text: String.raw`Connected!
Albums found: [{1 Blue Train John Coltrane 56.99} {2 Giant Steps John Coltrane 63.99}]
Album found: {2 Giant Steps John Coltrane 63.99}
ID of added album: 5`,
    },

    { type: "h2", text: "4. 查询多行、单行与写入" },
    {
      type: "ul",
      items: [
        "**Query（多行）**：返回 `*sql.Rows`，必须 `defer rows.Close()`，用 `rows.Next()` 循环，并用 `rows.Scan` 把每列写入变量。循环结束后检查 `rows.Err()`。",
        "**QueryRow（单行）**：错误会推迟到 `Scan` 时返回。没有记录时返回 `sql.ErrNoRows`，应当转换为有意义的业务错误。",
        "**Exec（写入）**：用于 INSERT、UPDATE、DELETE 等不返回行的语句。`LastInsertId()` 可以获取自增 ID；PostgreSQL 不支持该方法，需要改用 `RETURNING` 子句。",
        "**占位符**：SQL 语句中使用 `?` 表示参数，参数值作为额外参数传入。数据与 SQL 分开传递，数据库不会把它们当作 SQL 代码执行，这是防止 SQL 注入的关键。",
      ],
    },
    {
      type: "warn",
      text: "切勿使用 `fmt.Sprintf` 或字符串拼接把用户输入写进 SQL 语句。这是最常见的 SQL 注入漏洞来源（第 16 章详解）。",
    },

    { type: "h2", text: "5. 连接池、事务与 context（进阶）" },
    {
      type: "p",
      text: "生产环境中还需要关注三件事：连接池的大小与连接寿命；事务，保证多条语句要么全部成功、要么全部回滚；以及 context，为数据库操作设置超时与取消。",
    },
    {
      type: "code",
      lang: "go",
      file: "tx.go",
      mod: "example.com/albums",
      code: String.raw`package main

import (
	"context"
	"time"
)

// configurePool 设置连接池参数（在 db 初始化之后调用一次）。
func configurePool() {
	db.SetMaxOpenConns(25)                 // 最多同时打开 25 个连接
	db.SetMaxIdleConns(25)                 // 最多保留 25 个空闲连接
	db.SetConnMaxLifetime(5 * time.Minute) // 单个连接最长使用 5 分钟
}

// raisePrices 在一个事务中批量提价：要么全部成功，要么全部回滚。
func raisePrices(ctx context.Context, ids []int64, delta float32) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() // 提交成功后再调用 Rollback 会返回 sql.ErrTxDone，可以安全忽略

	for _, id := range ids {
		if _, err := tx.ExecContext(ctx, "UPDATE album SET price = price + ? WHERE id = ?", delta, id); err != nil {
			return err // 返回错误时，deferred 的 Rollback 会撤销前面的修改
		}
	}
	return tx.Commit()
}`,
    },
    {
      type: "tip",
      text: "使用 `db.QueryContext(ctx, ...)`、`db.ExecContext(ctx, ...)` 等带 Context 的方法，就可以在 HTTP 请求取消或超时时中止数据库查询，避免浪费资源。",
    },

    { type: "h2", text: "6. 其他数据库" },
    {
      type: "table",
      head: ["数据库", "驱动包", "sql.Open 示例", "占位符"],
      rows: [
        ["MySQL", "`github.com/go-sql-driver/mysql`", "`sql.Open(\"mysql\", dsn)`", "`?`"],
        ["PostgreSQL", "`github.com/jackc/pgx/v5/stdlib`", "`sql.Open(\"pgx\", dsn)`", "`$1`、`$2`"],
        ["SQLite（纯 Go，无需 CGO）", "`modernc.org/sqlite`", "`sql.Open(\"sqlite\", \"app.db\")`", "`?`"],
      ],
    },
    {
      type: "p",
      text: "完整的驱动列表见官方的 SQLDrivers 维基页面。第 19 章的综合项目使用 SQLite，无需安装数据库服务，非常适合练习。",
    },
  ],
  exercises: [
    "为 albums 增加一个 HTTP 接口 `GET /albums?artist=...`，返回 JSON（结合第 9 章的内容）。",
    "使用 raisePrices 对两张专辑同时提价，并在中途故意返回错误，验证数据没有被修改。",
    "把 `db.Query` 改为 `db.QueryContext(ctx, ...)`，并用 `context.WithTimeout` 设置 1 秒超时。",
  ],
  quiz: [
    {
      q: "关于 sql.DB，下列哪种用法是正确的？",
      options: ["每次查询都调用一次 sql.Open", "程序启动时创建一次并全局复用", "每个请求结束后立即关闭", "只能在 main 函数中使用"],
      answer: 1,
      explain: "sql.DB 本身就是连接池，并发安全，应当长期复用，而不是频繁创建和关闭。",
    },
    {
      q: "下列哪种写法能有效防止 SQL 注入？",
      options: ["使用 fmt.Sprintf 拼接 SQL", "使用占位符，并把参数作为额外参数传入", "对输入调用 strings.ReplaceAll", "把 SQL 语句写在 HTML 中"],
      answer: 1,
      explain: "参数化查询把 SQL 结构与数据分开，数据不会被当作 SQL 语句执行。",
    },
    {
      q: "使用 db.QueryRow 查询时，如果没有找到记录，Scan 会返回哪个错误？",
      options: ["io.EOF", "sql.ErrNoRows", "os.ErrNotExist", "返回 nil"],
      answer: 1,
      explain: "sql.ErrNoRows 表示查询结果为空，通常应转换为「记录不存在」之类的业务错误。",
    },
  ],
  refs: [
    { title: "访问关系型数据库（Accessing a relational database）", url: "https://go.dev/doc/tutorial/database-access" },
    { title: "pkg.go.dev：database/sql", url: "https://pkg.go.dev/database/sql" },
    { title: "SQL 驱动列表（SQLDrivers）", url: "https://go.dev/wiki/SQLDrivers" },
    { title: "go-sql-driver/mysql 文档", url: "https://pkg.go.dev/github.com/go-sql-driver/mysql" },
    { title: "modernc.org/sqlite 文档", url: "https://pkg.go.dev/modernc.org/sqlite" },
  ],
};
