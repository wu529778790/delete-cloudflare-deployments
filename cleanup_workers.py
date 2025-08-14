import os
import requests
from datetime import datetime

# 从环境变量获取配置
API_TOKEN = os.getenv('CF_API_TOKEN')
ACCOUNT_ID = os.getenv('CF_ACCOUNT_ID')

def check_environment():
    """检查环境变量是否已正确设置"""
    required_vars = ['CF_API_TOKEN', 'CF_ACCOUNT_ID']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("\n错误：在 .env 文件中未找到以下环境变量：")
        for var in missing_vars:
            print(f"- {var}")
        print("\n请确保 .env 文件存在且包含所需的环境变量")
        return False
    return True

def get_all_projects():
    """获取账号下所有的项目"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    # 首先尝试获取所有项目，不使用分页
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"获取项目列表失败: {response.text}")
        return None
        
    result = response.json()['result']
    print(f"总共获取到 {len(result)} 个项目")
    return result

def get_deployments(project_name):
    """获取指定项目的所有部署记录"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{project_name}/deployments"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"获取项目 {project_name} 的部署记录失败: {response.text}")
        return None
        
    result = response.json()['result']
    return result

def delete_deployment(project_name, deployment_id):
    """删除指定项目的指定部署记录"""
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{project_name}/deployments/{deployment_id}"
    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.delete(url, headers=headers)
    if response.status_code != 200:
        print(f"删除部署 {deployment_id} 失败: {response.text}")
        return False
    return True

def main():
    if not check_environment():
        return

    projects = get_all_projects()
    if not projects:
        print("没有找到任何项目")
        return

    print(f"找到 {len(projects)} 个项目")
    
    # 遍历每个项目
    for project in projects:
        project_name = project['name']
        print(f"\n处理项目: {project_name}")
        
        while True:
            # 获取该项目的部署记录
            deployments = get_deployments(project_name)
            if not deployments:
                print(f"项目 {project_name} 没有找到部署记录")
                break

            print(f"当前获取到 {len(deployments)} 个部署记录")
            
            # 如果部署记录数量小于等于目标值，退出循环
            if len(deployments) <= 10:
                print(f"项目 {project_name} 当前部署数量为 {len(deployments)}，不需要清理")
                break
                
            # 按创建时间排序
            sorted_deployments = sorted(deployments, key=lambda x: x['created_on'], reverse=True)
            
            # 保留最新的10个部署，删除其余的
            deployments_to_delete = sorted_deployments[10:]
            print(f"本轮需要删除 {len(deployments_to_delete)} 个旧部署")
            
            for deployment in deployments_to_delete:
                deployment_id = deployment['id']
                created_date = datetime.fromisoformat(deployment['created_on'].replace('Z', '+00:00'))
                print(f"正在删除部署 {deployment_id} (创建于 {created_date})")
                if delete_deployment(project_name, deployment_id):
                    print(f"成功删除部署 {deployment_id}")
                else:
                    print(f"删除部署 {deployment_id} 失败")

if __name__ == "__main__":
    main() 