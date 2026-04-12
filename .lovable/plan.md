

## Tornar a Gravação de Voz Mais Rápida e Fluida

### Problema atual
O hook `useSpeechToText` usa `interimResults = false` e `continuous = false`. Isso significa que o usuário fala, espera o silêncio, e só então o texto aparece de uma vez. Sensação lenta.

### Solução
Ativar **resultados parciais** (interim) para que o texto apareça em tempo real enquanto o usuário fala, e passar tanto o texto parcial quanto o final para o componente.

### Alterações

#### 1. `src/hooks/useSpeechToText.ts`
- Mudar `interimResults` para `true`
- Adicionar estado `transcript` (texto parcial visível em tempo real)
- O callback `onResult` continua sendo chamado apenas com o resultado **final**
- Adicionar callback `onInterim` para atualizar texto parcial durante a fala
- Exportar `transcript` para exibição em tempo real

#### 2. `src/components/forms/VoiceInputButton.tsx`
- Aceitar nova prop `onInterim` (opcional) para mostrar texto parcial
- Mostrar o texto parcial abaixo do botão enquanto grava (pequeno badge/tooltip com o que está sendo reconhecido)
- Passar `onInterim` ao hook
- Melhorar feedback visual: mostrar o texto sendo transcrito em tempo real num pequeno overlay

#### 3. `src/components/forms/GuestInfoForm.tsx`, `BookingDatesFormWithValidation.tsx`, `PaymentForm.tsx`, `NotesForm.tsx`
- Nenhuma mudança necessária nos forms — o VoiceInputButton já recebe `onResult` e vai funcionar igual, apenas mais rápido visualmente

### Resultado esperado
- O usuário fala e **vê o texto aparecendo em tempo real** enquanto dita
- O resultado final é aplicado ao campo quando o reconhecimento termina
- Sensação muito mais rápida e responsiva no mobile

### Arquivos tocados
- `src/hooks/useSpeechToText.ts`
- `src/components/forms/VoiceInputButton.tsx`

