

## Adicionar Botões de Voz em Mais Campos

### Alterações

#### 1. `src/components/forms/GuestInfoForm.tsx`
- Adicionar `VoiceInputButton` no campo **Data de Nascimento** — o usuário dita a data (ex: "15 de março de 1990") e o sistema converte para o formato de data.

#### 2. `src/components/forms/BookingDatesFormWithValidation.tsx`
- Adicionar **1 único** `VoiceInputButton` na seção de datas (ao lado do título "Datas e Período"), que permite ditar as datas de check-in e check-out por voz.
- O botão interpreta o texto falado e tenta preencher as datas (lógica simples de parse de datas em português).

#### 3. `src/components/forms/PaymentForm.tsx`
- Adicionar **1 único** `VoiceInputButton` no campo **Valor Total** — o usuário dita o valor (ex: "trezentos e cinquenta reais") e o sistema preenche o campo numérico.

### Detalhes Técnicos
- Os campos de data (nascimento, check-in, check-out) e valor são difíceis de preencher por voz porque o Speech API retorna texto livre, não formatos estruturados. A abordagem será:
  - **Datas**: Tentar parsear texto como "quinze de março" ou "15/03/1990" para formato `YYYY-MM-DD`
  - **Valor**: Extrair números do texto falado (ex: "350" → `350`, "mil e duzentos" → funcionalidade básica)
- Criar uma função auxiliar `parseDateFromSpeech(text)` e `parseValueFromSpeech(text)` em um novo arquivo utilitário `src/lib/voiceParsers.ts`

### Arquivos tocados
- `src/lib/voiceParsers.ts` (novo — funções de parse de voz)
- `src/components/forms/GuestInfoForm.tsx` (botão voz na data de nascimento)
- `src/components/forms/BookingDatesFormWithValidation.tsx` (1 botão voz para datas)
- `src/components/forms/PaymentForm.tsx` (1 botão voz para valor)

