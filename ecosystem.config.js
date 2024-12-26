module.exports = {
  apps: [
    {
      name: "nodejs-test", // 应用名称
      script: "./app.js", // 主脚本路径
      // cwd: "/www/wwwroot/panel", // 工作目录，确保路径正确
      instances: 1, // 启动实例数，改为 "max" 可根据 CPU 核心数自动分配
      exec_mode: "fork", // 启动模式：'fork' 或 'cluster'
      watch: false, // 是否监控文件变化自动重启
      max_memory_restart: "200M", // 内存占用超过 200M 时重启
      // env: {
      //   NODE_ENV: "production", // 环境变量，生产环境
      // },
      // env_development: {
      //   NODE_ENV: "development", // 环境变量，开发环境
      // },
    },
  ],
};