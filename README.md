# LuaShield Obfuscator v2 🔐

O **LuaShield Obfuscator** é uma ferramenta poderosa e leve projetada para proteger scripts Lua, com foco especial no ambiente **FiveM**. Ele transforma seu código legível em um formato embaralhado e protegido por múltiplas camadas de criptografia, dificultando a engenharia reversa e o roubo de código.

---

## 💡 Como funciona? (Explicação Básica)

Imagine que você quer enviar uma carta secreta. Em vez de apenas escrever a mensagem, você faz o seguinte:
1. **Codifica**: Transforma a mensagem em um formato diferente (Base64).
2. **Inverte**: Escreve a mensagem de trás para frente.
3. **Desloca**: Troca cada letra pela letra que vem 2 posições depois no alfabeto.
4. **Embaralha**: Usa uma chave secreta (XOR) para misturar tudo.
5. **Transforma em Números**: Converte o resultado final em uma lista de números (bytes).

Para quem interceptar a carta, ela parecerá apenas uma lista de números sem sentido. O script ofuscado contém um "pequeno robô" (o runtime) que sabe exatamente como desfazer todos esses passos usando as chaves que você definiu, executando o código original apenas na memória do computador.

---

## 🛠️ Detalhes Técnicos (Pipeline de Ofuscação)

O processo de ofuscação segue um pipeline rigoroso de 5 camadas, implementado no arquivo [script.js](file:///c:/Users/guilh/OneDrive/Documentos/Gits/luaObfscator/script.js):

### 1. Codificação Base64
O código fonte original é convertido para Base64. Isso elimina caracteres especiais e prepara o código para manipulação binária.
```javascript
function b64e(s) { return btoa(unescape(encodeURIComponent(s))); }
```

### 2. Inversão de String (Reverse)
A string resultante é invertida. Isso quebra padrões comuns de leitura de assinaturas de scripts.

### 3. Deslocamento ASCII (Shift)
Cada caractere é deslocado no mapa ASCII com base em uma chave numérica (1-20). 
- **Exemplo**: Se a chave for 2, 'A' vira 'C'.

### 4. Operação XOR Bitwise
A camada mais forte de proteção. Cada byte da string é processado com uma operação XOR contra uma chave de 8 bits (1-255). 
- É uma operação matemática que requer a chave exata para ser revertida.

### 5. Conversão para Byte Array
O resultado final é transformado em um array de números inteiros, que é injetado em um template de script Lua.

---

## 🚀 O Runtime (O Código Protegido)

O código gerado não contém apenas os seus dados, mas também a lógica necessária para se autodecodificar:

1. **Nomes Aleatórios**: Todas as funções de decodificação e variáveis recebem nomes aleatórios (ex: `_abc123`) para impedir a análise estática simples.
2. **Proteção pcall**: Opcionalmente, o código é envolvido em um `pcall` (protected call), que captura erros durante a execução e evita que o script "quebre" o console do servidor com mensagens óbvias.
3. **Código Lixo (Junk Code)**: Instruções falsas e variáveis inúteis são inseridas para confundir ferramentas de desofuscação automática.
4. **Carregamento em Memória**: O código final recuperado é executado usando a função `load()`, garantindo que o código fonte original nunca seja salvo no disco, existindo apenas na RAM durante a execução.

---

## 🔑 Segurança e Recuperação

- **Chaves**: As chaves XOR e Shift são essenciais. Se você perdê-las, o código só poderá ser recuperado via **Brute Force**.
- **Brute Force**: A ferramenta incluída testa até 5.100 combinações para tentar encontrar as chaves originais baseando-se em palavras conhecidas (como `TriggerServerEvent`).

---
*Desenvolvido para a comunidade Lua & FiveM.*
