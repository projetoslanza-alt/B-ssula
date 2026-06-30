# ADR-001: Monólito Modular

## Status
Aceito

## Contexto
Plataforma B2B multi-módulo com necessidade de deploy simples e transações consistentes.

## Decisão
Adotar monólito modular Next.js, com módulos delimitados por pastas e contratos explícitos.

## Consequências
- Deploy único na Vercel
- Possibilidade de extrair módulos futuramente
- Menor complexidade operacional inicial
