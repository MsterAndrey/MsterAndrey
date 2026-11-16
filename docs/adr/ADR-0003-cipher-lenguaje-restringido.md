# ADR-0003 — CIPHER como lenguaje total, tipado y basado en capacidades

**Estado:** Propuesto

## Contexto
Se desea un lenguaje propio para operaciones de seguridad. Un lenguaje de propósito general amplía la superficie de ataque y dificulta el análisis.

## Decisión
CIPHER es un DSL para políticas, detecciones y playbooks: total (siempre termina), sin E/S ambiental, efectos en el tipo, capacidades declaradas y firmadas, tipos `Secret<T>` y `Tainted<T>`, compila a IR interpretado por un evaluador mínimo; el subconjunto de políticas se traduce a SMT. Sin primitivas criptográficas en el lenguaje.

## Consecuencias
+ Analizable, verificable formalmente a medio plazo, superficie reducida.
− Menor expresividad; presión para añadir "escape hatches" (prohibidos para políticas).
− Coste de adopción (lenguaje nuevo).

## Alternativas
Usar Cedar/Rego/Sigma directamente (viable y más barato: se mantiene como **plan B** y como verificación cruzada); lenguaje general embebido (Lua/Python) rechazado.
