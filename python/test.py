import pandas as pd
import numpy as np
import time
from sklearn.preprocessing import StandardScaler

# 读取之前生成的 CSV 文件
filename = 'large_test_data.csv'

# 使用 Min-Max 归一化方法对数据进行归一化
# 公式：normalized_value = (value - min) / (max - min)
start_time = time.time()
df = pd.read_csv(filename, header=None)
scaler = StandardScaler();
df[df.columns] = scaler.fit_transform(df[df.columns]);
end_time = time.time()  # 获取结束时间

elapsed_time = end_time - start_time
print(f"Elapsed time: {elapsed_time} seconds")