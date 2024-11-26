import matplotlib.pyplot as plt
import matplotlib
matplotlib.rcParams['font.sans-serif'] = ['Microsoft YaHei']
# 示例数据
x = [10, 100, 1000, 10000, 20000, 30000, 40000, 50000]  # X轴数据
y1 = [0.01, 0.02, 0.22, 3.97, 12.3, 32, 66, 115.8]  # Y轴数据
y2 = [2.02, 2, 2.02, 2.3, 2.8, 3.3, 3.8, 4.3]

# 绘制折线图
plt.plot(x, y1, label='Pandas', color='blue', marker='o')
plt.plot(x, y2, label='WebGPU', color='red', marker='s')

# 添加标题和标签
plt.title('数据数固定,特征量变化下WebGPU与Pandas标准化所需时间比较')
plt.xlabel('特征量')
plt.ylabel('标准化所需时间')

# 显示图例
plt.legend()

# 显示图形
plt.show()
