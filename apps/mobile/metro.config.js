// Metro 配置:让 Metro 能解析 monorepo 内的 workspace 包(@dreamtwin/*)。
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 监听 monorepo 根,以便 packages/* 改动触发热更。
config.watchFolders = Array.from(new Set([...(config.watchFolders ?? []), workspaceRoot]));

// 让 Metro 在 monorepo 根的 node_modules 里也能找到依赖。
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = false;

module.exports = config;
