#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'assets', 'js', 'home-data.js');
const targetPath = path.join(root, 'data', 'site-map.json');

const source = fs.readFileSync(sourcePath, 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context, { filename: sourcePath });

const siteMap = context.window.siteMap;
if (!Array.isArray(siteMap) || siteMap.length === 0) {
  throw new Error('home-data.js did not expose a non-empty window.siteMap array');
}

for (const topic of siteMap) {
  for (const category of topic.children || []) {
    category.articles = (category.articles || []).map((article) => ({
      navTitle: article.title,
      navDesc: article.desc,
      href: article.href,
      tags: (article.tags || []).map((tag) => tag === '80551' ? '8051' : tag)
    }));
  }
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, `${JSON.stringify(siteMap, null, 2)}\n`, 'utf8');
console.log(`Migrated: ${path.relative(root, targetPath)}`);
