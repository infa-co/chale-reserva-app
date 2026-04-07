

## Entrada por Voz nos Campos do Formulário de Reserva

### Abordagem
Usar a **Web Speech API** nativa do navegador (gratuita, sem API externa). Funciona em Chrome, Edge, Safari e na maioria dos navegadores mobile. Um botão de microfone aparece ao lado de cada campo de texto — ao clicar, o navegador escuta e preenche o campo com o que foi ditado.

### Plano

#### 1. Criar hook `useSpeechToText`
**Novo arquivo**: `src/hooks/useSpeechToText.ts`
- Encapsula a Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)
- Recebe `language: 'pt-BR'` como padrão
- Retorna: `{ isListening, startListening(callback), stopListening, isSupported }`
- O `callback` recebe o texto reconhecido para preencher o campo
- Trata erros mostrando toast amigável ("Não foi possível acessar o microfone")

#### 2. Criar componente `VoiceInputButton`
**Novo arquivo**: `src/components/forms/VoiceInputButton.tsx`
- Botão pequeno com ícone de microfone (Mic / MicOff do lucide-react)
- Quando gravando: ícone fica vermelho e pulsa (animação CSS)
- Props: `onResult(text)`, `disabled`, `fieldId` (para acessibilidade)
- Ao receber resultado, chama `onResult` com o texto reconhecido
- Se o navegador não suportar Speech API, o botão não aparece

#### 3. Adicionar botões de voz nos formulários
**Arquivos**: `src/components/forms/GuestInfoForm.tsx`, `src/components/forms/NotesForm.tsx`

Campos que ganham botão de microfone:
- Nome do hóspede
- Telefone (o reconhecimento de voz converte números falados)
- E-mail
- Cidade
- Observações/Notas

Campos que **não** ganham (melhor preencher manualmente):
- Estado (só 2 letras)
- CPF (formato específico)
- Data de nascimento (campo date picker)

O botão fica ao lado do input, similar ao botão de WhatsApp no telefone.

### Compatibilidade
- Chrome, Edge, Safari (desktop e mobile): suportado
- Firefox: não suporta Web Speech API — o botão simplesmente não aparece
- Não precisa de chave de API nem serviço externo

### Arquivos tocados
- `src/hooks/useSpeechToText.ts` (novo)
- `src/components/forms/VoiceInputButton.tsx` (novo)
- `src/components/forms/GuestInfoForm.tsx` (adicionar botões de voz)
- `src/components/forms/NotesForm.tsx` (adicionar botão de voz)

