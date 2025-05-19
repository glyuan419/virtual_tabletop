# 开发手册

### 推送到 main 分支

1. 确保当前工作区是干净的
``` bash
git status
```
如果有未提交的内容，应该提交或暂存

2. 把 dev 分支的最新内容合并到 main 分支
``` bash
git checkout main
git merge dev
```

3. 运行 release.py 脚本发布版本
``` bash
python tools/release.py
```
该脚本会：
- 检查当前分支是否为主分支
- 检查工作区是否干净
- 检查是否已存在相同版本号的 tag
- 解析 Git commit message，生成一段新的 CHANGELOG 内容
- 预览 CHANGELOG 的新增，等待确认
- 更新 CHANGELOG.md 文件
- 更新 VERSION 文件
- 根据版本号打 tag
- 提交 git 并推送到 Github

4. 将 main 分支的变动同步回 dev 分支
``` bash
git checkout dev
git merge main
git push origin dev
```

### 版本号

版本号格式基于 SemVer 标准，
``` php
v<主版本号>.<次版本号>.<修订号>[-预发布标签.编号]
```

- 主版本号 (Major)：有重大变化、不兼容修改
- 次版本号 (Minor)：新功能添加，向下兼容
- 修订号 (Patch)：修复 bug、优化性能等
- 预发布标签：
    - alpha：不稳定的功能开发阶段
    - beta：测试阶段