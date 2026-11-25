@echo off
chcp 65001 >nul
title LPZ Training - site local
cd /d "%~dp0"

echo.
echo ==========================================
echo   LPZ Training - ligando o site no seu PC
echo ==========================================
echo.

rem --- 1. Arquivo de configuracao .env (so na primeira vez) ---
if not exist ".env" (
  echo [1/6] Criando o arquivo .env a partir do .env.example...
  copy ".env.example" ".env" >nul
  node -e "const fs=require('fs');const c=require('crypto');let t=fs.readFileSync('.env','utf8');t=t.replace(/^BETTER_AUTH_SECRET=.*$/m,'BETTER_AUTH_SECRET='+c.randomBytes(32).toString('base64url'));fs.writeFileSync('.env',t);"
) else (
  echo [1/6] Arquivo .env ja existe.
)

rem --- Porta do banco no PC: 5433, porque a 5432 costuma estar ocupada por
rem --- outro PostgreSQL. Variaveis definidas aqui valem mais que as do .env.
set DB_PORT=5433
set DATABASE_URL=postgres://lpz:lpz_dev_local@localhost:5433/lpz_training
rem --- Porta do site: 3005 (3000-3002 ja sao usadas por outros projetos no PC).
set PORTA_SITE=3005
set APP_URL=http://localhost:3005
rem --- Caixa de e-mails de teste (Mailpit) em portas proprias, pelo mesmo motivo.
set SMTP_PORT=1026
set MAILPIT_UI_PORT=8026
set MAILPIT_URL=http://localhost:8026

rem --- 2. Docker Desktop ligado ---
docker info >nul 2>&1
if not errorlevel 1 goto dockerOk
echo [2/6] Abrindo o Docker Desktop. Pode levar 1 ou 2 minutos...
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
:esperaDocker
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if errorlevel 1 goto esperaDocker
:dockerOk
echo [2/6] Docker ligado.

rem --- 3. Banco de dados e caixa de e-mails de teste ---
echo [3/6] Ligando o banco de dados e o Mailpit...
docker compose up -d db mailpit
if errorlevel 1 (
  echo.
  echo ERRO ao ligar o banco. Mande um print desta tela para o Claude.
  pause
  exit /b 1
)
:esperaBanco
timeout /t 2 /nobreak >nul
docker compose exec -T db pg_isready -U lpz -d lpz_training >nul 2>&1
if errorlevel 1 goto esperaBanco
echo [3/6] Banco pronto.

rem --- 4. Pecas do site (so na primeira vez, demora alguns minutos) ---
if not exist "node_modules" (
  echo [4/6] Instalando as pecas do site. Na primeira vez demora alguns minutos...
  call npm install
  if errorlevel 1 (
    echo ERRO no npm install. Mande um print desta tela para o Claude.
    pause
    exit /b 1
  )
) else (
  echo [4/6] Pecas do site ja instaladas.
)

rem --- 5. Estrutura do banco e dados de exemplo ---
echo [5/6] Preparando o banco de dados...
call npm run db:migrate
if errorlevel 1 (
  echo ERRO ao preparar o banco. Mande um print desta tela para o Claude.
  pause
  exit /b 1
)
if not exist ".dados-exemplo-ok" (
  call npm run db:seed && echo ok> ".dados-exemplo-ok"
)

rem --- 6. Liga o site e abre o navegador ---
echo [6/6] Ligando o site. O navegador abre sozinho em alguns segundos.
echo.
echo   Site:              http://localhost:%PORTA_SITE%
echo   E-mails de teste:  http://localhost:%PORTA_SITE%/emails
echo.
echo   Para DESLIGAR o site, feche esta janela.
echo.
start "" cmd /c "timeout /t 20 /nobreak >nul & start http://localhost:%PORTA_SITE%"
call npm run dev -- -p %PORTA_SITE%
pause
