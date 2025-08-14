# Cloudflare Pages 部署记录清理工具（Node + pnpm）

清理 Cloudflare Pages 项目旧部署记录。对每个项目保留最新的 N 个部署（默认 10），删除更早的部署以节省空间。

## 功能特点

- **批量项目**：自动获取账号下所有 Cloudflare Pages 项目并逐一清理
- **保留最新 N 条**：默认保留 10 条（可通过环境变量配置）
- **循环处理**：按页获取部署记录，直至每个项目的部署数量小于等于阈值
- **pnpm 运行**：使用 pnpm 管理依赖与运行脚本

---

## 使用方法

### 1) 准备环境变量

将以下变量配置到本地环境或 CI 的 Secrets：

```shell
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id
# 可选：保留最新的部署数量，默认 10
CF_KEEP_LATEST=10
```

如何获取：

- **API Token**：`Account -> API Tokens -> Create Token`，授予 `Account - Cloudflare Pages - Edit` 权限。
- **Account ID**：登录 Cloudflare 后在右上角或地址栏可见。

### 2) 安装与运行

```shell
pnpm i
pnpm start
```

脚本会遍历账户下所有 Pages 项目并清理旧部署。

### 3) 可选：仅删除单个项目的所有历史部署（保留生产部署）

保留生产部署（canonical deployment），清理其余部署：

```shell
CF_API_TOKEN=... CF_ACCOUNT_ID=... CF_PAGES_PROJECT_NAME=your_project pnpm run delete:project
```

可选：强制删除具有别名的部署（可能影响已别名的预览地址）：

```shell
CF_DELETE_ALIASED_DEPLOYMENTS=true CF_API_TOKEN=... CF_ACCOUNT_ID=... CF_PAGES_PROJECT_NAME=your_project pnpm run delete:project
```

---

## 常见问题

- **API 返回 403**：检查 API Token 权限是否包含 `Cloudflare Pages - Edit`。
- **清理不完全**：Cloudflare API 按页返回（默认每页最多 25 条）。脚本会循环调用，直到每个项目的部署数量小于等于阈值。

---

Cloudflare Pages 官方脚本：[删除部署记录脚本](https://pub-505c82ba1c844ba788b97b1ed9415e75.r2.dev/delete-all-deployments.zip)
