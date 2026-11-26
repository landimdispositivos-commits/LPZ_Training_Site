---
projeto: LPZ Training — Site
assunto: Lista de testes (roteiro para conferir o site antes de publicar)
data: 2026-11-24
status: em andamento
relacionado: "[[LPZ Training - Site]]"
---

# Lista de testes — LPZ Training

Marque `[x]` conforme for testando. Site local: http://localhost:3005 ·
e-mails de teste: http://localhost:8026/emails (Mailpit).

Legenda: ✅ já testado pelo Claude · 🔑 precisa do login da organização.

## 1. Navegação e visual
- [ ] Página inicial mostra só a apresentação; Cronograma, Professores, DJs, Ingressos e Galeria abrem como subpáginas
- [ ] Menu no celular (botão ☰) abre e fecha; o submenu do nome fecha ao clicar fora
- [ ] Todas as páginas públicas com o fundo da página de Ingressos
- [ ] Rodapé: Política de Privacidade, Fale conosco e Área da organização

## 2. Idiomas (bandeiras Brasil, EUA e Espanha)
- [x] Páginas públicas em inglês e espanhol sem texto em português ✅
- [ ] Trocar o idioma em cada página e conferir que a escolha fica guardada
- [ ] Cadastro, login, ficha e esqueci a senha em en/es
- [ ] E-mail de compra no idioma em que a pessoa comprou (pt, en, es)

## 3. Cadastro e conta do congressista
- [ ] Cadastro com e-mail e senha → e-mail de confirmação chega no Mailpit
- [ ] Entrar com o Google (depende das credenciais do Google no .env)
- [ ] Ficha completa obrigatória no primeiro acesso; erros aparecem nos campos certos
- [ ] Esqueci minha senha → e-mail → nova senha
- [x] Apelido ("Como prefere ser chamado(a)?") aparece no topo e na saudação ✅
- [ ] Menu do nome: "Minha área e ingressos" e "Meu cadastro" (sem "Comprar ingresso")
- [ ] "Meu cadastro": editar dados depois da compra e salvar
- [ ] 🔑 Auditoria mostra cada alteração com antes → depois (CPF, celular, nascimento e endereço mascarados)

## 4. Ingressos e sacola
- [x] Valores: Full pass 349,99 · Pacote de bailes 199,99 · Baile avulso 69,99 · Jack and Jill 69,99 · Paparazzi vídeo/fotos 49,99 ✅
- [ ] Camiseta R$ 59,99, caixa "Novidade em breve" e Massagem Pri / Massagem Jéssica ("valor em breve")
- [x] Aviso de intransferível + reembolso em 7 dias (CDC art. 49) na página e no e-mail ✅
- [ ] Visitante clica numa caixinha → login/cadastro → volta e segue para o pagamento
- [x] Adicionar à sacola (2 itens) → ícone com a quantidade no topo → página da sacola ✅
- [ ] Remover item da sacola (a vaga volta para o lote)
- [x] "Pagar tudo" → um único pagamento → os dois itens pagos ✅
- [ ] "Comprar só este agora" (um item) continua funcionando
- [ ] Reserva vence em 30 minutos e a vaga volta ao lote
- [ ] Pagamento recusado / desistir → pedidos cancelados

### 4.1 Massagens (24/11)
- [ ] Massagem — Pri Pastel e Massagem — Jéssica mostram 15 min R$ 29,99 · 30 min R$ 49,99 · 1 hora R$ 79,99
- [ ] Escolher a duração, adicionar à sacola e pagar

### 4.2 Cancelar compra (24/11)
- [ ] Minha área: botão "Cancelar compra" aparece só em itens pagos, dentro de 7 dias e ainda não usados no evento
- [ ] Tela de confirmação exige marcar "Entendi" antes de cancelar
- [ ] Cancelar um item de dois (ex.: Baile avulso, mantendo o Full pass): e-mail diz o que foi cancelado e o que continua válido
- [ ] O QR do item cancelado deixa de valer; a vaga volta ao lote
- [ ] 🔑 Financeiro → "Estornos aguardando aprovação" → Estornar → e-mail de estorno ao cliente; status "Reembolsado"
- [ ] 🔑 Auditoria: "Compra cancelada pelo cliente" e "Estorno aprovado"

