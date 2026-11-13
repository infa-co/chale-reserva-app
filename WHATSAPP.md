# WhatsApp do Ordomo — como colocar no ar

O assistente recebe mensagens no número oficial do Ordomo, entende texto, foto e áudio, e
registra, consulta, altera e cancela reservas da conta de quem escreveu. Nada é gravado sem o
"sim" do dono.

## 1. Banco de dados

Aplicar as migrations, nesta ordem:

1. `supabase/migrations/20261112210000_fix_ical_sync_schedule.sql`
2. `supabase/migrations/20261113120000_plan_limits_and_whatsapp.sql`

A segunda cria as tabelas do WhatsApp, os limites de plano no banco e o agendamento do resumo
diário.

## 2. Funções a publicar

`whatsapp-webhook`, `whatsapp-link`, `whatsapp-daily-summary`, além de `check-subscription`,
`sync-ical`, `trigger-sync` e `export-ical` (todas mudaram).

## 3. Conta na Meta

1. Criar um app em developers.facebook.com com o produto **WhatsApp** e um número dedicado.
2. Em *WhatsApp > Configuração*, cadastrar o webhook:
   - URL: `https://lwmwwsthduvmuyhynwol.supabase.co/functions/v1/whatsapp-webhook`
   - Token de verificação: o mesmo valor do segredo `WHATSAPP_VERIFY_TOKEN`
   - Assinar o campo **messages**
3. Gerar um token permanente (usuário do sistema) com as permissões
   `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Para o resumo diário fora da janela de 24 horas, criar um modelo de mensagem de categoria
   **Utilidade**, idioma `pt_BR`, com três variáveis no corpo. Sugestão de texto:

   > Bom dia! Resumo do Ordomo: {{1}} chegada(s) e {{2}} saída(s) hoje, {{3}} chegada(s) amanhã. Responda esta mensagem para ver os detalhes.

## 4. Segredos no Supabase (Edge Functions > Secrets)

| Segredo | Obrigatório | O que é |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | sim | Token permanente da Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | sim | Id do número (não é o telefone) |
| `WHATSAPP_APP_SECRET` | sim | Chave secreta do app; valida a assinatura de cada mensagem |
| `WHATSAPP_VERIFY_TOKEN` | sim | Texto qualquer, igual ao cadastrado no webhook |
| `WHATSAPP_DISPLAY_NUMBER` | sim | Telefone com DDI, ex. `5511900000000`; aparece no app |
| `ANTHROPIC_API_KEY` | sim | Chave da API do Claude |
| `WHATSAPP_AI_MODEL` | não | Padrão `claude-opus-5-5`. `claude-haiku-5-5` custa bem menos |
| `WHATSAPP_AI_EFFORT` | não | Padrão `low` |
| `WHATSAPP_SUMMARY_TEMPLATE` | não | Nome do modelo aprovado do resumo diário |
| `TRANSCRIPTION_API_KEY` | não | Chave do serviço de transcrição; sem ela, áudios recebem "mande por texto" |
| `TRANSCRIPTION_API_URL` | não | Padrão: endpoint de transcrição da OpenAI |
| `TRANSCRIPTION_MODEL` | não | Padrão `whisper-1` |

Enquanto os cinco primeiros não existirem, o cartão em Configurações mostra "Em breve" e o
webhook responde 503.

## 5. Como o cliente usa

1. No app: Configurações > WhatsApp do Ordomo > **Vincular meu WhatsApp**.
2. O app mostra uma mensagem com um código de 8 dígitos (vale 15 minutos). O cliente envia
   essa mensagem do próprio WhatsApp; o número que enviou fica vinculado à conta.
3. A partir daí: "reserva para João, 20 a 23/12, R$ 900 no Pix", foto do print do Airbnb,
   "o chalé está livre no réveillon?", "muda a do João para sair dia 24", "cancela a da Ana".

Disponível nos planos Pro e Premium e durante o teste grátis.

## Limites e proteções

- Só números vinculados chegam à IA; números desconhecidos recebem apenas a instrução de vínculo.
- 60 mensagens por hora por número; 5 códigos errados por hora por número.
- Cada proposta vale 30 minutos e é revalidada (conflito de datas, limite do plano) no "sim".
- Fotos de até 8 MB; a conversa guarda só texto, por 2 horas de inatividade.
