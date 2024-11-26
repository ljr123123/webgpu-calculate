1. maxBindGroups -- 最大绑定组数
一个pipeline可以绑定4个绑定组

2. maxBindingsPerBindGroup -- 每个绑定组最大绑定数
每个绑定组内最多可以绑定 1000 个资源（如纹理、缓冲区等）

3. maxBufferSize -- 最大缓冲区大小
表示单个缓冲区的最大大小为 256 MB

4. maxComputeInvocationsPerWorkgroup: 256 -- 每个工作组的最大计算调用次数
workgroup_size的最大值

5. maxComputeWorkgroupSizeX
同上
6. maxComputeWorkgroupSizeY
同上
7. maxComputeWorkgroupSizeZ
同上

8. maxComputeWorkgroupStorageSize
计算工作组的最大存储空间大小 每个WGSL的module中临时变量不能超过这个限制

9. maxComputeWorkgroupsPerDimension 
X * Y * Z <= this

10. maxDynamicStorageBuffersPerPipelineLayout
就是binding的最大值

11. maxUniformBufferBindingSize: 65536 -- Uniform
最大统一缓冲区绑定大小：65536 字节（64 KB）
单个统一缓冲区的最大绑定大小为 64 KB。

12. 