## 5. Pagamento (modo de teste e Mercado Pago)
- [ ] Tela de teste: Pix, crédito em até 12x, débito — forma de pagamento salva na compra
- [ ] Credenciais de TESTE do Mercado Pago no .env → checkout real de sandbox
- [ ] Webhook do Mercado Pago (precisa do site publicado com https)

## 6. E-mails
- [x] Compra de um item: e-mail completo com QR, cronograma, professores, DJs ✅
- [x] Compra pela sacola: um único e-mail com todos os produtos ✅
- [ ] Conferir se cada QR do e-mail da sacola abre a página certa
- [ ] 🔑 Financeiro → reenviar e-mails a todos (um por compra)
- [ ] E-mail de verdade (Brevo + domínio) — só em produção
- [ ] WhatsApp para o cliente (compra, cancelamento, cadastro) — CONGELADO por decisão do Wilson (24/11)

## 7. QR code, check-in e presença
- [x] QR na visão do dono (só a compra dele) ✅
- [ ] QR na visão de quem não está logado (nenhum dado pessoal)
- [ ] 🔑 QR na visão da organização: todos os dados e compras da pessoa
- [ ] 🔑 Full pass / Pacote de bailes: registrar entrada na sexta, no sábado e no domingo
- [ ] 🔑 Tentar registrar o mesmo dia duas vezes → "JÁ REGISTRADO NESTE DIA"
- [ ] 🔑 Baile avulso: uma entrada só
- [ ] 🔑 Paparazzi, Jack and Jill, camiseta e massagens: marcar como realizado/retirado
- [ ] 🔑 Tela Check-in: ler QR pela câmera do celular, buscar por código, nome ou e-mail
- [ ] 🔑 Usuários: coluna/detalhe "Compareceu" e exportação Excel
- [ ] Minha área do cliente mostra a presença registrada

## 8. Área da organização 🔑
- [ ] Login com duas etapas (app autenticador)
- [ ] Usuários: filtros, colunas "Comprou" com todos os produtos (inclui camiseta e massagens), detalhe, Excel
- [ ] Editar cadastro de um usuário → aparece na Auditoria com antes → depois
- [ ] Excluir usuário (pede para digitar EXCLUIR)
- [ ] Permissões (perfis), Acesso total
- [ ] Financeiro: lotes, valores, relatório
- [ ] Canetinha: editar bios de professores e DJs, contatos do Fale conosco
- [ ] Menus DJ, MC e Jack and Jill em ordem alfabética

## 8.1 Perfis e sessão (24/11)
- [ ] 🔑 Permissões: marcar dois ou mais perfis para a mesma pessoa (ex.: Portaria + Mídias) e salvar
- [ ] 🔑 Pessoa com Portaria + Mídias vê Check-in, Fotos e Áudio e vídeo (e não vê Financeiro)
- [ ] 🔑 Perfil Mídias não vê dados pessoais na página do QR
- [ ] Login único: entrar no celular e depois no computador → o celular sai da conta
- [ ] E-mail "Seus dados foram alterados" ao editar o cadastro (pelo cliente e pela organização)

## 8.2 Busca e reporte (24/11)
- [ ] Lupa no topo: buscar "massagem", "reembolso", "cronograma", nome de professor/DJ → resultados com link
- [ ] Botão de reportar problema (canto inferior direito) → e-mail para lpztraining@gmail.com (Mailpit) com print e log
- [ ] Reporte no Safari/iPhone: chega sem print (limitação do navegador) mas com o log

## 8.3 Profissionais (24/11)
- [ ] 🔑 Canetinha do professor/DJ: enviar foto (JPG/PNG/WebP até 8 MB) e remover foto
- [ ] Caixas de Professores e DJs mostram só foto, nome e "Bio"; a bio aparece ao clicar

## 8.4 Galeria, cronograma e "ver como" (24/11)
- [ ] 🔑 Galeria → Fotos / Vídeos: canetinha "Editar link do Google Drive", colar o link da pasta e salvar
- [ ] Visitante vê o botão "Ver todas as fotos/vídeos no Google Drive" e abre a pasta
- [ ] 🔑 Cronograma → "Editar cronograma" → "+ Adicionar aula" em cada dia (horário, aula, professor da galeria, local)
- [ ] Aulas ficam em ordem automática pelo horário; editar e remover (com confirmação)
- [ ] Nome do professor no cronograma leva para a bio
- [ ] 🔑 Usuários → detalhe → "Ver o site como esta pessoa" → faixa verde no topo → "Voltar para o meu admin" sem novo login
- [ ] 🔑 No modo "ver como", comprar/cancelar/editar cadastro ficam bloqueados
- [ ] 🔑 Auditoria registra início e fim do "ver como"

