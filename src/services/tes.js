const axios = require('axios');
const fs = require('fs');

const MAX_CONCURRENT_REQUESTS = 15; // 最大并发请求数

(async () => {
    const baseUrl = 'https://node.jx3box.com/api/node/item/search';
    const itemsPerPage = 15; // 每页抓取的条目数
    const allItems = [];
    let totalPages = 0; // 初始化总页数

    // 获取总页数
    const fetchTotalPages = async () => {
        try {
            console.log('正在获取总页数...');
            const response = await axios.get(baseUrl, {
                params: {
                    ids: '',
                    keyword: '',
                    page: 1,
                    per: itemsPerPage,
                    client: 'std'
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
                }
            });

            const totalRecords = response.data?.data?.total || 0; // 获取总条目数
            totalPages = Math.ceil(totalRecords / itemsPerPage); // 计算总页数
            console.log(`总记录数: ${totalRecords}, 总页数: ${totalPages}`);
        } catch (error) {
            console.error(`获取总页数失败: ${error.message}`);
            process.exit(1); // 终止程序
        }
    };

    // 抓取单页数据
    const fetchPageData = async (page) => {
        try {
            console.log(`正在请求: 第 ${page} 页`);
            const response = await axios.get(baseUrl, {
                params: {
                    ids: '',
                    keyword: '',
                    page: page,
                    per: itemsPerPage,
                    client: 'std'
                },
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
                }
            });

            const data = response.data?.data?.data;
            if (!data || !Array.isArray(data)) {
                console.warn(`第 ${page} 页无有效数据`);
                return [];
            }

            const items = data.map(item => ({
                uid: item.UiID,
                name: item.Name,
                iconID: item.IconID
            }));

            console.log(`第 ${page} 页抓取成功，共 ${items.length} 条数据`);
            return items;
        } catch (error) {
            console.error(`请求失败: 第 ${page} 页 -> ${error.message}`);
            return [];
        }
    };

    // 并行抓取数据
    const fetchInBatches = async () => {
        const requestQueue = Array.from({ length: totalPages }, (_, i) => i + 1);
        while (requestQueue.length > 0) {
            const currentBatch = requestQueue.splice(0, MAX_CONCURRENT_REQUESTS);
            const batchResults = await Promise.all(currentBatch.map(page => fetchPageData(page)));
            batchResults.forEach(items => allItems.push(...items));

            // 随机延迟 1-3 秒
            const delay = Math.random() * 2000 + 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    };

    // 主流程
    await fetchTotalPages(); // 动态获取总页数
    await fetchInBatches(); // 抓取所有页面数据

    // 保存到本地文件
    const outputFileName = 'items.json';
    try {
        fs.writeFileSync(outputFileName, JSON.stringify(allItems, null, 2), 'utf8');
        console.log(`抓取结果已成功导出到文件: ${outputFileName}`);
    } catch (writeError) {
        console.error(`写入文件失败: ${writeError.message}`);
    }
})();