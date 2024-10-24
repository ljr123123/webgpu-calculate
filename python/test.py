import matplotlib.pyplot as plt

# 读取数据
means = []
stds = []

with open('python/result.txt', 'r') as file:
    for line in file:
        parts = line.split(', ')
        if len(parts) == 3:  # 确保每行都有3个部分
            mean = float(parts[1].split(': ')[1])  # 提取均值
            std = float(parts[2].split(': ')[1])  # 提取标准差
            means.append(mean)
            stds.append(std)

# 创建折线图
plt.figure(figsize=(12, 6))

# 绘制均值
plt.plot(means, label='Mean', marker='o')
# 绘制标准差
plt.plot(stds, label='Std Dev', marker='x')

# 添加标题和标签
plt.title('Mean and Standard Deviation Over Indices')
plt.xlabel('Index')
plt.ylabel('Value')

# 设置x轴的刻度，每1000个索引显示一个标签
xticks = range(0, len(means), 1000)  # 每1000个索引
plt.xticks(xticks)

# 添加网格和图例
plt.legend()
plt.grid()

# 显示图形
plt.show()
