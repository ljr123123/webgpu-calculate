#include<cstdlib>

enum BufferUsage
{
    COPY_SRC = 1 << 0,
    STORAGE = 1 << 1
};

template <class T>
class Buffer
{
public:
    int size;

public:
    int usage;
    T *storage;
    Buffer(int size, int usage)
    {
        this->size = size;
        this->usage = usage;
        this->storage = new T[size / 4];
    };
};

float a[3] = {10.9, 11.3, 11.2};

const Buffer<int> buffer = Buffer<int>(1024, COPY_SRC | STORAGE);

void* buffer = malloc(100);