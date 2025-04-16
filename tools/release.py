#!/usr/bin/python3
# -*- coding: utf-8 -*-

import subprocess
import sys
import os
import re
from datetime import datetime
from pathlib import Path

# === 可配置项 ===
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent  # 设置项目根目录
VERSION_FILE = PROJECT_ROOT / "VERSION"
CHANGELOG_FILE = PROJECT_ROOT / "CHANGELOG.md"
DEFAULT_BRANCH = "dev"
COMMIT_TYPES = {
    "feat":     ("✨", "Features"),
    "fix":      ("🐛", "Fixes"),
    "docs":     ("📚", "Documentation"),
    "style":    ("💄", "Styles"),
    "refactor": ("🔨", "Code Refactoring"),
    "perf":     ("⚡", "Performance Improvements"),
    "test":     ("✅", "Tests"),
    "build":    ("🏗️", "Build System"),
    "ci":       ("🤖", "CI/CD"),
    "chore":    ("🔧", "Chores"),
    "revert":   ("⏪", "Reverts"),
}
HEADER = "# CHANGELOG"

# === 工具函数 ===
def run_git(cmd):
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        print(f"Git 命令失败：{' '.join(cmd)}\n{result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def get_current_branch():
    return run_git(["git", "rev-parse", "--abbrev-ref", "HEAD"])

def is_working_directory_clean():
    return run_git(["git", "status", "--porcelain"]) == ""

def tag_exists(tag):
    tags = run_git(["git", "tag"]).splitlines()
    return tag in tags

def get_latest_tag():
    tags = run_git(["git", "tag", "--sort=-creatordate"]).splitlines()
    return tags[0] if tags else None

def get_commits_since(tag=None):
    if tag:
        log_range = f"{tag}..HEAD"
    else:
        log_range = "HEAD"
    return run_git(["git", "log", "--pretty=format:%s", log_range]).splitlines()

def parse_commit(msg, first_release=False):
    match = re.match(r"(\w+)(\([^)]+\))?: (.+)", msg)
    if match:
        return match.group(1), match.group(3)
    elif first_release:
        # 尝试兼容旧格式，如“修复：修复xxx”、“功能：添加xxx”
        zh_match = re.match(r"(修复|功能|文档|重构|样式|性能|测试|构建|配置|回滚)：(.+)", msg)
        zh_map = {
            "功能": "feat",
            "修复": "fix",
            "文档": "docs",
            "样式": "style",
            "重构": "refactor",
            "性能": "perf",
            "测试": "test",
            "构建": "build",
            "配置": "chore",
            "回滚": "revert",
        }
        if zh_match:
            zh_type = zh_map.get(zh_match.group(1))
            return zh_type, zh_match.group(2)
    return None, None

def read_version():
    if not os.path.exists(VERSION_FILE):
        print("未找到 VERSION 文件")
        sys.exit(1)
    return open(VERSION_FILE).read().strip()

def preview_changelog(version, commits, first_release=False):
    today = datetime.now().strftime("%Y-%m-%d")
    print("\n📝 即将写入 CHANGELOG 的内容如下：\n")
    print(f"## {version} - {today}\n")

    changelog_preview = []

    for ctype, (emoji, title) in COMMIT_TYPES.items():
        lines = [parse_commit(msg, first_release=first_release)[1] for msg in commits
                 if parse_commit(msg, first_release=first_release)[0] == ctype]
        if lines:
            section = f"### {emoji} {title}\n"
            section += "\n".join(f"- {line}" for line in lines)
            changelog_preview.append(section)

    if changelog_preview:
        print("\n\n".join(changelog_preview))
    else:
        print("(本次没有可记录的变更项)\n")

def update_changelog(version, commits, first_release=False):
    today = datetime.now().strftime("%Y-%m-%d")
    new_entry = f"## {version} - {today}\n\n"
    for ctype, (emoji, title) in COMMIT_TYPES.items():
        lines = [parse_commit(msg, first_release=first_release)[1] for msg in commits
                 if parse_commit(msg, first_release=first_release)[0] == ctype]
        if lines:
            new_entry += f"### {emoji} {title}\n"
            new_entry += "\n".join(f"- {line}" for line in lines)
            new_entry += "\n\n"

    if not os.path.exists(CHANGELOG_FILE):
        with open(CHANGELOG_FILE, "w", encoding="utf-8") as f:
            f.write(f"{HEADER}\n\n")

    with open(CHANGELOG_FILE, "r+", encoding="utf-8") as f:
        existing = f.read()
        f.seek(0, 0)
        f.write("\n".join(new_entry) + "\n" + existing)

def main():
    if len(sys.argv) > 1:
        version = sys.argv[1]
    else:
        version = input("请输入版本号: ").strip()

    # 检查分支
    current_branch = get_current_branch()
    if current_branch != DEFAULT_BRANCH:
        print(f"当前分支为 {current_branch}，不是主分支 {DEFAULT_BRANCH}，终止操作。")
        sys.exit(1)

    # 检查工作区
    if not is_working_directory_clean():
        print("工作区非空，请先提交或清理改动。")
        sys.exit(1)

    # 检查 tag 是否已存在
    if tag_exists(version):
        print(f"版本号 {version} 的 tag 已存在。")
        sys.exit(1)

    # 获取 commit 信息
    last_tag = get_latest_tag()
    commits = get_commits_since(last_tag)
    first_release = last_tag is None

    if not commits:
        print("无可用提交，终止。")
        sys.exit(1)
    
    # 预览 changelog 修改内容
    preview_changelog(version, commits, first_release=first_release)
    
    # 用户确认
    confirm = input("是否继续发布？(Y/n): ").strip().lower()
    if confirm not in ["", "y", "yes"]:
        print("❌ 已取消发布。")
        sys.exit(0)

    # 更新 CHANGELOG
    update_changelog(version, commits, first_release=first_release)

    # 写入版本号文件
    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        f.write(version)

    # Git 操作
    # run_git(["git", "add", VERSION_FILE, CHANGELOG_FILE])
    # run_git(["git", "commit", "-m", f"chore(release): {version}"])
    # run_git(["git", "tag", version])
    # run_git(["git", "push"])
    # run_git(["git", "push", "--tags"])

    print(f"✅ 发布完成：{version}")

if __name__ == "__main__":
    main()