## 8.5 Editar Professores, DJs e Ingressos (24/11)
- [ ] 🔑 Professores e DJs: botão "Editar" liga/desliga o modo edição; setinhas ◀ ▶ e canetinha só aparecem nele
- [ ] 🔑 "+ Adicionar professor/DJ" (nome, bio pt/en, Instagram, foto) → novo perfil aparece no fim da grade
- [ ] 🔑 Na bio, em modo edição: "Remover este perfil" só funciona com a caixinha de confirmação marcada
- [ ] 🔑 Ingressos: botão "Editar ingressos"; setinhas só no modo edição
- [ ] 🔑 "+ Adicionar pacote" (nome pt/en/es, entrada com QR ou serviço, opções, primeiro lote, preço, vagas) → caixa nova na grade
- [ ] 🔑 Pacote novo aparece no Financeiro (lotes), em Usuários (coluna Comprou, detalhe, Excel), na busca e no check-in
- [ ] 🔑 Comprar o pacote novo: e-mail de confirmação com o nome certo; QR só se for "entrada"
- [ ] 🔑 "Editar pacote": mudar nomes, opções e desativar → some da loja, mas continua nos relatórios; reativar volta

## 8.6 Ajustes de 25/11
- [ ] Celular: topo mostra "LPZ", lupa, primeiro nome do usuário e menu, sem rolar para o lado
- [ ] Menu mostra "Loja" (no lugar de Ingressos) e "Serviços" ao lado de Galeria
- [ ] 🔑 Serviços: Editar → adicionar, editar, remover (com confirmação) e ordenar caixas
- [ ] 🔑 Botão "Cancelar" nos formulários de edição (cronograma, professores, DJs, loja, serviços, link do Drive)
- [ ] 🔑 Setinhas ◀ ▶ (Loja, Professores, DJs, Serviços): a tela não sobe nem desce
- [ ] 🔑 Galeria → Paparazzi: "Editar link do Drive — vídeo/fotos" abre a caixa para colar o link; o link só aparece para quem comprou
- [ ] Compra com mais de 7 dias: some o "Cancelar compra" e aparece o aviso de prazo encerrado
- [ ] Botão de reportar problema dourado no canto inferior direito em todas as telas
- [ ] Login (congressista, profissional, organização) cai na página principal; "Comprar" sem login volta para a compra
- [ ] Data de nascimento: Minha área do profissional, painel da organização e canetinha de professores/DJs
- [ ] 🔑 Quem somos: botão "Editar Quem somos" → mudar título e texto das caixas, adicionar, remover e ordenar com ◀ ▶
- [ ] 🔑 Galeria: botão "Editar galeria" → mudar título e descrição de Vídeos, Fotos e Paparazzi (o título novo aparece também na página da seção)
- [ ] 🔑 Serviços: "+ Adicionar página oculta" → caixa com página própria; deslogado não aparece nem abre (404); desmarcar "Oculta" publica; clicar na caixa abre /servicos/<id>
- [ ] 🔑 Financeiro → aba Gráficos: recebido, em andamento, projeção mês a mês até set/27, potencial, recebido por produto e situação dos pedidos (conferir com a aba Tabelas)

## 9. Fale conosco
- [ ] Contatos com ícones: lpztraining@gmail.com, +55 11 94502-6344 (abre o WhatsApp), @lpztrainingsp
- [ ] Enviar mensagem pelo formulário → chega no e-mail da organização (Mailpit em teste)

## 10. Celular e acessibilidade
- [ ] Todas as telas no celular (compra, sacola, Minha área, QR, check-in)
- [ ] Navegação só pelo teclado (Tab) nos formulários principais

## 11. Antes de publicar
- [ ] Revisão por advogado do texto de reembolso e da Política de Privacidade
- [ ] Credenciais de produção (Mercado Pago, Google, Brevo) só no .env da VPS
- [ ] Deploy na VPS e teste completo de novo em produção
