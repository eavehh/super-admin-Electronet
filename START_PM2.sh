#!/bin/bash
# Скрипт для запуска Super-admin через PM2

echo "=== Запуск Super-admin через PM2 ==="

# Перейти в директорию проекта
cd ~/super-admin || exit 1

# Проверить зависимости
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Собрать проект
echo "🔨 Сборка проекта..."
npm run build

# Создать директорию для логов
mkdir -p logs

# Проверить что standalone билд существует
if [ ! -f ".next/standalone/server.js" ]; then
    echo "⚠️  Standalone build не найден. Пересобираю проект..."
    npm run build
fi

# Запустить через PM2
echo "🚀 Запуск через PM2..."
pm2 start ecosystem.config.js

echo ""
echo "✅ Super-admin запущен!"
echo ""
echo "📊 Статус:"
pm2 list | grep super-admin

echo ""
echo "📝 Команды:"
echo "  pm2 logs super-admin     - логи"
echo "  pm2 restart super-admin  - перезапуск"
echo "  pm2 stop super-admin     - остановка"
echo ""
echo "🌐 Доступ: http://176.88.248.139:3001"
