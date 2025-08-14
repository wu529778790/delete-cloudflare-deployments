# Cloudflare Pages 部署记录清理工具

解决 Cloudflare Pages 部署记录过多，导致无法创建新部署，无法删除项目的问题。

这是一个用于清理 Cloudflare Pages 项目旧部署记录的自动化工具。该工具会保留每个项目最新的 10 个部署记录，删除更早的部署以节省空间。

## 功能特点

- 自动获取账号下所有的 Cloudflare Pages 项目（一次运行获取最活跃的10个）
- 对每个项目只保留最新的 10 个部署记录
- 自动删除较早的部署记录
- 支持批量处理多个项目
- 循环处理直到清理完所有旧记录
- 支持通过 GitHub Actions 自动运行

---

## 使用方法（推荐 GitHub Actions 自动运行）

### 获取必要信息

首先需要获取以下信息：

- Cloudflare Account ID
- Cloudflare API Token（需要有 Pages 的编辑权限）

#### 获取 API Token

1. 登录 Cloudflare 控制台：<https://dash.cloudflare.com/profile/api-tokens>
2. 点击 "Create Token" 按钮
3. 选择 "Create Custom Token"
4. 设置以下权限：
   - Account - Cloudflare Pages - Edit
   - Zone - DNS - Edit（如果需要）
5. 在 "Account Resources" 中选择你的账号
6. 设置 Token 名称（例如：pages-deployment-cleanup）
7. 点击 "Continue to summary" 然后创建 Token
8. 保存显示的 Token 值（这个值只会显示一次）

**重要提示：** API Token 只会显示一次，请务必立即保存。

#### 获取 Account ID

1. 登录 Cloudflare 控制台
2. 在右侧边栏找到 "Account ID"
3. 或者从浏览器地址栏中复制，格式类似：<https://dash.cloudflare.com/**your-account-id>**

### 设置仓库变量

在 Fork 后的仓库中配置以下变量：

```
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id
```

---

## GitHub Actions 配置

要设置自动运行，需要在 GitHub 仓库中配置以下 Secrets：

1. 打开仓库的 Settings
2. 进入 Secrets and variables → Actions
3. 添加以下 secrets：
   - CF_API_TOKEN
   - CF_ACCOUNT_ID

---

## 常见问题

### 1. API 返回 403 错误

检查 API Token 是否具有正确的权限，确保包含了 Pages 的编辑权限。

### 2. 部署记录未完全清理

由于 API 限制，每次只能获取 25 个记录。脚本会自动循环处理，多运行几次即可。

如果你的部署记录太多，每一次运行可能需要比较长的时间。

---

Cloudflare Pages 官方脚本：[删除部署记录脚本](https://pub-505c82ba1c844ba788b97b1ed9415e75.r2.dev/delete-all-deployments.zip)
