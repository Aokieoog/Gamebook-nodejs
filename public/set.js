const fs = require('fs');
const path = require('path');

// 输入和输出文件路径
const inputFilePath = path.join(__dirname, 'output.json'); // 替换为你的文件名
const outputFilePath = path.join(__dirname, 'cle.json');

// 读取 JSON 文件
fs.readFile(inputFilePath, 'utf-8', (err, data) => {
  if (err) {
    console.error('读取文件失败:', err);
    return;
  }

  try {
    // 解析 JSON 数据
    const jsonData = JSON.parse(data);

    // 过滤掉 name 为 null 的对象
    const filteredData = jsonData.filter(item => item.name !== null);

    // 写入到新的文件
    fs.writeFile(outputFilePath, JSON.stringify(filteredData, null, 2), (err) => {
      if (err) {
        console.error('写入文件失败:', err);
        return;
      }
      console.log('清理完成，结果已保存到:', outputFilePath);
    });
  } catch (parseError) {
    console.error('JSON 解析失败:', parseError);
  }
});