import type { Chapter } from "../../types";

export const ch06: Chapter = {
  id: "ch06",
  part: "第一部分：Go 语言基础",
  title: "并发入门：goroutine、channel 与 sync",
  summary: "用 goroutine 并发执行任务，用 channel 在协程之间传递数据，用 Mutex 与 select 保证安全与可控。",
  level: "进阶",
  minutes: 60,
  icon: "🧵",
  goals: [
    "使用 go 关键字启动 goroutine，并用 sync.WaitGroup 等待其完成",
    "理解数据竞争，并用 sync.Mutex 保护共享数据",
    "使用带缓冲与无缓冲 channel 传递数据，并正确关闭 channel",
    "使用 select 与 context 实现超时和取消",
    "使用 go run -race 检测数据竞争",
  ],
  body: [
    { type: "h2", text: "1. goroutine：轻量级并发" },
    {
      type: "p",
      text: "在函数调用前加上 `go` 关键字，就会启动一个 **goroutine**。它由 Go 运行时调度，初始栈非常小，因此可以轻松创建成千上万个。注意：主函数返回时，所有 goroutine 都会直接结束，所以需要等待它们完成。",
    },
    {
      type: "ul",
      items: [
        "`sync.WaitGroup` 用于等待一组 goroutine 结束。Go 1.25 起可以直接调用 `wg.Go(f)`，它会自动完成 Add 与 Done。",
        "不要假设 goroutine 的执行顺序；需要确定顺序时，必须通过同步机制显式约束。",
      ],
    },

    { type: "h2", text: "2. 数据竞争与 Mutex" },
    {
      type: "p",
      text: "多个 goroutine 同时读写同一块内存，而且至少有一个是写操作，就会产生**数据竞争（data race）**。结果不可预测，而且很难复现。使用 `sync.Mutex` 加锁，可以保证同一时间只有一个 goroutine 访问共享数据。",
    },

    { type: "h2", text: "3. channel：通过通信共享数据" },
    {
      type: "p",
      text: "Effective Go 中有一句名言：“不要通过共享内存来通信，而要通过通信来共享内存。” channel 就是 goroutine 之间传递数据的管道：`ch <- v` 发送，`v := <-ch` 接收。",
    },
    {
      type: "ul",
      items: [
        "**无缓冲** channel：发送和接收必须同时就绪，否则相互等待。",
        "**带缓冲** channel：缓冲区未满时发送不会阻塞，例如 `make(chan int, 10)`。",
        "**关闭** channel：`close(ch)` 之后，接收方可以用 `v, ok := <-ch` 判断通道是否已关闭；`range ch` 会在关闭后自动结束循环。",
      ],
    },

    { type: "h2", text: "4. 完整示例：工作池" },
    {
      type: "p",
      text: "下面的程序先用 Mutex 保护计数器，再用 jobs 与 results 两个 channel 实现一个简单的工作池：3 个 worker 从 jobs 取任务，把结果写入 results。",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/concurrency",
      code: String.raw`package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Counter 用 Mutex 保护共享数据，避免数据竞争。
type Counter struct {
	mu sync.Mutex
	n  int
}

func (c *Counter) Inc() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.n++
}

func (c *Counter) Value() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n
}

// worker 从 jobs 取任务，并把结果发送到 results。
func worker(ctx context.Context, id int, jobs <-chan int, results chan<- string) {
	for {
		select {
		case <-ctx.Done(): // 超时或被取消
			return
		case j, ok := <-jobs:
			if !ok { // jobs 已关闭，且没有剩余任务
				return
			}
			time.Sleep(20 * time.Millisecond) // 模拟耗时操作
			results <- fmt.Sprintf("worker-%d 完成任务-%d", id, j)
		}
	}
}

func main() {
	// 1. goroutine + WaitGroup + Mutex
	var counter Counter
	var wg sync.WaitGroup
	for range 100 {
		wg.Go(counter.Inc) // Go 1.25+：自动完成 Add(1) 与 Done()
	}
	wg.Wait()
	fmt.Println("计数:", counter.Value())

	// 2. 工作池：3 个 worker 处理 6 个任务，2 秒后超时取消
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	jobs := make(chan int, 10)
	results := make(chan string, 10)

	for w := 1; w <= 3; w++ {
		go worker(ctx, w, jobs, results)
	}
	for j := 1; j <= 6; j++ {
		jobs <- j
	}
	close(jobs) // 关闭后，worker 处理完剩余任务会自动退出

	for range 6 {
		fmt.Println(<-results)
	}
}`,
    },
    {
      type: "output",
      title: "运行结果（示例：worker 的完成顺序每次运行都可能不同）",
      text: String.raw`计数: 100
worker-2 完成任务-1
worker-1 完成任务-2
worker-3 完成任务-3
worker-2 完成任务-4
worker-1 完成任务-5
worker-3 完成任务-6`,
    },

    { type: "h2", text: "5. select 与超时控制" },
    {
      type: "p",
      text: "`select` 可以同时等待多个 channel 操作，哪个先就绪就执行哪个分支。配合 `ctx.Done()`，就能实现取消与超时：`context.WithTimeout` 会在指定时间后自动关闭 `ctx.Done()` 通道，worker 收到信号后及时退出。",
    },

    { type: "h2", text: "6. 数据竞争检测" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`go run -race .      # 运行时检测数据竞争
go test -race ./...   # 测试时检测数据竞争`,
    },
    {
      type: "tip",
      text: "`-race` 会让程序变慢约 2 到 20 倍，并增加内存占用，适合在测试和 CI 中使用，不适合生产环境。竞态检测只能发现运行时实际发生的竞争。",
    },
    {
      type: "warn",
      text: "向已关闭的 channel 发送数据会 panic，重复关闭 channel 也会 panic。通常由发送方负责关闭 channel。",
    },
    {
      type: "note",
      title: "Go 1.27 goroutine 泄漏分析",
      text: "goroutineleak 性能分析在 Go 1.27 中已正式可用，可以发现永久阻塞、无法退出的 goroutine（第 18 章会介绍如何在服务中启用）。",
    },
  ],
  exercises: [
    "把 Counter 改为使用 `sync/atomic` 包中的 `atomic.Int64`，实现无锁计数。",
    "修改工作池，让它在 1 秒内没有完成全部任务时打印「超时」。提示：使用 `time.After` 与 select。",
    "删除 Counter 中的 Mutex，使用 `go run -race .` 运行，观察竞态报告的内容。",
  ],
  quiz: [
    {
      q: "启动一个 goroutine 应该使用哪个关键字？",
      options: ["async", "go", "thread", "spawn"],
      answer: 1,
      explain: "在函数调用前加 go 即可启动 goroutine，例如 go worker(jobs)。",
    },
    {
      q: "向已经关闭的 channel 发送数据，会发生什么？",
      options: ["返回零值", "阻塞等待", "引发 panic", "数据被静默丢弃"],
      answer: 2,
      explain: "向已关闭的 channel 发送数据会 panic，因此应由发送方负责关闭 channel。",
    },
    {
      q: "用于检测数据竞争的命令是？",
      options: ["go vet", "go test -race", "go fmt", "go mod tidy"],
      answer: 1,
      explain: "-race 参数会开启竞态检测器，在运行时报告对共享数据的并发不安全访问。",
    },
  ],
  refs: [
    { title: "Effective Go：并发", url: "https://go.dev/doc/effective_go#concurrency" },
    { title: "Go Blog：Go Concurrency Patterns: Pipelines and cancellation", url: "https://go.dev/blog/pipelines" },
    { title: "Go Data Race Detector（竞态检测器）", url: "https://go.dev/doc/articles/race_detector" },
    { title: "pkg.go.dev：sync", url: "https://pkg.go.dev/sync" },
    { title: "pkg.go.dev：context", url: "https://pkg.go.dev/context" },
  ],
};
