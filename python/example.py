import torch                   # 导入 PyTorch 库
import torch.nn as nn          # 导入神经网络模块
import torch.optim as optim     # 导入优化器模块
from torchvision import datasets, transforms  # 导入数据集和转换工具
from torch.utils.data import DataLoader  # 导入数据加载器

# 定义超参数
batch_size = 64               # 每个批次的样本数量
learning_rate = 0.001         # 学习率
num_epochs = 5                # 训练轮数

# 定义数据转换
transform = transforms.Compose([
    transforms.ToTensor(),     # 将图像转换为 Tensor
    transforms.Normalize((0.5,), (0.5,))  # 归一化处理
])

# 下载并加载 MNIST 数据集
train_dataset = datasets.MNIST(root='./data', train=True, transform=transform, download=True)  # 训练集
train_loader = DataLoader(dataset=train_dataset, batch_size=batch_size, shuffle=True)  # 训练数据加载器

# 定义神经网络模型
class SimpleNN(nn.Module):     # 创建一个简单的神经网络类
    def __init__(self):
        super(SimpleNN, self).__init__()  # 调用父类构造函数
        self.fc1 = nn.Linear(28 * 28, 128)  # 输入层到隐藏层的线性变换
        self.fc2 = nn.Linear(128, 10)        # 隐藏层到输出层的线性变换

    def forward(self, x):
        x = x.view(-1, 28 * 28)  # 将输入拉平成一维
        x = torch.relu(self.fc1(x))  # 使用 ReLU 激活函数
        x = self.fc2(x)            # 输出层
        return x

# 初始化模型、损失函数和优化器
model = SimpleNN()             # 实例化模型
criterion = nn.CrossEntropyLoss()  # 定义损失函数
optimizer = optim.Adam(model.parameters(), lr=learning_rate)  # 定义优化器

# 训练模型
for epoch in range(num_epochs):   # 迭代每一轮
    for images, labels in train_loader:  # 遍历每个批次的数据
        optimizer.zero_grad()          # 清零梯度
        outputs = model(images)        # 前向传播
        loss = criterion(outputs, labels)  # 计算损失
        loss.backward()                # 反向传播
        optimizer.step()               # 更新权重

    print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}')  # 输出当前轮的损失值

# 测试模型的代码可以在这里添加
