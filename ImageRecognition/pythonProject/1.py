from sklearn.datasets import fetch_openml

mnist = fetch_openml('mnist_784', version=1)

x, y = mnist['data'], mnist['target']

print(x)
print(y)