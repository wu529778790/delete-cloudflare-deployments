# Cloudflare Pages 部署记录清理工具（GitHub Actions）

清理 Cloudflare Pages 项目旧部署记录：对每个项目保留最新的 N 个部署（默认 10），删除更早的部署以节省空间。基于 Node + pnpm 实现，并通过 GitHub Actions 自动运行。

## 功能特点

- **批量项目**：自动获取账号下所有 Cloudflare Pages 项目并逐一清理
- **保留最新 N 条**：默认保留 10 条（可通过环境变量配置）
- **循环处理**：按页获取部署记录，直至每个项目的部署数量小于等于阈值
- **安全便捷**：使用 GitHub Actions，Token 仅保存在你自己的仓库 Secrets 中

---

## 一键使用（推荐：Fork + GitHub Actions）

### 步骤 1：Fork 本仓库

点击右上角 Fork，将本项目复制到你的 GitHub 账号下。

### 步骤 2：配置 Secrets（安全）

在你 Fork 后的仓库中，进入：Settings → Secrets and variables → Actions → New repository secret，添加：

- `CF_API_TOKEN`：Cloudflare API Token（见下文“如何获取”）
- `CF_ACCOUNT_ID`：Cloudflare Account ID

可选：在 Settings → Secrets and variables → Actions → Variables 添加：

- `CF_KEEP_LATEST`：保留的部署数量，默认 `10`

### 步骤 3：触发工作流

工作流文件已内置在 `.github/workflows/cleanup-deployments.yml`：

- 手动触发：进入 GitHub 仓库的 Actions 标签页 → 选择 “Cleanup Cloudflare Pages Deployments” → Run workflow
- 定时触发：已配置为每日（UTC 0 点）运行，你也可以自行修改 Cron 表达式

### 步骤 4：查看日志与结果

在 Actions 运行页面查看日志输出，脚本会打印每个项目的处理结果以及删除的部署 ID。

---

## 如何获取 Cloudflare Token 与 Account ID

- **API Token**：
  1) 登录 `https://dash.cloudflare.com/profile/api-tokens`
  2) Create Token → Create Custom Token
  3) 最小权限：`Account - Cloudflare Pages - Edit`
  4) 在 Account Resources 选择你的账号，创建后保存 Token 值

- **Account ID**：
  - 登录 Cloudflare 控制台后右上角可见，或从地址栏中复制（`https://dash.cloudflare.com/<your-account-id>`）

---

## 安全说明

- 你在 GitHub 中配置的 `CF_API_TOKEN` 与 `CF_ACCOUNT_ID` 仅保存在你自己的仓库 Secrets 中
- 工作流在 GitHub 托管的 Runner 内执行，脚本只在运行时读取这些环境变量
- 仓库代码不会上传、存储或回传你的 Token；请勿将 Token 写入代码或提交到版本库

---

## 进阶用法（可选）

- 本地运行（调试用）：

  ```bash
  pnpm i
  CF_API_TOKEN=... CF_ACCOUNT_ID=... CF_KEEP_LATEST=10 pnpm start
  ```

- 仅清理某个项目（保留生产部署）：

  ```bash
  CF_API_TOKEN=... CF_ACCOUNT_ID=... CF_PAGES_PROJECT_NAME=your_project pnpm run delete:project
  # 可选：强制删除具有别名的部署（可能影响已别名的预览地址）
  CF_DELETE_ALIASED_DEPLOYMENTS=true CF_API_TOKEN=... CF_ACCOUNT_ID=... CF_PAGES_PROJECT_NAME=your_project pnpm run delete:project
  ```

> 如需在 GitHub Actions 中对单个项目做定制清理，可参考 `package.json` 的 `delete:project` 命令，自行新增一个简单的工作流文件并传入上面的环境变量。

---

## 常见问题（FAQ）

- **API 返回 403**：检查 API Token 是否具有 `Cloudflare Pages - Edit` 权限，并确认 Token 作用域选择了正确的账号。
- **清理不完全 / 速度较慢**：Cloudflare API 按页返回（默认每页最多 25 条）。脚本会循环处理直到达标；若部署数量非常多，建议按天定时运行。
- **修改保留数量**：设置仓库变量（Actions Variables）`CF_KEEP_LATEST`，或在工作流中为步骤注入该环境变量。

---

Cloudflare Pages 官方脚本参考：[删除部署记录脚本](https://pub-505c82ba1c844ba788b97b1ed9415e75.r2.dev/delete-all-deployments.zip)
