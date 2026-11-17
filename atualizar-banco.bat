@echo off
chcp 65001 >nul
title LPZ Training - atualizar banco de dados
cd /d "%~dp0"
rem Gera a migration a partir do src/db/schema.ts (se houver mudanca) e aplica
rem no banco local. Rode com o Docker ligado (o iniciar-site.bat liga).
set DB_PORT=5433
set DATABASE_URL=postgres://lpz:lpz_dev_local@localhost:5433/lpz_training

echo [1/2] Gerando migration a partir do schema...
call npx drizzle-kit generate --name fornecedores_e_audio
if errorlevel 1 (
  echo ERRO ao gerar a migration. Mande um print desta tela para o Claude.
  pause
  exit /b 1
)
echo [2/2] Aplicando no banco local...
call npm run db:migrate
if errorlevel 1 (
  echo ERRO ao aplicar a migration. Mande um print desta tela para o Claude.
  pause
  exit /b 1
)
echo.
echo Banco atualizado. Pode fechar esta janela.
pause
