import csv
import random
import time

# 设置文件名和数据规模
filename = 'large_test_data.csv'  # 生成的 CSV 文件名
num_rows = 100  # 行数 (1万行)
num_cols = 400    # 列数 (100列)

# 生成随机数字并写入 CSV 文件
def generate_large_csv(filename, num_rows, num_cols):
    start_time = time.time()
    
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        
        # 写入数据行
        for _ in range(num_rows):
            row = [random.randint(1, 10000) for _ in range(num_cols)]  # 每个单元格都是 1 到 10000 之间的随机整数
            writer.writerow(row)

    end_time = time.time()
    print(f"CSV 文件生成完毕，耗时 {end_time - start_time:.2f} 秒.")

# 运行程序
generate_large_csv(filename, num_rows, num_cols)
