@echo off
chcp 65001 >nul
title LPZ Training - criar organizador
cd /d "%~dp0"
rem Cria (ou renova o convite de) um usuario ORGANIZADOR = acesso total.
rem O convite vai para a caixa de e-mails de teste (Mailpit), que abre sozinha.
rem Rode com o site ligado (iniciar-site.bat aberto).
set DATABASE_URL=postgres://lpz:lpz_dev_local@localhost:5433/lpz_training
set APP_URL=http://localhost:3005
set SMTP_PORT=1026

call npm run admin:convidar -- --nome "Admin" --email admin@lpz.local --papel organizador
if errorlevel 1 (
  echo.
  echo ERRO ao criar o organizador. Mande um print desta tela para o Claude.
  pause
  exit /b 1
)
echo.
echo Abrindo a caixa de e-mails de teste. Clique no e-mail de convite e no link para definir sua senha.
start "" http://localhost:3005/emails
pause
