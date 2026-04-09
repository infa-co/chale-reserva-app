

## Diagnóstico de Erros e Plano de Correção

### Erros encontrados

**1. `PWAInstallPrompt` — `useState` retorna null (CRÍTICO — causa tela branca)**
- O componente é importado com `lazy()` na linha 15 do App.tsx, mas é renderizado na linha 69 do `ProtectedShell` **fora** do `<Suspense>` (que só envolve o `<Outlet />` nas linhas 65-67). Componentes lazy **devem** estar dentro de um `<Suspense>`. Isso causa conflito de instância do React no Vite, resultando no erro de `useState` null.
- **Correção**: Remover o `lazy()` do PWAInstallPrompt e importá-lo como import estático normal. O componente é pequeno e não justifica code-splitting. Isso elimina o erro definitivamente.

**2. `NewBooking` — `useNavigate()` fora do contexto do Router (CRÍTICO — causa tela branca)**
- O componente é lazy-loaded e, durante HMR do Vite, pode resolver com uma instância diferente de `react-router-dom`, perdendo o contexto do `<BrowserRouter>`. Isso é um bug intermitente do Vite com lazy imports e dep optimization (os logs do dev-server mostram chunks faltando: `chunk-FC7KAWTK.js` e `chunk-Y46F3F76.js`).
- **Correção**: Converter `NewBooking` de lazy para import estático, assim como já foi feito com `Dashboard`, `Settings` e outros. É uma página frequente e o ganho de lazy é mínimo.

**3. Warning: `Missing Description or aria-describedby` em DialogContent (MENOR)**
- Um ou mais diálogos usam `DialogContent` sem `DialogDescription`. Causa apenas um warning no console.
- **Correção**: Posso investigar quais diálogos são afetados e adicionar `DialogDescription` ou `aria-describedby` para eliminar o warning. Baixo risco.

### O que posso corrigir com segurança

| Erro | Risco de quebra | Ação |
|------|-----------------|------|
| PWAInstallPrompt useState null | Nenhum — só muda de lazy para import direto | Corrigir |
| NewBooking useNavigate fora do Router | Nenhum — só muda de lazy para import direto | Corrigir |
| DialogContent sem Description | Nenhum — só adiciona atributo de acessibilidade | Corrigir |

### Arquivos tocados
- `src/App.tsx` — mudar PWAInstallPrompt e NewBooking de `lazy()` para import estático
- Dialogs afetados — adicionar `DialogDescription` onde faltar

