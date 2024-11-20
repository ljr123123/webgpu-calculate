def calculate_mean_variance(data):
    # 计算均值
    mean = sum(data) / len(data)
    
    # 计算方差
    variance = sum((x - mean) ** 2 for x in data) / len(data)
    
    return mean, variance

# 示例数据
data = [1, 2, 3]

# 调用函数计算均值和方差
mean, variance = calculate_mean_variance(data)

# 输出结果
print(f"mean: {mean}")
print(f"variance: {variance}")
