"use strict";

const fetch = require("node-fetch");

const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_KEEP_LATEST = parseInt(process.env.CF_KEEP_LATEST || "10", 10);

if (!CF_API_TOKEN) {
  console.error("错误：请设置环境变量 CF_API_TOKEN");
  process.exit(1);
}
if (!CF_ACCOUNT_ID) {
  console.error("错误：请设置环境变量 CF_ACCOUNT_ID");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${CF_API_TOKEN}`,
  "Content-Type": "application/json",
};

async function httpJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers });
  let json;
  try {
    json = await res.json();
  } catch (_) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`);
  }
  if (!json || json.success === false) {
    const message =
      json && json.errors && json.errors[0] && json.errors[0].message;
    throw new Error(message || `请求失败：${res.status} ${res.statusText}`);
  }
  return json;
}

async function listAllProjects() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects`;
  const data = await httpJson(url, { method: "GET" });
  return data.result || [];
}

async function listDeployments(projectName) {
  // per_page=25 是 Cloudflare API 的上限之一，足够一次性处理一批
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments?per_page=25`;
  const data = await httpJson(url, { method: "GET" });
  return data.result || [];
}

async function deleteDeployment(projectName, deploymentId, force = false) {
  const suffix = force ? "?force=true" : "";
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${projectName}/deployments/${deploymentId}${suffix}`;
  await httpJson(url, { method: "DELETE" });
}

function sortByCreatedOnDesc(deployments) {
  return deployments
    .slice()
    .sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupProject(projectName) {
  console.log(`\n处理项目: ${projectName}`);

  while (true) {
    let deployments;
    try {
      deployments = await listDeployments(projectName);
    } catch (err) {
      console.warn(`获取项目 ${projectName} 的部署记录失败：${err.message}`);
      break;
    }

    const count = deployments.length;
    if (count === 0) {
      console.log(`项目 ${projectName} 没有找到部署记录`);
      break;
    }

    console.log(`当前获取到 ${count} 个部署记录`);

    if (count <= CF_KEEP_LATEST) {
      console.log(`项目 ${projectName} 当前部署数量为 ${count}，不需要清理`);
      break;
    }

    const sorted = sortByCreatedOnDesc(deployments);
    const toDelete = sorted.slice(CF_KEEP_LATEST);
    console.log(
      `本轮需要删除 ${toDelete.length} 个旧部署（保留最新的 ${CF_KEEP_LATEST} 个）`
    );

    for (const deployment of toDelete) {
      const deploymentId = deployment.id;
      const createdOn = deployment.created_on;
      const createdDate = new Date(createdOn);
      process.stdout.write(
        `正在删除部署 ${deploymentId} (创建于 ${createdDate.toISOString()}) ... `
      );
      try {
        await deleteDeployment(projectName, deploymentId);
        console.log("成功");
      } catch (err) {
        console.log(`失败：${err.message}`);
      }
      await sleep(500);
    }
  }
}

async function main() {
  let projects;
  try {
    projects = await listAllProjects();
  } catch (err) {
    console.error(`获取项目列表失败：${err.message}`);
    process.exit(1);
  }

  console.log(`总共获取到 ${projects.length} 个项目`);
  if (projects.length === 0) return;

  for (const project of projects) {
    const name = project.name;
    await cleanupProject(name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
