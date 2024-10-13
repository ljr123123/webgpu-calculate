import torch  # 导入 PyTorch
import torch.nn as nn  # 导入神经网络模块
import torch.optim as optim  # 导入优化器模块
import torchvision.transforms as transforms  # 导入数据转换模块
from torchvision import datasets  # 导入数据集模块
from torch.utils.data import DataLoader  # 导入数据加载器
import torch.nn.functional as F  # 导入功能性API

# 定义卷积神经网络模型
class CNN(nn.Module):  # 定义 CNN 类，继承自 nn.Module
    def __init__(self):
        super(CNN, self).__init__()  # 初始化父类
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=1)  # 第一卷积层
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)  # 第二卷积层
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2, padding=0)  # 最大池化层
        self.fc1 = nn.Linear(64 * 7 * 7, 128)  # 第一个全连接层
        self.fc2 = nn.Linear(128, 10)  # 第二个全连接层
        self.dropout = nn.Dropout(p=0.5)  # Dropout层

    def forward(self, x):  # 前向传播
        x = self.pool(F.relu(self.conv1(x)))  # 卷积 + 激活 + 池化
        x = self.pool(F.relu(self.conv2(x)))  # 卷积 + 激活 + 池化
        x = x.view(-1, 64 * 7 * 7)  # 展平操作
        x = F.relu(self.fc1(x))  # 全连接层 + 激活
        x = self.dropout(x)  # Dropout层
        x = self.fc2(x)  # 最后一层全连接
        return x  # 返回输出

# 数据加载和预处理
transform = transforms.Compose([  # 定义数据预处理
    transforms.ToTensor(),  # 将图像转换为 Tensor
    transforms.Normalize((0.1307,), (0.3081,))  # 归一化
])

# 加载训练数据集
train_dataset = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
# 加载测试数据集
test_dataset = datasets.MNIST(root='./data', train=False, download=True, transform=transform)

# 创建训练数据加载器
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
# 创建测试数据加载器
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

# 设置训练参数
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")  # 检测是否有可用的GPU
model = CNN().to(device)  # 实例化模型并移动到设备
criterion = nn.CrossEntropyLoss()  # 定义损失函数为交叉熵
optimizer = optim.Adam(model.parameters(), lr=0.001)  # 定义优化器为Adam

# 训练模型
def train(model, train_loader, criterion, optimizer, epochs=5):  # 定义训练函数
    model.train()  # 设置模型为训练模式
    for epoch in range(epochs):  # 循环训练轮数
        for batch_idx, (data, target) in enumerate(train_loader):  # 遍历训练数据
            data, target = data.to(device), target.to(device)  # 将数据移动到设备

            optimizer.zero_grad()  # 清零梯度
            output = model(data)  # 前向传播得到输出
            loss = criterion(output, target)  # 计算损失
            loss.backward()  # 反向传播计算梯度
            optimizer.step()  # 更新模型参数

            if batch_idx % 100 == 0:  # 每100个批次打印一次信息
                print(f'Train Epoch: {epoch} [{batch_idx * len(data)}/{len(train_loader.dataset)}] Loss: {loss.item():.6f}')

# 测试模型
def test(model, test_loader):  # 定义测试函数
    model.eval()  # 设置模型为评估模式
    test_loss = 0  # 初始化测试损失
    correct = 0  # 初始化正确预测计数
    with torch.no_grad():  # 不需要计算梯度
        for data, target in test_loader:  # 遍历测试数据
            data, target = data.to(device), target.to(device)  # 将数据移动到设备
            output = model(data)  # 前向传播得到输出
            test_loss += criterion(output, target).item()  # 计算并累加损失
            pred = output.argmax(dim=1, keepdim=True)  # 获取预测结果
            correct += pred.eq(target.view_as(pred)).sum().item()  # 统计正确预测数量

    test_loss /= len(test_loader.dataset)  # 计算平均损失
    print(f'\nTest set: Average loss: {test_loss:.4f}, Accuracy: {correct}/{len(test_loader.dataset)} ({100. * correct / len(test_loader.dataset):.0f}%)\n')

# 运行训练和测试
train(model, train_loader, criterion, optimizer, epochs=5)  # 训练模型
test(model, test_loader)  # 测试模型
